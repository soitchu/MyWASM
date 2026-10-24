# Runtime benchmarks

Compares running the same `.wasm` files with:

- Bun with `Runtime/MemoryManager.ts`, the original runtime (`MYWASM_RUNTIME=bun MYWASM_MEMORY_MANAGER=ts bun index.ts run`)
- Bun with the C memory manager through `bun:ffi` (`MYWASM_RUNTIME=bun bun index.ts run`)
- The Rust runtime, on Wasmtime with inlining (`Runtime-Rust`, which `bun index.ts run` uses when it's built)

It also replays each allocation-heavy program's allocations and frees, recorded from a run, through each memory manager on its own.

```sh
bun benchmark/runtimes/bench.ts [runs]
```

`alloc-heavy.mypl` and `merge-sort-alloc.mypl` are allocation-heavy programs written for this benchmark. `benchmark/mergeSort` is run with 10 million ints instead of 100 million, which would need over 1 GB of WASM memory.

## Results

Median of 5 runs on an x86-64 Linux machine with 32 threads. Programs are compiled with `-O 4`.

### Whole runs

| Program | Bun + MemoryManager.ts | Bun + C memory manager (FFI) | Speedup | Rust runtime (Wasmtime) | Speedup |
| --- | ---: | ---: | ---: | ---: | ---: |
| Native compiler compiling itself | 3189 ms | 400 ms | 8.0x | 173 ms | 18.4x |
| Merge sort, allocating per merge (1M ints) | 395 ms | 342 ms | 1.2x | 221 ms | 1.8x |
| Linked lists of arrays (1M nodes) | 1401 ms | 667 ms | 2.1x | 503 ms | 2.8x |
| benchmark/mergeSort (10M ints) | 1077 ms | 1061 ms | 1.0x | 845 ms | 1.3x |
| benchmark/prime (1M primes) | 2151 ms | 2156 ms | 1.0x | 2081 ms | 1.0x |

### Memory managers alone

| Program | Allocations + frees | MemoryManager.ts | C through bun:ffi | Speedup | C called from C | Speedup | Rust called from Rust | Speedup |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Native compiler compiling itself | 1,379,035 | 2839 ms | 127 ms | 22.4x | 108 ms | 26.4x | 52 ms | 54.4x |
| Merge sort, allocating per merge (1M ints) | 4,000,001 | 115 ms | 101 ms | 1.1x | 45 ms | 2.6x | 61 ms | 1.9x |
| Linked lists of arrays (1M nodes) | 5,330,272 | 1269 ms | 587 ms | 2.2x | 492 ms | 2.6x | 454 ms | 2.8x |

A call through `bun:ffi` costs about 14 ns, which is most of the time for merge sort's small allocations.

### Why inlining matters

Every array access calls a small helper (`$i32_get_array_elem` and friends) that binaryen leaves as a call. Bun's optimizing tier (JavaScriptCore's OMG) inlines it. Wasmtime doesn't by default, and only its Rust API can turn it on, which is why the runtime is in Rust. Without inlining, Wasmtime sorts 10M ints in about 1740 ms, against Bun's 935 ms; with it, about 845 ms.
