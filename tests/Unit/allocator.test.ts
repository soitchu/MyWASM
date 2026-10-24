// The C memory manager (through bun:ffi) must give the same offsets and
// errors as MemoryManager.ts
import path from "node:path";
import { beforeAll, expect, test } from "bun:test";
import {
  type Allocator,
  createAllocator,
  NativeAllocator,
  TsAllocator,
} from "../../Runtime/Allocator";

beforeAll(() => {
  const result = Bun.spawnSync({ cmd: ["make", "-C", path.join(__dirname, "../../Runtime-C"), "memory"] });

  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString());
  }
});

type Op = { kind: "a"; size: number } | { kind: "f"; offset: number; size: number };

function run(allocator: Allocator, ops: Op[]) {
  const results: string[] = [];

  allocator.setGlobalOffset(8);

  for (const op of ops) {
    try {
      if (op.kind === "a") {
        results.push(`a ${allocator.allocate(op.size)}`);
      } else {
        allocator.free(op.offset, op.size);
        results.push("f");
      }
    } catch (e) {
      results.push(`error ${(e as Error).message}`);
      break;
    }
  }

  return results;
}

// Random allocations and frees of blocks that were really allocated, with
// some misaligned frees (like delete_f64_array's) and double frees
function randomOps(seed: number, count: number, totalMemory: number) {
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const allocator = new TsAllocator(totalMemory);
  allocator.setGlobalOffset(8);

  const ops: Op[] = [];
  const live: [number, number][] = [];
  const freed: [number, number][] = [];

  for (let i = 0; i < count; i++) {
    const r = random();

    try {
      if (live.length === 0 || r < 0.55) {
        const size = random() < 0.9 ? 4 * (2 + Math.floor(random() * 8)) : 4 * (1 + Math.floor(random() * 300));
        ops.push({ kind: "a", size });
        live.push([allocator.allocate(size), size]);
      } else if (freed.length > 0 && r > 0.99) {
        const [offset, size] = freed[Math.floor(random() * freed.length)];
        ops.push({ kind: "f", offset, size });
        allocator.free(offset, size);
      } else {
        const [offset, size] = live.splice(Math.floor(random() * live.length), 1)[0];
        const freeSize = random() < 0.05 && size > 4 ? size - 3 : size;
        ops.push({ kind: "f", offset, size: freeSize });
        freed.push([offset, freeSize]);
        allocator.free(offset, freeSize);
      }
    } catch {
      break;
    }
  }

  return ops;
}

test("native_allocator_matches_ts", () => {
  let errors = 0;

  for (let seed = 1; seed <= 60; seed++) {
    const ops = randomOps(seed, 3000, 1 << 24);
    const expected = run(new TsAllocator(1 << 24), ops);

    expect(run(new NativeAllocator(1 << 24), ops)).toEqual(expected);

    if (expected.at(-1)?.startsWith("error")) {
      errors += 1;
    }
  }

  // Double frees make some sequences end in an error, which must match too
  expect(errors).toBeGreaterThan(0);
});

test("native_allocator_out_of_memory", () => {
  const ops: Op[] = Array.from({ length: 50 }, () => ({ kind: "a", size: 4000 }));
  const expected = run(new TsAllocator(65536), ops);

  expect(expected.at(-1)).toBe("error Out of memory");
  expect(run(new NativeAllocator(65536), ops)).toEqual(expected);
});

test("runtime_uses_native_allocator", () => {
  expect(createAllocator(65536)).toBeInstanceOf(NativeAllocator);
});

test("ts_allocator_can_be_forced", () => {
  process.env.MYWASM_MEMORY_MANAGER = "ts";

  try {
    expect(createAllocator(65536)).toBeInstanceOf(TsAllocator);
  } finally {
    delete process.env.MYWASM_MEMORY_MANAGER;
  }
});
