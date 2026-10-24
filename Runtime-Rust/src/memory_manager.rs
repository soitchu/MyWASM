//! Port of Runtime/MemoryManager.ts. It makes the same choices as the TS
//! memory manager, so programs get the same addresses, but with faster data
//! structures: free block ends are in a hash map, the free lists by size are
//! in a B-tree, and removing a block from its free list is O(1).
//!
//! Offsets wrap around like u32s, like the C port (Runtime-C).

use std::collections::BTreeMap;

use rustc_hash::FxHashMap;

pub const OUT_OF_SYNC_1: &str = "(1) availOffsets and free_mem are out of sync";
pub const OUT_OF_SYNC_2: &str = "(2) availOffsets and free_mem are out of sync";

const NIL: usize = usize::MAX;

/// A node in a size's FIFO queue of free offsets (LinkedList.ts)
struct QueueNode {
    offset: u32,
    prev: usize,
    next: usize,
    /// The next node for the same (size, offset)
    next_occurrence: usize,
}

/// The first and last queue nodes for a (size, offset)
struct Occurrences {
    first: usize,
    last: usize,
}

fn occurrence_key(size: u32, offset: u32) -> u64 {
    ((size as u64) << 32) | offset as u64
}

struct Queue {
    head: usize,
    tail: usize,
    length: usize,
}

pub struct MemoryManager {
    /// availOffsets: maps the start of each free block to its end and its
    /// end to its start
    avail_offsets: FxHashMap<u32, u32>,
    /// Free lists by size
    queues: BTreeMap<u32, Queue>,
    /// Queue nodes, indexed by the queues and occurrences
    nodes: Vec<QueueNode>,
    free_nodes: Vec<usize>,
    /// The queue nodes for each (size, offset), oldest first, chained
    /// through next_occurrence. A double free can put the same offset in a
    /// queue twice, and removing by value removes the oldest
    occurrences: FxHashMap<u64, Occurrences>,
    pub global_offset: u32,
}

impl Default for MemoryManager {
    fn default() -> Self {
        Self::new()
    }
}

impl MemoryManager {
    pub fn new() -> Self {
        MemoryManager {
            avail_offsets: FxHashMap::default(),
            queues: BTreeMap::new(),
            nodes: Vec::new(),
            free_nodes: Vec::new(),
            occurrences: FxHashMap::default(),
            global_offset: 4,
        }
    }

    pub fn increase_global_offset(&mut self, size: u32) {
        self.global_offset = self.global_offset.wrapping_add(size);
    }

    fn new_node(&mut self, offset: u32, prev: usize) -> usize {
        let node = QueueNode { offset, prev, next: NIL, next_occurrence: NIL };

        if let Some(index) = self.free_nodes.pop() {
            self.nodes[index] = node;
            index
        } else {
            self.nodes.push(node);
            self.nodes.len() - 1
        }
    }

    fn queue_push(&mut self, size: u32, offset: u32) {
        let tail = self.queues.get(&size).map_or(NIL, |queue| queue.tail);
        let index = self.new_node(offset, tail);

        if tail != NIL {
            self.nodes[tail].next = index;
        }

        let queue = self.queues.entry(size).or_insert(Queue { head: NIL, tail: NIL, length: 0 });

        if queue.head == NIL {
            queue.head = index;
        }

        queue.tail = index;
        queue.length += 1;

        match self.occurrences.get_mut(&occurrence_key(size, offset)) {
            Some(occurrences) => {
                self.nodes[occurrences.last].next_occurrence = index;
                occurrences.last = index;
            }
            None => {
                self.occurrences.insert(occurrence_key(size, offset), Occurrences { first: index, last: index });
            }
        }
    }

    /// Removes the oldest occurrence of offset from the size's queue, which
    /// is always the first one in the queue. Like
    /// LinkedList.deleteElementWithValue, nothing happens when it isn't there
    fn queue_remove_oldest(&mut self, size: u32, offset: u32) {
        let key = occurrence_key(size, offset);

        let Some(occurrences) = self.occurrences.get_mut(&key) else {
            return;
        };

        let index = occurrences.first;
        let QueueNode { prev, next, next_occurrence, .. } = self.nodes[index];

        if next_occurrence == NIL {
            self.occurrences.remove(&key);
        } else {
            occurrences.first = next_occurrence;
        }

        if prev != NIL {
            self.nodes[prev].next = next;
        }

        if next != NIL {
            self.nodes[next].prev = prev;
        }

        let queue = self.queues.get_mut(&size).expect("the queue exists while it has nodes");

        if prev == NIL {
            queue.head = next;
        }

        if next == NIL {
            queue.tail = prev;
        }

        queue.length -= 1;

        if queue.length == 0 {
            self.queues.remove(&size);
        }

        self.free_nodes.push(index);
    }

    /// availOffsets.get, where a missing key and 0 are both falsy in the TS
    fn avail_get(&self, key: u32) -> u32 {
        self.avail_offsets.get(&key).copied().unwrap_or(0)
    }

    /// Removes the free block at offset from the size's free list
    fn remove_free_block(&mut self, size: u32, offset: u32, sync_error: &'static str) -> Result<(), &'static str> {
        if !self.queues.contains_key(&size) {
            return Err(sync_error);
        }

        self.queue_remove_oldest(size, offset);
        Ok(())
    }

    /// Frees size bytes at offset, merging it with neighboring free blocks
    pub fn add(&mut self, size: u32, offset: u32) -> Result<(), &'static str> {
        let mut start_offset = offset;
        let mut end_offset = offset.wrapping_add(size).wrapping_sub(1);

        let avail_start = self.avail_get(start_offset.wrapping_sub(1));
        let avail_end = self.avail_get(end_offset.wrapping_add(1));

        // Merging with the free block that ends right before this one
        if avail_start != 0 {
            let avail_start_offset = avail_start;
            let avail_end_offset = start_offset.wrapping_sub(1);
            let avail_size = avail_end_offset.wrapping_sub(avail_start_offset).wrapping_add(1);

            self.avail_offsets.remove(&avail_start_offset);
            self.avail_offsets.remove(&avail_end_offset);
            self.remove_free_block(avail_size, avail_start_offset, OUT_OF_SYNC_2)?;

            start_offset = avail_start_offset;
        }

        // Merging with the free block that starts right after this one
        if avail_end != 0 {
            let avail_end_offset = avail_end;
            let avail_start_offset = end_offset.wrapping_add(1);
            let avail_size = avail_end_offset.wrapping_sub(avail_start_offset).wrapping_add(1);

            self.avail_offsets.remove(&avail_start_offset);
            self.avail_offsets.remove(&avail_end_offset);
            self.remove_free_block(avail_size, avail_start_offset, OUT_OF_SYNC_1)?;

            end_offset = avail_end_offset;
        }

        let size = end_offset.wrapping_sub(start_offset).wrapping_add(1);

        // If the freed memory is next to the global offset, then all we need
        // to do is move the global offset back
        if end_offset.wrapping_add(1) == self.global_offset {
            self.global_offset = self.global_offset.wrapping_sub(size);
            return Ok(());
        }

        self.avail_offsets.insert(start_offset, end_offset);
        self.avail_offsets.insert(end_offset, start_offset);
        self.queue_push(size, start_offset);

        Ok(())
    }

    /// Takes a freed block of at least size bytes. Returns None when there
    /// isn't one, and then the caller takes memory from the global offset
    pub fn get_offset(&mut self, requested_size: u32) -> Result<Option<u32>, &'static str> {
        let Some((&size, queue)) = self.queues.range(requested_size..).next() else {
            return Ok(None);
        };

        let found = self.nodes[queue.head].offset;
        self.queue_remove_oldest(size, found);

        self.avail_offsets.remove(&found);
        self.avail_offsets.remove(&found.wrapping_add(size).wrapping_sub(1));

        if size != requested_size {
            // The rest of the block goes back to the free lists
            self.add(size - requested_size, found.wrapping_add(requested_size))?;
        }

        // The TS runtime treats an offset of 0 as not found
        if found == 0 {
            return Ok(None);
        }

        Ok(Some(found))
    }

    /// allocate_memory in Runtime/WASM.ts: a freed block if there is one,
    /// and otherwise memory from the global offset
    pub fn allocate(&mut self, size: u32, memory_size: u64) -> Result<u32, &'static str> {
        if let Some(offset) = self.get_offset(size)? {
            return Ok(offset);
        }

        let offset = self.global_offset;

        if offset as u64 + size as u64 >= memory_size {
            return Err("Out of memory");
        }

        self.increase_global_offset(size);
        Ok(offset)
    }
}
