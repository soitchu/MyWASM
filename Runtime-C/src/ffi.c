// The memory manager's interface for the TS runtime, which loads it with
// bun:ffi (Runtime/NativeMemoryManager.ts). Each function is one FFI call,
// and errors are returned as codes since FFI can't pass strings back easily.

#include <stdlib.h>

#include "memory_manager.h"

enum {
    MM_OK = 0,
    MM_OUT_OF_MEMORY = 1,
    MM_OUT_OF_SYNC_1 = 2,
    MM_OUT_OF_SYNC_2 = 3,
};

typedef struct {
    MemoryManager *manager;
    uint32_t memory_size;
    int last_error;
} FfiMemoryManager;

static int error_code(const char *error) {
    // The messages come from memory_manager.c
    return error[1] == '1' ? MM_OUT_OF_SYNC_1 : MM_OUT_OF_SYNC_2;
}

FfiMemoryManager *mm_new(uint32_t memory_size) {
    FfiMemoryManager *ffi = calloc(1, sizeof(FfiMemoryManager));
    ffi->manager = memory_manager_new();
    ffi->memory_size = memory_size;
    return ffi;
}

void mm_free(FfiMemoryManager *ffi) {
    memory_manager_free(ffi->manager);
    free(ffi);
}

void mm_set_global_offset(FfiMemoryManager *ffi, uint32_t offset) {
    memory_manager_set_global_offset(ffi->manager, offset);
}

uint32_t mm_global_offset(FfiMemoryManager *ffi) {
    return memory_manager_global_offset(ffi->manager);
}

// allocate_memory in Runtime/WASM.ts. Returns the offset, or 0 on an error,
// which mm_last_error returns
uint32_t mm_allocate(FfiMemoryManager *ffi, uint32_t size) {
    const char *error = NULL;
    uint32_t offset;

    if (memory_manager_get_offset(ffi->manager, size, &offset, &error)) {
        return offset;
    }

    if (error) {
        ffi->last_error = error_code(error);
        return 0;
    }

    offset = memory_manager_global_offset(ffi->manager);

    if ((uint64_t)offset + size >= ffi->memory_size) {
        ffi->last_error = MM_OUT_OF_MEMORY;
        return 0;
    }

    memory_manager_increase_global_offset(ffi->manager, size);
    return offset;
}

// Frees size bytes at offset. Returns 0, or an error code
int mm_deallocate(FfiMemoryManager *ffi, uint32_t offset, uint32_t size) {
    const char *error = NULL;

    if (!memory_manager_add(ffi->manager, size, offset, &error)) {
        return error_code(error);
    }

    return MM_OK;
}

int mm_last_error(FfiMemoryManager *ffi) {
    return ffi->last_error;
}
