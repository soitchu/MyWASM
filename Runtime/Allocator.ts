// The memory manager behind allocate_memory and deallocate_memory. It's the
// C memory manager (Runtime-C/src/memory_manager.c) loaded with bun:ffi when
// it's been built (make build-memory-manager), and MemoryManager.ts
// otherwise. Both give out the same offsets. Set MYWASM_MEMORY_MANAGER=ts
// to use MemoryManager.ts anyway.

import { dlopen, FFIType, suffix, type Pointer } from "bun:ffi";
import { existsSync } from "node:fs";
import path from "node:path";
import { MemoryManager } from "./MemoryManager.ts";

export interface Allocator {
    // Returns the offset of size free bytes, or throws
    allocate(size: number): number;
    // Frees size bytes at offset, or throws
    free(offset: number, size: number): void;
    // Sets where memory that hasn't been allocated yet starts
    setGlobalOffset(offset: number): void;
}

export class TsAllocator implements Allocator {
    manager = new MemoryManager();

    constructor(private totalMemory: number) {}

    allocate(size: number) {
        const foundOffset = this.manager.getOffset(size);

        if (foundOffset) {
            return foundOffset;
        }

        const offset = this.manager.globalOffset;

        if (this.manager.globalOffset + size >= this.totalMemory) {
            throw new Error("Out of memory");
        }

        this.manager.increaseGlobalOffset(size);
        return offset;
    }

    free(offset: number, size: number) {
        this.manager.add(size, offset);
    }

    setGlobalOffset(offset: number) {
        this.manager.globalOffset = offset;
    }
}

// Error codes from Runtime-C/src/ffi.c
const ERRORS: Record<number, string> = {
    1: "Out of memory",
    2: "(1) availOffsets and free_mem are out of sync",
    3: "(2) availOffsets and free_mem are out of sync",
};

export const NATIVE_LIBRARY = path.join(__dirname, `../Runtime-C/build/libmywasm_memory.${suffix}`);

function loadLibrary() {
    return dlopen(NATIVE_LIBRARY, {
        mm_new: { args: [FFIType.u32], returns: FFIType.ptr },
        mm_free: { args: [FFIType.ptr], returns: FFIType.void },
        mm_set_global_offset: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
        mm_allocate: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
        mm_deallocate: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
        mm_last_error: { args: [FFIType.ptr], returns: FFIType.i32 },
    }).symbols;
}

let library: ReturnType<typeof loadLibrary> | null | undefined;

// The library, or null when it hasn't been built
function nativeLibrary() {
    if (library === undefined) {
        library = existsSync(NATIVE_LIBRARY) ? loadLibrary() : null;
    }

    return library;
}

// Frees the C memory manager once its allocator is garbage collected
const finalizer = new FinalizationRegistry((manager: Pointer) => {
    nativeLibrary()?.mm_free(manager);
});

export class NativeAllocator implements Allocator {
    private manager: Pointer;
    private symbols: NonNullable<ReturnType<typeof nativeLibrary>>;

    constructor(totalMemory: number) {
        const symbols = nativeLibrary();

        if (symbols === null) {
            throw new Error(`The C memory manager hasn't been built: ${NATIVE_LIBRARY}`);
        }

        this.symbols = symbols;
        this.manager = symbols.mm_new(totalMemory) as Pointer;
        finalizer.register(this, this.manager);
    }

    allocate(size: number) {
        const offset = this.symbols.mm_allocate(this.manager, size);

        // Offset 0 is null, so it's never given out
        if (offset === 0) {
            throw new Error(ERRORS[this.symbols.mm_last_error(this.manager)]);
        }

        return offset;
    }

    free(offset: number, size: number) {
        const error = this.symbols.mm_deallocate(this.manager, offset, size);

        if (error !== 0) {
            throw new Error(ERRORS[error]);
        }
    }

    setGlobalOffset(offset: number) {
        this.symbols.mm_set_global_offset(this.manager, offset);
    }
}

export function isNativeAllocatorAvailable() {
    return nativeLibrary() !== null;
}

export function createAllocator(totalMemory: number): Allocator {
    if (process.env.MYWASM_MEMORY_MANAGER !== "ts" && isNativeAllocatorAvailable()) {
        return new NativeAllocator(totalMemory);
    }

    return new TsAllocator(totalMemory);
}
