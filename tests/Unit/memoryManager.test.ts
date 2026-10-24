import { MemoryManager } from "../../Runtime/MemoryManager";
import { deleteAVLNode, findNodeWithValue, insertAVLNode, AVLNode } from "../../Runtime/AVL";
import { LinkedList } from "../../Runtime/LinkedList";
import { expect, test } from "bun:test";

test("avl_delete_with_two_children_keeps_values", () => {
  let root: AVLNode | null = null;

  for (const key of [20, 10, 30, 25, 40]) {
    root = insertAVLNode(root, key, new LinkedList(key * 100));
  }

  // 20 has two children, so its successor (25) takes its place
  root = deleteAVLNode(root, 20);

  for (const key of [10, 25, 30, 40]) {
    expect(findNodeWithValue(root, key)?.value.head?.value).toBe(key * 100);
  }

  expect(findNodeWithValue(root, 20)).toBeNull();
});

function allocate(manager: MemoryManager, size: number) {
  const offset = manager.getOffset(size);

  if (offset !== undefined) {
    return offset;
  }

  const globalOffset = manager.globalOffset;
  manager.increaseGlobalOffset(size);
  return globalOffset;
}

// Random allocations and frees (never double frees) must never hand out
// overlapping or invalid blocks
test("random_allocations_never_overlap", () => {
  let seed = 1;
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let trial = 0; trial < 500; trial++) {
    const manager = new MemoryManager();
    const live: [number, number][] = [];

    for (let step = 0; step < 80; step++) {
      if (live.length === 0 || random() < 0.55) {
        const size = 4 * (1 + Math.floor(random() * 6));
        const offset = allocate(manager, size);

        expect(typeof offset).toBe("number");
        expect(offset).toBeGreaterThanOrEqual(4);

        for (const [liveOffset, liveSize] of live) {
          const overlaps = offset < liveOffset + liveSize && liveOffset < offset + size;
          expect(overlaps).toBe(false);
        }

        live.push([offset, size]);
      } else {
        const [offset, size] = live.splice(Math.floor(random() * live.length), 1)[0];
        manager.add(size, offset);
      }
    }
  }
});
