//! Runs MyWASM programs with Wasmtime, with the memory manager in the same
//! process. Port of Runtime/index.ts and Runtime/WASM.ts, and of the run
//! command in index.ts.
//!
//! Usage: mywasm-run [--debug] [--zero-on-dealloc] [--memory <size>]
//!                   [--no-inlining] <file.wasm>

use std::fs::File;
use std::io::{self, BufRead, BufWriter, Read, Stdout, Write};
use std::process::ExitCode;
use std::time::{Duration, Instant};

use mywasm_runtime::memory_manager::MemoryManager;
use wasmtime::{
    Caller, Config, Engine, Error, Inlining, Linker, Memory, MemoryType, Module, Result, Store, Val, bail, format_err,
};

const PAGE_SIZE: u64 = 65536;

struct State {
    memory: Option<Memory>,
    memory_manager: MemoryManager,
    zero_on_dealloc: bool,
    random_state: [u64; 2],
    stdout: BufWriter<Stdout>,
}

fn memory(caller: &Caller<'_, State>) -> Memory {
    caller.data().memory.expect("the memory is set before instantiating")
}

fn read_i32(data: &[u8], address: usize) -> i32 {
    i32::from_le_bytes(data[address..address + 4].try_into().unwrap())
}

//----------------------------------------------------------------------
// Imports
//----------------------------------------------------------------------

/// print(string pointer): the length is in the 4 bytes before the pointer.
/// Characters are UTF-16 code units in i32s, like JS strings, and a
/// backslash followed by an n is printed as a newline
fn print(mut caller: Caller<'_, State>, index: i32) -> Result<()> {
    let index = index as u32 as usize;

    // The TS runtime reads the string at index / 4 in an Int32Array, which
    // finds nothing when index isn't a multiple of 4
    if index % 4 != 0 || index < 4 {
        return Ok(());
    }

    let memory = memory(&caller);
    let (data, state) = memory.data_and_store_mut(&mut caller);
    let length = read_i32(data, index - 4);

    if length <= 0 {
        return Ok(());
    }

    let length = length as usize;

    if index + length * 4 > data.len() {
        bail!("String is outside of memory");
    }

    let mut units: Vec<u16> = Vec::with_capacity(length);

    for i in 0..length {
        let unit = read_i32(data, index + i * 4) as u16;

        if unit == b'n' as u16 && units.last() == Some(&(b'\\' as u16)) {
            *units.last_mut().unwrap() = b'\n' as u16;
        } else {
            units.push(unit);
        }
    }

    // Lone surrogates become U+FFFD, like when JS writes a string to stdout
    state.stdout.write_all(String::from_utf16_lossy(&units).as_bytes())?;
    Ok(())
}

/// input(): reads a line from stdin and returns it as a string, or null at
/// the end of stdin
fn input(mut caller: Caller<'_, State>) -> Result<i32> {
    caller.data_mut().stdout.flush()?;

    let mut line = Vec::new();

    if io::stdin().lock().read_until(b'\n', &mut line)? == 0 {
        return Ok(0);
    }

    if line.last() == Some(&b'\n') {
        line.pop();
    }

    let units: Vec<u16> = String::from_utf8_lossy(&line).encode_utf16().collect();

    let string_ini = caller
        .get_export("string_ini")
        .and_then(|export| export.into_func())
        .ok_or_else(|| format_err!("The module doesn't export string_ini"))?
        .typed::<i32, i32>(&caller)?;

    let main_string_ini_unpooled = caller
        .get_export("main_string_ini_unpooled")
        .and_then(|export| export.into_func())
        .ok_or_else(|| format_err!("The module doesn't export main_string_ini_unpooled"))?
        .typed::<i32, i32>(&caller)?;

    let pointer = string_ini.call(&mut caller, units.len() as i32)?;
    let memory = memory(&caller);
    let data = memory.data_mut(&mut caller);

    // Like string_ini_assign for each character
    for (i, unit) in units.iter().enumerate() {
        let address = pointer as u32 as usize + i * 4;
        data[address..address + 4].copy_from_slice(&(*unit as i32).to_le_bytes());
    }

    main_string_ini_unpooled.call(&mut caller, pointer)
}

fn sleep(mut caller: Caller<'_, State>, ms: i32) -> Result<()> {
    caller.data_mut().stdout.flush()?;

    if ms > 0 {
        std::thread::sleep(Duration::from_millis(ms as u64));
    }

    Ok(())
}

/// xorshift128+, giving doubles in [0, 1) like Math.random
fn random(mut caller: Caller<'_, State>) -> f64 {
    let state = &mut caller.data_mut().random_state;
    let mut s1 = state[0];
    let s0 = state[1];

    state[0] = s0;
    s1 ^= s1 << 23;
    state[1] = s1 ^ s0 ^ (s1 >> 17) ^ (s0 >> 26);

    let value = state[1].wrapping_add(s0);
    (value >> 11) as f64 / 9007199254740992.0
}

fn allocate_memory(mut caller: Caller<'_, State>, size: i32) -> Result<i32> {
    let memory_size = memory(&caller).data_size(&caller) as u64;
    let offset = caller
        .data_mut()
        .memory_manager
        .allocate(size as u32, memory_size)
        .map_err(|error| format_err!(error))?;

    Ok(offset as i32)
}

fn deallocate_memory(mut caller: Caller<'_, State>, index: i32, size: i32) -> Result<()> {
    let index = index as u32;
    let size = size as u32;
    let memory = memory(&caller);
    let (data, state) = memory.data_and_store_mut(&mut caller);

    // The TS runtime zeroes the Int32Array from index / 4 for size / 4
    // elements, which does nothing when index isn't a multiple of 4
    if state.zero_on_dealloc && index % 4 == 0 {
        let start = index as usize;
        let end = (start + (size as usize).div_ceil(4) * 4).min(data.len());

        if start < end {
            data[start..end].fill(0);
        }
    }

    state.memory_manager.add(size, index).map_err(|error| format_err!(error))
}

//----------------------------------------------------------------------
// Command line
//----------------------------------------------------------------------

struct Options {
    debug: bool,
    zero_on_dealloc: bool,
    inlining: bool,
    memory_pages: u64,
    path: String,
}

fn usage() -> ! {
    eprintln!("Usage: mywasm-run [--debug] [--zero-on-dealloc] [--memory <size>] [--no-inlining] <file.wasm>");
    std::process::exit(1);
}

/// Like convertToWASMPages in index.ts: 10K, 10kb, 10M, 10mb, 1G, 4.5gb
fn parse_memory_pages(size: &str) -> u64 {
    let lower = size.to_lowercase();
    let bytes = lower.as_bytes();
    let unit_length = if bytes.len() >= 2 && !bytes[bytes.len() - 2].is_ascii_digit() { 2 } else { 1 };

    if bytes.len() <= unit_length {
        eprintln!("Invalid size string: {lower}");
        std::process::exit(1);
    }

    let (number, unit) = lower.split_at(lower.len() - unit_length);
    let multiplier = match unit {
        "kb" | "k" => 1024.0,
        "mb" | "m" => 1024.0 * 1024.0,
        "gb" | "g" => 1024.0 * 1024.0 * 1024.0,
        _ => {
            eprintln!("Invalid size string: {lower}: Unsupported size unit: {unit}");
            std::process::exit(1);
        }
    };

    let bytes = (number.parse::<f64>().unwrap_or(f64::NAN) * multiplier).floor();

    if !(bytes > 0.0) || bytes % PAGE_SIZE as f64 != 0.0 {
        eprintln!("Invalid size string: {lower}: The memory size must be a multiple of 64kb");
        std::process::exit(1);
    }

    (bytes / PAGE_SIZE as f64) as u64
}

fn parse_options() -> Options {
    let mut options = Options {
        debug: false,
        zero_on_dealloc: false,
        inlining: true,
        memory_pages: 16,
        path: String::new(),
    };

    let mut args = std::env::args().skip(1);

    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--debug" => options.debug = true,
            "--zero-on-dealloc" => options.zero_on_dealloc = true,
            "--no-inlining" => options.inlining = false,
            "--memory" => options.memory_pages = parse_memory_pages(&args.next().unwrap_or_else(|| usage())),
            _ if arg.starts_with('-') || !options.path.is_empty() => usage(),
            _ => options.path = arg,
        }
    }

    if options.path.is_empty() {
        usage();
    }

    options
}

fn random_seed() -> [u64; 2] {
    let mut bytes = [0u8; 16];

    if File::open("/dev/urandom").and_then(|mut file| file.read_exact(&mut bytes)).is_ok() {
        let seed = [
            u64::from_le_bytes(bytes[..8].try_into().unwrap()),
            u64::from_le_bytes(bytes[8..].try_into().unwrap()),
        ];

        if seed != [0, 0] {
            return seed;
        }
    }

    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |time| time.as_nanos() as u64);

    [nanos ^ 0x9E3779B97F4A7C15, nanos.rotate_left(32) ^ 0xD1B54A32D192ED03]
}

fn run(options: &Options) -> Result<(), (&'static str, Error)> {
    let mut config = Config::new();

    // Inlines small functions like the array access helpers, which
    // Wasmtime doesn't do by default
    config.compiler_inlining(if options.inlining { Inlining::Yes } else { Inlining::No });

    let engine = Engine::new(&config).map_err(|error| ("Error: ", error))?;
    let wasm = std::fs::read(&options.path).map_err(|error| ("Error: ", format_err!("Could not open {}: {error}", options.path)))?;
    let module = Module::new(&engine, wasm).map_err(|error| ("CompileError: ", error))?;

    let mut store = Store::new(
        &engine,
        State {
            memory: None,
            memory_manager: MemoryManager::new(),
            zero_on_dealloc: options.zero_on_dealloc,
            random_state: random_seed(),
            stdout: BufWriter::with_capacity(1 << 16, io::stdout()),
        },
    );

    let memory_type = MemoryType::new(options.memory_pages as u32, Some(options.memory_pages as u32));
    let memory = Memory::new(&mut store, memory_type).map_err(|error| ("Error: ", error))?;
    store.data_mut().memory = Some(memory);

    let mut linker = Linker::new(&engine);
    let link = |result: Result<&mut Linker<State>>| result.map(|_| ()).map_err(|error| ("Error: ", error));

    link(linker.define(&store, "env", "memory", memory))?;
    link(linker.func_wrap("env", "print", print))?;
    link(linker.func_wrap("env", "input", input))?;
    link(linker.func_wrap("env", "sleep", sleep))?;
    link(linker.func_wrap("env", "random", random))?;
    link(linker.func_wrap("env", "allocate_memory", allocate_memory))?;
    link(linker.func_wrap("env", "deallocate_memory", deallocate_memory))?;

    let instance = linker.instantiate(&mut store, &module).map_err(|error| ("LinkError: ", error))?;

    // The data section stores where free memory starts at offset 4
    store.data_mut().memory_manager.global_offset = read_i32(memory.data(&store), 4) as u32;

    let main = instance
        .get_func(&mut store, "main")
        .ok_or_else(|| ("TypeError: ", format_err!("The module doesn't export a main function")))?;

    if options.debug {
        let _ = writeln!(store.data_mut().stdout, "stdout:");
    }

    let start = Instant::now();

    // main may or may not return a value
    let result_count = main.ty(&store).results().len();
    let mut results = vec![Val::I32(0); result_count];

    let result = main.call(&mut store, &[], &mut results);
    let _ = store.data_mut().stdout.flush();
    result.map_err(|error| ("RuntimeError: ", error))?;

    if options.debug {
        let stdout = &mut store.data_mut().stdout;
        let _ = writeln!(stdout, "\n==========================");
        let _ = writeln!(stdout, "Time taken: {}ms", start.elapsed().as_secs_f64() * 1000.0);
        let _ = writeln!(stdout, "==========================\n");
        let _ = stdout.flush();
    }

    Ok(())
}

fn main() -> ExitCode {
    let options = parse_options();

    match run(&options) {
        Ok(()) => ExitCode::SUCCESS,
        Err((prefix, error)) => {
            eprintln!("{prefix}{error:?}");
            ExitCode::FAILURE
        }
    }
}
