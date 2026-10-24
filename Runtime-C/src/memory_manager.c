#include "memory_manager.h"

#include <stdlib.h>
#include <string.h>

//----------------------------------------------------------------------
// Hash map from uint64 keys to pointers, with linear probing
//----------------------------------------------------------------------

typedef struct {
    uint64_t key;
    void *value;
    bool used;
} Slot;

typedef struct {
    Slot *slots;
    size_t capacity;
    size_t length;
} HashMap;

static uint64_t hash_key(uint64_t key) {
    key ^= key >> 33;
    key *= 0xff51afd7ed558ccdULL;
    key ^= key >> 33;
    key *= 0xc4ceb9fe1a85ec53ULL;
    key ^= key >> 33;
    return key;
}

static void hash_map_init(HashMap *map) {
    map->capacity = 1024;
    map->length = 0;
    map->slots = calloc(map->capacity, sizeof(Slot));
}

static size_t hash_map_find_slot(const HashMap *map, uint64_t key) {
    size_t mask = map->capacity - 1;
    size_t i = hash_key(key) & mask;

    while (map->slots[i].used && map->slots[i].key != key) {
        i = (i + 1) & mask;
    }

    return i;
}

static void hash_map_set(HashMap *map, uint64_t key, void *value);

static void hash_map_grow(HashMap *map) {
    Slot *old_slots = map->slots;
    size_t old_capacity = map->capacity;

    map->capacity *= 2;
    map->length = 0;
    map->slots = calloc(map->capacity, sizeof(Slot));

    for (size_t i = 0; i < old_capacity; i++) {
        if (old_slots[i].used) {
            hash_map_set(map, old_slots[i].key, old_slots[i].value);
        }
    }

    free(old_slots);
}

static void hash_map_set(HashMap *map, uint64_t key, void *value) {
    if ((map->length + 1) * 4 > map->capacity * 3) {
        hash_map_grow(map);
    }

    size_t i = hash_map_find_slot(map, key);

    if (!map->slots[i].used) {
        map->slots[i].used = true;
        map->slots[i].key = key;
        map->length++;
    }

    map->slots[i].value = value;
}

static bool hash_map_get(const HashMap *map, uint64_t key, void **value) {
    size_t i = hash_map_find_slot(map, key);

    if (!map->slots[i].used) {
        return false;
    }

    *value = map->slots[i].value;
    return true;
}

// Deletes by shifting later entries of the probe sequence back
static void hash_map_delete(HashMap *map, uint64_t key) {
    size_t mask = map->capacity - 1;
    size_t i = hash_map_find_slot(map, key);

    if (!map->slots[i].used) {
        return;
    }

    map->slots[i].used = false;
    map->length--;

    size_t j = i;

    while (true) {
        j = (j + 1) & mask;

        if (!map->slots[j].used) {
            break;
        }

        size_t home = hash_key(map->slots[j].key) & mask;

        // Move the entry back if its home isn't between the hole and it
        bool between = (i <= j) ? (i < home && home <= j) : (i < home || home <= j);

        if (!between) {
            map->slots[i] = map->slots[j];
            map->slots[j].used = false;
            i = j;
        }
    }
}

static void hash_map_free(HashMap *map) {
    free(map->slots);
}

//----------------------------------------------------------------------
// Free lists. Each size has a FIFO queue of offsets (LinkedList.ts).
// Queue nodes are also indexed by (size, offset), so a node can be removed
// by value without scanning the queue. A double free can put the same
// offset in a queue twice, so the index keeps every occurrence, oldest
// first, since removing by value removes the oldest
//----------------------------------------------------------------------

typedef struct QueueNode {
    uint32_t offset;
    struct QueueNode *prev;
    struct QueueNode *next;
    // The next occurrence of the same (size, offset)
    struct QueueNode *next_occurrence;
} QueueNode;

typedef struct {
    QueueNode *first;
    QueueNode *last;
} Occurrences;

typedef struct AVLNode {
    uint32_t key;
    int height;
    struct AVLNode *left;
    struct AVLNode *right;
    QueueNode *head;
    QueueNode *tail;
    size_t length;
} AVLNode;

struct MemoryManager {
    // availOffsets: maps the start of each free block to its end and its end
    // to its start. The values are stored as pointers
    HashMap avail_offsets;
    // (size << 32 | offset) -> Occurrences
    HashMap occurrences;
    AVLNode *root;
    uint32_t global_offset;
};

static uint64_t occurrence_key(uint32_t size, uint32_t offset) {
    return ((uint64_t)size << 32) | offset;
}

//----------------------------------------------------------------------
// AVL tree keyed by size (AVL.ts)
//----------------------------------------------------------------------

static int height(const AVLNode *node) {
    return node ? node->height : 0;
}

static void update_height(AVLNode *node) {
    int left = height(node->left);
    int right = height(node->right);
    node->height = 1 + (left > right ? left : right);
}

static int balance_factor(const AVLNode *node) {
    return node ? height(node->left) - height(node->right) : 0;
}

static AVLNode *right_rotate(AVLNode *y) {
    AVLNode *x = y->left;
    y->left = x->right;
    x->right = y;
    update_height(y);
    update_height(x);
    return x;
}

static AVLNode *left_rotate(AVLNode *x) {
    AVLNode *y = x->right;
    x->right = y->left;
    y->left = x;
    update_height(x);
    update_height(y);
    return y;
}

static AVLNode *rebalance(AVLNode *node) {
    update_height(node);
    int balance = balance_factor(node);

    if (balance > 1) {
        if (balance_factor(node->left) < 0) {
            node->left = left_rotate(node->left);
        }

        return right_rotate(node);
    }

    if (balance < -1) {
        if (balance_factor(node->right) > 0) {
            node->right = right_rotate(node->right);
        }

        return left_rotate(node);
    }

    return node;
}

static AVLNode *avl_insert(AVLNode *node, AVLNode *new_node) {
    if (!node) {
        return new_node;
    }

    if (new_node->key < node->key) {
        node->left = avl_insert(node->left, new_node);
    } else {
        node->right = avl_insert(node->right, new_node);
    }

    return rebalance(node);
}

// Removes the node with the minimum key from the subtree and returns it in
// *min, returning the new subtree
static AVLNode *avl_remove_min(AVLNode *node, AVLNode **min) {
    if (!node->left) {
        *min = node;
        return node->right;
    }

    node->left = avl_remove_min(node->left, min);
    return rebalance(node);
}

// Unlinks the node with the key without freeing it
static AVLNode *avl_delete(AVLNode *node, uint32_t key) {
    if (!node) {
        return NULL;
    }

    if (key < node->key) {
        node->left = avl_delete(node->left, key);
    } else if (key > node->key) {
        node->right = avl_delete(node->right, key);
    } else {
        AVLNode *left = node->left;
        AVLNode *right = node->right;

        if (!left || !right) {
            return left ? left : right;
        }

        // The successor takes the node's place, keeping its own free list
        AVLNode *successor;
        right = avl_remove_min(right, &successor);
        successor->left = left;
        successor->right = right;
        return rebalance(successor);
    }

    return rebalance(node);
}

static AVLNode *avl_find(AVLNode *node, uint32_t key) {
    while (node && node->key != key) {
        node = key < node->key ? node->left : node->right;
    }

    return node;
}

// The node with the smallest key that is at least key
static AVLNode *avl_ceiling(AVLNode *node, uint32_t key) {
    AVLNode *found = NULL;

    while (node) {
        if (key < node->key) {
            found = node;
            node = node->left;
        } else if (key > node->key) {
            node = node->right;
        } else {
            return node;
        }
    }

    return found;
}

static void avl_free(AVLNode *node) {
    if (!node) {
        return;
    }

    avl_free(node->left);
    avl_free(node->right);

    QueueNode *queue_node = node->head;

    while (queue_node) {
        QueueNode *next = queue_node->next;
        free(queue_node);
        queue_node = next;
    }

    free(node);
}

//----------------------------------------------------------------------
// Queues
//----------------------------------------------------------------------

static void queue_push(MemoryManager *manager, AVLNode *node, uint32_t offset) {
    QueueNode *queue_node = calloc(1, sizeof(QueueNode));
    queue_node->offset = offset;
    queue_node->prev = node->tail;

    if (node->tail) {
        node->tail->next = queue_node;
    } else {
        node->head = queue_node;
    }

    node->tail = queue_node;
    node->length++;

    uint64_t key = occurrence_key(node->key, offset);
    Occurrences *occurrences;

    if (hash_map_get(&manager->occurrences, key, (void **)&occurrences)) {
        occurrences->last->next_occurrence = queue_node;
        occurrences->last = queue_node;
    } else {
        occurrences = malloc(sizeof(Occurrences));
        occurrences->first = queue_node;
        occurrences->last = queue_node;
        hash_map_set(&manager->occurrences, key, occurrences);
    }
}

static void queue_unlink(AVLNode *node, QueueNode *queue_node) {
    if (queue_node->prev) {
        queue_node->prev->next = queue_node->next;
    } else {
        node->head = queue_node->next;
    }

    if (queue_node->next) {
        queue_node->next->prev = queue_node->prev;
    } else {
        node->tail = queue_node->prev;
    }

    node->length--;
}

// Removes the oldest occurrence of offset from the size's queue, which is
// always the first one in the queue
static void queue_remove_oldest(MemoryManager *manager, AVLNode *node, uint32_t offset) {
    uint64_t key = occurrence_key(node->key, offset);
    Occurrences *occurrences;

    if (!hash_map_get(&manager->occurrences, key, (void **)&occurrences)) {
        // Like LinkedList.deleteElementWithValue, nothing happens when the
        // value isn't there
        return;
    }

    QueueNode *queue_node = occurrences->first;
    occurrences->first = queue_node->next_occurrence;

    if (!occurrences->first) {
        hash_map_delete(&manager->occurrences, key);
        free(occurrences);
    }

    queue_unlink(node, queue_node);
    free(queue_node);
}

static uint32_t queue_pop_head(MemoryManager *manager, AVLNode *node) {
    uint32_t offset = node->head->offset;
    queue_remove_oldest(manager, node, offset);
    return offset;
}

//----------------------------------------------------------------------
// MemoryManager.ts
//----------------------------------------------------------------------

MemoryManager *memory_manager_new(void) {
    MemoryManager *manager = calloc(1, sizeof(MemoryManager));
    hash_map_init(&manager->avail_offsets);
    hash_map_init(&manager->occurrences);
    manager->global_offset = 4;
    return manager;
}

void memory_manager_free(MemoryManager *manager) {
    for (size_t i = 0; i < manager->occurrences.capacity; i++) {
        if (manager->occurrences.slots[i].used) {
            free(manager->occurrences.slots[i].value);
        }
    }

    avl_free(manager->root);
    hash_map_free(&manager->avail_offsets);
    hash_map_free(&manager->occurrences);
    free(manager);
}

uint32_t memory_manager_global_offset(const MemoryManager *manager) {
    return manager->global_offset;
}

void memory_manager_set_global_offset(MemoryManager *manager, uint32_t offset) {
    manager->global_offset = offset;
}

void memory_manager_increase_global_offset(MemoryManager *manager, uint32_t size) {
    manager->global_offset += size;
}

static void delete_node(MemoryManager *manager, AVLNode *node) {
    manager->root = avl_delete(manager->root, node->key);
    free(node);
}

// availOffsets.get, where a missing key and 0 are both falsy in the TS
static uint32_t avail_get(MemoryManager *manager, uint32_t key) {
    void *value;

    if (!hash_map_get(&manager->avail_offsets, key, &value)) {
        return 0;
    }

    return (uint32_t)(uintptr_t)value;
}

static void avail_set(MemoryManager *manager, uint32_t key, uint32_t value) {
    hash_map_set(&manager->avail_offsets, key, (void *)(uintptr_t)value);
}

static void avail_delete(MemoryManager *manager, uint32_t key) {
    hash_map_delete(&manager->avail_offsets, key);
}

// Removes the free block at offset from the size's free list
static bool remove_free_block(MemoryManager *manager, uint32_t size, uint32_t offset, const char *sync_error, const char **error) {
    AVLNode *node = avl_find(manager->root, size);

    if (!node) {
        *error = sync_error;
        return false;
    }

    queue_remove_oldest(manager, node, offset);

    if (node->length == 0) {
        delete_node(manager, node);
    }

    return true;
}

bool memory_manager_add(MemoryManager *manager, uint32_t size, uint32_t offset, const char **error) {
    uint32_t start_offset = offset;
    uint32_t end_offset = offset + size - 1;

    uint32_t avail_start = avail_get(manager, start_offset - 1);
    uint32_t avail_end = avail_get(manager, end_offset + 1);

    // Merging with the free block that ends right before this one
    if (avail_start) {
        uint32_t avail_start_offset = avail_start;
        uint32_t avail_end_offset = start_offset - 1;
        uint32_t avail_size = avail_end_offset - avail_start_offset + 1;

        avail_delete(manager, avail_start_offset);
        avail_delete(manager, avail_end_offset);

        if (!remove_free_block(manager, avail_size, avail_start_offset, "(2) availOffsets and free_mem are out of sync", error)) {
            return false;
        }

        start_offset = avail_start_offset;
    }

    // Merging with the free block that starts right after this one
    if (avail_end) {
        uint32_t avail_end_offset = avail_end;
        uint32_t avail_start_offset = end_offset + 1;
        uint32_t avail_size = avail_end_offset - avail_start_offset + 1;

        avail_delete(manager, avail_start_offset);
        avail_delete(manager, avail_end_offset);

        if (!remove_free_block(manager, avail_size, avail_start_offset, "(1) availOffsets and free_mem are out of sync", error)) {
            return false;
        }

        end_offset = avail_end_offset;
    }

    size = end_offset - start_offset + 1;

    // If the freed memory is next to the global offset, then all we need to
    // do is move the global offset back
    if (end_offset + 1 == manager->global_offset) {
        manager->global_offset -= size;
        return true;
    }

    avail_set(manager, start_offset, end_offset);
    avail_set(manager, end_offset, start_offset);

    AVLNode *node = avl_find(manager->root, size);

    if (!node) {
        node = calloc(1, sizeof(AVLNode));
        node->key = size;
        node->height = 1;
        manager->root = avl_insert(manager->root, node);
    }

    queue_push(manager, node, start_offset);
    return true;
}

bool memory_manager_get_offset(MemoryManager *manager, uint32_t requested_size, uint32_t *offset, const char **error) {
    AVLNode *node = avl_ceiling(manager->root, requested_size);

    if (!node) {
        return false;
    }

    uint32_t size = node->key;
    uint32_t found = queue_pop_head(manager, node);

    if (node->length == 0) {
        delete_node(manager, node);
    }

    avail_delete(manager, found);
    avail_delete(manager, found + size - 1);

    if (size != requested_size) {
        // The rest of the block goes back to the free lists
        if (!memory_manager_add(manager, size - requested_size, found + requested_size, error)) {
            return false;
        }
    }

    // The TS runtime treats an offset of 0 as not found
    if (found == 0) {
        return false;
    }

    *offset = found;
    return true;
}
