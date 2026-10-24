//! Reads allocator operations from stdin and prints the result of each, for
//! comparing with Runtime/MemoryManager.ts. Same protocol as
//! Runtime-C/tests/alloc_driver.c:
//!   a <size>          allocate, like allocate_memory; prints the offset
//!   f <offset> <size> free, like deallocate_memory; prints "ok"
//!   g <offset>        set the global offset
//! After each operation it also prints the global offset. An error prints
//! "error <message>" and stops.
//!
//! With --bench, it reads every operation first, then runs them without
//! printing and prints how long they took in nanoseconds.

use std::io::{Read, Write};
use std::time::Instant;

use mywasm_runtime::memory_manager::MemoryManager;

enum Op {
    Allocate(u32),
    Free(u32, u32),
    SetGlobalOffset(u32),
}

fn parse(input: &str) -> Vec<Op> {
    let mut words = input.split_ascii_whitespace();
    let mut ops = Vec::new();
    let number = |words: &mut std::str::SplitAsciiWhitespace| -> u32 {
        words.next().and_then(|word| word.parse().ok()).expect("malformed operation")
    };

    while let Some(kind) = words.next() {
        ops.push(match kind {
            "a" => Op::Allocate(number(&mut words)),
            "f" => {
                let offset = number(&mut words);
                Op::Free(offset, number(&mut words))
            }
            "g" => Op::SetGlobalOffset(number(&mut words)),
            _ => panic!("unknown operation {kind}"),
        });
    }

    ops
}

// Like allocate_memory, but without a memory size limit
fn allocate(manager: &mut MemoryManager, size: u32) -> Result<u32, &'static str> {
    manager.allocate(size, u64::MAX)
}

fn main() {
    let mut input = String::new();
    std::io::stdin().read_to_string(&mut input).expect("couldn't read stdin");
    let ops = parse(&input);
    let mut manager = MemoryManager::new();

    if std::env::args().nth(1).as_deref() == Some("--bench") {
        let mut checksum: u64 = 0;
        let start = Instant::now();

        for op in &ops {
            let result = match *op {
                Op::Allocate(size) => allocate(&mut manager, size).map(|offset| checksum += offset as u64),
                Op::Free(offset, size) => manager.add(size, offset),
                Op::SetGlobalOffset(offset) => {
                    manager.global_offset = offset;
                    Ok(())
                }
            };

            if let Err(error) = result {
                println!("error {error}");
                std::process::exit(1);
            }
        }

        println!("{} {}", start.elapsed().as_nanos(), checksum);
        return;
    }

    let stdout = std::io::stdout();
    let mut out = std::io::BufWriter::new(stdout.lock());

    for op in ops {
        let result = match op {
            Op::Allocate(size) => allocate(&mut manager, size).map(|offset| write!(out, "{offset}").unwrap()),
            Op::Free(offset, size) => manager.add(size, offset).map(|()| write!(out, "ok").unwrap()),
            Op::SetGlobalOffset(offset) => {
                manager.global_offset = offset;
                write!(out, "ok").unwrap();
                Ok(())
            }
        };

        if let Err(error) = result {
            writeln!(out, "error {error}").unwrap();
            return;
        }

        writeln!(out, " {}", manager.global_offset).unwrap();
    }
}
