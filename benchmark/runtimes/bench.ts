// Benchmarks whole runs of the same .wasm files with Bun (index.ts run with
// MYWASM_RUNTIME=bun) using MemoryManager.ts, Bun using the C memory manager
// through bun:ffi, and the Rust runtime (Wasmtime). Also benchmarks the
// memory managers alone, replaying allocation traces recorded from the
// programs.
//
// Usage: bun benchmark/runtimes/bench.ts [runs]

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as Compiler from "../../Compiler/index.ts";
import { buildStage } from "../../Compiler-WASM/build";
import { nativeCompilerInput } from "../../Compiler-WASM/native";
import { MemoryManager } from "../../Runtime/MemoryManager";
import { NativeAllocator } from "../../Runtime/Allocator";

const ROOT = path.join(__dirname, "../..");
const RUNTIME_C = path.join(ROOT, "Runtime-C");
const ALLOC_DRIVER = path.join(RUNTIME_C, "build/alloc-driver");
const RUNTIME_RUST = path.join(ROOT, "Runtime-Rust");
const RUST_RUNTIME = path.join(RUNTIME_RUST, "target/release/mywasm-run");
const RUST_ALLOC_DRIVER = path.join(RUNTIME_RUST, "target/release/alloc-driver");
const RUNS = Number(process.argv[2] ?? 5);
const workDir = mkdtempSync(path.join(tmpdir(), "runtime-c-bench-"));

type Program = {
  name: string;
  source: string;
  stdin?: string;
  memory: string;
  pages: number;
  allocationHeavy: boolean;
};

async function compile(source: string, wasm: string) {
  const log = console.log;
  console.log = () => {};

  try {
    await Compiler.init(source, wasm, { O: 4, S: 0, fastMath: false, returnBuffer: false, unsafeArray: false });
  } finally {
    console.log = log;
  }
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function timeRun(cmd: string[], stdin: string, env: Record<string, string> = {}) {
  const start = performance.now();
  const result = Bun.spawnSync({ cmd, stdin: Buffer.from(stdin), env: { ...process.env, ...env } });
  const ms = performance.now() - start;

  if (result.exitCode !== 0) {
    throw new Error(`${cmd.join(" ")} failed:\n${result.stderr.toString().slice(-2000)}`);
  }

  return { ms, stdout: result.stdout.toString() };
}

// Replays a trace through Runtime/MemoryManager.ts like WASM.ts calls it
function replayTs(lines: string[]) {
  const ops = lines.map((line) => line.split(" ").map((part, i) => (i === 0 ? part : Number(part))));
  const manager = new MemoryManager();
  let checksum = 0;

  const start = performance.now();

  for (const [kind, a, b] of ops) {
    if (kind === "a") {
      let offset = manager.getOffset(a as number);

      if (!offset) {
        offset = manager.globalOffset;
        manager.increaseGlobalOffset(a as number);
      }

      checksum += offset;
    } else if (kind === "f") {
      manager.add(b as number, a as number);
    } else {
      manager.globalOffset = a as number;
    }
  }

  return { ms: performance.now() - start, checksum };
}

// Replays a trace through the C memory manager through bun:ffi, which is
// what the TS runtime uses
function replayFfi(lines: string[]) {
  const ops = lines.map((line) => line.split(" ").map((part, i) => (i === 0 ? part : Number(part))));
  const allocator = new NativeAllocator(2 ** 32 - 1);
  let checksum = 0;

  const start = performance.now();

  for (const [kind, a, b] of ops) {
    if (kind === "a") {
      checksum += allocator.allocate(a as number);
    } else if (kind === "f") {
      allocator.free(a as number, b as number);
    } else {
      allocator.setGlobalOffset(a as number);
    }
  }

  return { ms: performance.now() - start, checksum };
}

function replayDriver(driver: string, trace: string) {
  const result = Bun.spawnSync({ cmd: [driver, "--bench"], stdin: Bun.file(trace) });
  const [ns, checksum] = result.stdout.toString().trim().split(" ");

  if (result.exitCode !== 0) {
    throw new Error(`alloc-driver failed: ${result.stdout}`);
  }

  return { ms: Number(ns) / 1e6, checksum: Number(checksum) };
}

function format(ms: number) {
  return ms >= 100 ? ms.toFixed(0) : ms.toFixed(1);
}

async function main() {
  // Builds the memory manager library and the alloc driver
  const make = Bun.spawnSync({ cmd: ["make", "-C", RUNTIME_C] });

  if (make.exitCode !== 0) {
    throw new Error(make.stderr.toString());
  }

  const cargo = Bun.spawnSync({
    cmd: ["cargo", "build", "--release", "--manifest-path", path.join(RUNTIME_RUST, "Cargo.toml")],
  });

  if (cargo.exitCode !== 0) {
    throw new Error(cargo.stderr.toString());
  }

  // The merge sort benchmark sorts 100 million ints, which needs over 1 GB
  // of WASM memory, so this sorts 10 million
  const mergeSource = path.join(workDir, "merge.mypl");
  writeFileSync(
    mergeSource,
    readFileSync(path.join(ROOT, "benchmark/mergeSort/merge.mypl"), "utf8").replace("100000000", "10000000")
  );

  const compilerSource = path.join(workDir, "compiler.mypl");
  buildStage("compile", compilerSource);

  const programs: Program[] = [
    {
      name: "Native compiler compiling itself",
      source: compilerSource,
      stdin: nativeCompilerInput(compilerSource, false),
      memory: "256M",
      pages: 4096,
      allocationHeavy: true,
    },
    {
      name: "Merge sort, allocating per merge (1M ints)",
      source: path.join(__dirname, "merge-sort-alloc.mypl"),
      memory: "64M",
      pages: 1024,
      allocationHeavy: true,
    },
    {
      name: "Linked lists of arrays (1M nodes)",
      source: path.join(__dirname, "alloc-heavy.mypl"),
      memory: "64M",
      pages: 1024,
      allocationHeavy: true,
    },
    {
      name: "benchmark/mergeSort (10M ints)",
      source: mergeSource,
      memory: "128M",
      pages: 2048,
      allocationHeavy: false,
    },
    {
      name: "benchmark/prime (1M primes)",
      source: path.join(ROOT, "benchmark/prime/prime.mypl"),
      memory: "16M",
      pages: 256,
      allocationHeavy: false,
    },
  ];

  console.log(`Runs per measurement: ${RUNS} (median)\n`);
  console.log("## Whole runs (wall time, ms)\n");
  console.log(
    "| Program | Bun + MemoryManager.ts | Bun + C memory manager (FFI) | Speedup | Rust runtime (Wasmtime) | Speedup |"
  );
  console.log("| --- | ---: | ---: | ---: | ---: | ---: |");

  const traces: { name: string; trace: string }[] = [];

  for (const [i, program] of programs.entries()) {
    const wasm = path.join(workDir, `program${i}.wasm`);
    await compile(program.source, wasm);

    const stdin = program.stdin ?? "";
    const tsCmd = [process.execPath, path.join(ROOT, "index.ts"), "run", "--memory", program.memory, wasm];
    const rustCmd = [RUST_RUNTIME, "--memory", program.memory, wasm];

    const BUN = { MYWASM_RUNTIME: "bun" };
    const TS_MEMORY = { ...BUN, MYWASM_MEMORY_MANAGER: "ts" };

    // Warm up the file cache, and check that all print the same thing
    const tsOutput = timeRun(tsCmd, stdin, TS_MEMORY).stdout;

    if (
      timeRun(tsCmd, stdin, BUN).stdout !== tsOutput ||
      timeRun(rustCmd, stdin).stdout !== tsOutput
    ) {
      throw new Error(`${program.name}: the runtimes printed different output`);
    }

    const tsTimes: number[] = [];
    const ffiTimes: number[] = [];
    const rustTimes: number[] = [];

    for (let run = 0; run < RUNS; run++) {
      tsTimes.push(timeRun(tsCmd, stdin, TS_MEMORY).ms);
      ffiTimes.push(timeRun(tsCmd, stdin, BUN).ms);
      rustTimes.push(timeRun(rustCmd, stdin).ms);
    }

    const ts = median(tsTimes);
    const ffi = median(ffiTimes);
    const rust = median(rustTimes);
    console.log(
      `| ${program.name} | ${format(ts)} | ${format(ffi)} | ${(ts / ffi).toFixed(1)}x | ${format(rust)} | ${(ts / rust).toFixed(1)}x |`
    );

    if (program.allocationHeavy) {
      const trace = path.join(workDir, `trace${i}.txt`);
      const record = Bun.spawnSync({
        cmd: [process.execPath, path.join(__dirname, "record-trace.ts"), wasm, String(program.pages), trace],
        stdin: Buffer.from(stdin),
      });

      if (record.exitCode !== 0) {
        throw new Error(`Recording ${program.name} failed:\n${record.stderr.toString().slice(-2000)}`);
      }

      traces.push({ name: program.name, trace });
    }
  }

  console.log("\n## Memory managers alone (replaying each program's allocations, ms)\n");
  console.log(
    "| Program | Allocations + frees | MemoryManager.ts | C through bun:ffi | Speedup | C called from C | Speedup | Rust called from Rust | Speedup |"
  );
  console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");

  for (const { name, trace } of traces) {
    const lines = readFileSync(trace, "utf8").trim().split("\n");
    const tsTimes: number[] = [];
    const ffiTimes: number[] = [];
    const cTimes: number[] = [];
    const rustTimes: number[] = [];

    for (let run = 0; run < RUNS; run++) {
      const ts = replayTs(lines);
      const ffi = replayFfi(lines);
      const c = replayDriver(ALLOC_DRIVER, trace);
      const rust = replayDriver(RUST_ALLOC_DRIVER, trace);

      // All must hand out the same offsets
      if (ts.checksum !== c.checksum || ffi.checksum !== c.checksum || rust.checksum !== c.checksum) {
        throw new Error(`${name}: the memory managers gave different offsets`);
      }

      tsTimes.push(ts.ms);
      ffiTimes.push(ffi.ms);
      cTimes.push(c.ms);
      rustTimes.push(rust.ms);
    }

    const ts = median(tsTimes);
    const ffi = median(ffiTimes);
    const c = median(cTimes);
    const rust = median(rustTimes);
    const count = lines.length - 1;

    if (count === 0) {
      throw new Error(`${name}: no allocations were recorded`);
    }

    console.log(
      `| ${name} | ${count.toLocaleString("en-US")} | ${format(ts)} | ${format(ffi)} | ${(ts / ffi).toFixed(1)}x | ${format(c)} | ${(ts / c).toFixed(1)}x | ${format(rust)} | ${(ts / rust).toFixed(1)}x |`
    );
  }
}

try {
  await main();
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
