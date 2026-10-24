# C memory manager

A port of `Runtime/MemoryManager.ts` to C, which the TS runtime loads with `bun:ffi` (`Runtime/Allocator.ts`). It makes the same choices as the TS memory manager, so programs get the same addresses, with faster data structures: free block ends are in a hash map, the free lists by size are in an AVL tree, and removing a block from its free list is O(1) instead of a scan.

`bun index.ts run` uses the Rust runtime (`Runtime-Rust`) when it's built. Otherwise, or with `MYWASM_RUNTIME=bun`, it runs programs with Bun, using this memory manager when it's built and `MemoryManager.ts` otherwise. `MYWASM_MEMORY_MANAGER=ts` forces `MemoryManager.ts`.

## Building

```sh
make build-memory-manager
```

This builds `Runtime-C/build/libmywasm_memory.so` (`.dylib` on macOS) with `-O3`.

## Tests

- `tests/Unit/allocator.test.ts` checks that the memory manager through `bun:ffi` gives the same offsets and errors as `MemoryManager.ts`, and that the runtime uses it.
- `tests/NativeRuntime/allocator.test.ts` replays random allocations and frees through the TS, C and Rust memory managers, including misaligned frees and double frees, and compares every offset and error. `tests/alloc_driver.c` runs them for the C one.

See `benchmark/runtimes` for benchmarks.
