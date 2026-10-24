# Rust runtime

Runs MyWASM programs with [Wasmtime](https://wasmtime.dev/) (v49.0.4) through its Rust API, with the memory manager in the same process. It's a port of `Runtime/WASM.ts` that turns on Wasmtime's function inlining, which only the Rust API exposes.

`bun index.ts run` uses it when it's built. `MYWASM_RUNTIME=bun` runs programs with Bun instead.

Inlining matters because every array access is a call to a small helper (`$i32_get_array_elem` and friends) that binaryen leaves as a call. Without inlining, Wasmtime sorts 10M ints in about 1740 ms; with it, about 845 ms, against Bun's 935 ms.

`src/memory_manager.rs` is a port of `Runtime/MemoryManager.ts` that makes the same choices, so programs get the same addresses, with a hash map for free block ends, a B-tree for the free lists by size, and O(1) removal from a free list.

## Building

```sh
make build-runtime-rust
```

This builds `Runtime-Rust/target/release/mywasm-run` with `opt-level = 3` and LTO.

## Usage

```sh
bun index.ts compile program.mypl program.wasm
Runtime-Rust/target/release/mywasm-run [--debug] [--zero-on-dealloc] [--memory <size>] [--no-inlining] program.wasm
```

The options are the same as `bun index.ts run`, except that `--debug` only prints the time taken, not the memory, and there's no `--compile`. `--no-inlining` turns Wasmtime's inlining off, for comparison.

## Tests and benchmarks

`tests/NativeRuntime` runs this runtime and its memory manager against the TS ones and compares their output and offsets. `benchmark/runtimes` benchmarks it against Bun; it's 1.3x to 18x faster than the original runtime on all but compute-only programs.
