// Reads allocator operations from stdin and prints the result of each, for
// comparing with Runtime/MemoryManager.ts:
//   a <size>         allocate, like allocate_memory; prints the offset
//   f <offset> <size> free, like deallocate_memory; prints "ok"
//   g <offset>        set the global offset
// After each operation it also prints the global offset. An error prints
// "error <message>" and stops.
//
// With --bench, it reads every operation first, then runs them without
// printing and prints how long they took in nanoseconds.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "memory_manager.h"

typedef struct {
    char kind;
    unsigned offset;
    unsigned size;
} Op;

static int bench(void) {
    size_t capacity = 1 << 20;
    size_t count = 0;
    Op *ops = malloc(capacity * sizeof(Op));
    char op;

    while (scanf(" %c", &op) == 1) {
        if (count == capacity) {
            capacity *= 2;
            ops = realloc(ops, capacity * sizeof(Op));
        }

        Op *next = &ops[count++];
        next->kind = op;

        if (op == 'a' && scanf("%u", &next->size) != 1) {
            return 1;
        }

        if (op == 'f' && scanf("%u %u", &next->offset, &next->size) != 2) {
            return 1;
        }

        if (op == 'g' && scanf("%u", &next->offset) != 1) {
            return 1;
        }
    }

    MemoryManager *manager = memory_manager_new();
    uint64_t checksum = 0;
    struct timespec start;
    struct timespec end;

    clock_gettime(CLOCK_MONOTONIC, &start);

    for (size_t i = 0; i < count; i++) {
        const char *error = NULL;
        uint32_t found;

        if (ops[i].kind == 'a') {
            if (!memory_manager_get_offset(manager, ops[i].size, &found, &error)) {
                if (error) {
                    printf("error %s\n", error);
                    return 1;
                }

                found = memory_manager_global_offset(manager);
                memory_manager_increase_global_offset(manager, ops[i].size);
            }

            checksum += found;
        } else if (ops[i].kind == 'f') {
            if (!memory_manager_add(manager, ops[i].size, ops[i].offset, &error)) {
                printf("error %s\n", error);
                return 1;
            }
        } else {
            memory_manager_set_global_offset(manager, ops[i].offset);
        }
    }

    clock_gettime(CLOCK_MONOTONIC, &end);

    long long ns = (end.tv_sec - start.tv_sec) * 1000000000LL + (end.tv_nsec - start.tv_nsec);
    printf("%lld %llu\n", ns, (unsigned long long)checksum);

    memory_manager_free(manager);
    free(ops);
    return 0;
}

int main(int argc, char **argv) {
    if (argc > 1 && !strcmp(argv[1], "--bench")) {
        return bench();
    }

    MemoryManager *manager = memory_manager_new();
    char op;

    while (scanf(" %c", &op) == 1) {
        const char *error = NULL;
        unsigned offset;
        unsigned size;

        if (op == 'a') {
            if (scanf("%u", &size) != 1) {
                return 1;
            }

            uint32_t found;

            if (!memory_manager_get_offset(manager, size, &found, &error)) {
                if (error) {
                    printf("error %s\n", error);
                    return 0;
                }

                found = memory_manager_global_offset(manager);
                memory_manager_increase_global_offset(manager, size);
            }

            printf("%u", found);
        } else if (op == 'f') {
            if (scanf("%u %u", &offset, &size) != 2) {
                return 1;
            }

            if (!memory_manager_add(manager, size, offset, &error)) {
                printf("error %s\n", error);
                return 0;
            }

            printf("ok");
        } else if (op == 'g') {
            if (scanf("%u", &offset) != 1) {
                return 1;
            }

            memory_manager_set_global_offset(manager, offset);
            printf("ok");
        } else {
            return 1;
        }

        printf(" %u\n", memory_manager_global_offset(manager));
    }

    memory_manager_free(manager);
    return 0;
}
