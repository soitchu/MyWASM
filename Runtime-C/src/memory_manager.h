// Port of Runtime/MemoryManager.ts. It makes the same choices as the TS
// allocator, so programs get the same addresses, but with faster data
// structures: free block ends are in a hash map, the free lists by size are
// in an AVL tree, and removing a block from its free list is O(1).

#ifndef MEMORY_MANAGER_H
#define MEMORY_MANAGER_H

#include <stdbool.h>
#include <stdint.h>

typedef struct MemoryManager MemoryManager;

MemoryManager *memory_manager_new(void);
void memory_manager_free(MemoryManager *manager);

// Where memory that hasn't been allocated yet starts
uint32_t memory_manager_global_offset(const MemoryManager *manager);
void memory_manager_set_global_offset(MemoryManager *manager, uint32_t offset);
void memory_manager_increase_global_offset(MemoryManager *manager, uint32_t size);

// Takes a freed block of at least size bytes. Returns false when there
// isn't one, and then the caller takes memory from the global offset
bool memory_manager_get_offset(MemoryManager *manager, uint32_t size, uint32_t *offset, const char **error);

// Frees size bytes at offset, merging it with neighboring free blocks
bool memory_manager_add(MemoryManager *manager, uint32_t size, uint32_t offset, const char **error);

#endif
