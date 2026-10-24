# Builds the C memory manager, which the TS runtime loads with bun:ffi
CFLAGS ?= -O3
CFLAGS += -std=c11 -D_GNU_SOURCE -Wall -Wextra -Wno-unused-parameter

ifeq ($(shell uname -s),Darwin)
  LIB_SUFFIX := dylib
else
  LIB_SUFFIX := so
endif

MEMORY_LIB := build/libmywasm_memory.$(LIB_SUFFIX)

all: $(MEMORY_LIB) build/alloc-driver

memory: $(MEMORY_LIB)

$(MEMORY_LIB): src/ffi.c src/memory_manager.c src/memory_manager.h
	mkdir -p build
	$(CC) $(CFLAGS) -fPIC -shared -o $@ src/ffi.c src/memory_manager.c

# Runs allocations and frees through the memory manager, for testing it
# against Runtime/MemoryManager.ts
build/alloc-driver: tests/alloc_driver.c src/memory_manager.c src/memory_manager.h
	mkdir -p build
	$(CC) $(CFLAGS) -Isrc -o $@ tests/alloc_driver.c src/memory_manager.c

clean:
	rm -rf build

.PHONY: all memory clean
