// Runs the same allocations and frees through Runtime/MemoryManager.ts and
// the C memory manager (used through bun:ffi) and the Rust runtime's, and
// compares every result
import path from "node:path";
import { beforeAll, describe, expect, test } from "bun:test";
import { MemoryManager } from "../../Runtime/MemoryManager";

const ROOT = path.join(__dirname, "../..");

const DRIVERS = [
  {
    name: "C",
    path: path.join(ROOT, "Runtime-C/build/alloc-driver"),
    build: ["make", "-C", path.join(ROOT, "Runtime-C"), "build/alloc-driver"],
  },
  {
    name: "Rust",
    path: path.join(ROOT, "Runtime-Rust/target/release/alloc-driver"),
    build: ["cargo", "build", "--release", "--manifest-path", path.join(ROOT, "Runtime-Rust/Cargo.toml")],
  },
];

beforeAll(() => {
  for (const driver of DRIVERS) {
    const result = Bun.spawnSync({ cmd: driver.build });

    if (result.exitCode !== 0) {
      throw new Error(result.stderr.toString());
    }
  }
}, 600_000);

type Op = { kind: "a"; size: number } | { kind: "f"; offset: number; size: number };

// Like allocate_memory and deallocate_memory in Runtime/WASM.ts
function runTs(ops: Op[]) {
  const manager = new MemoryManager();
  let output = "";

  try {
    for (const op of ops) {
      if (op.kind === "a") {
        let offset = manager.getOffset(op.size);

        if (!offset) {
          offset = manager.globalOffset;
          manager.increaseGlobalOffset(op.size);
        }

        output += `${offset}`;
      } else {
        manager.add(op.size, op.offset);
        output += "ok";
      }

      output += ` ${manager.globalOffset}\n`;
    }
  } catch (e) {
    output += `error ${(e as Error).message}\n`;
  }

  return output;
}

function runDriver(driver: string, ops: Op[]) {
  const input = ops
    .map((op) => (op.kind === "a" ? `a ${op.size}` : `f ${op.offset} ${op.size}`))
    .join("\n");

  const result = Bun.spawnSync({ cmd: [driver], stdin: Buffer.from(input + "\n") });
  return result.stdout.toString();
}

function randomOps(seed: number, count: number, options: { oddFrees: boolean; doubleFrees: boolean }) {
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const ops: Op[] = [];
  const live: [number, number][] = [];
  const freed: [number, number][] = [];
  const manager = new MemoryManager();

  // The TS manager is used to know which offsets get allocated, so the ops
  // free real blocks
  for (let i = 0; i < count; i++) {
    const r = random();

    if (live.length === 0 || r < 0.55) {
      // Mostly small structs and arrays, sometimes big arrays
      const size = random() < 0.9 ? 4 * (2 + Math.floor(random() * 8)) : 4 * (1 + Math.floor(random() * 300));
      let offset: number | undefined;
      ops.push({ kind: "a", size });

      try {
        offset = manager.getOffset(size);
      } catch {
        break;
      }

      if (!offset) {
        offset = manager.globalOffset;
        manager.increaseGlobalOffset(size);
      }

      live.push([offset, size]);
    } else if (options.doubleFrees && freed.length > 0 && r > 0.98) {
      const [offset, size] = freed[Math.floor(random() * freed.length)];
      ops.push({ kind: "f", offset, size });

      try {
        manager.add(size, offset);
      } catch {
        break;
      }
    } else {
      const [offset, size] = live.splice(Math.floor(random() * live.length), 1)[0];

      // delete_f64_array frees 8 * length + 1 bytes of a block that is
      // 8 * length + 4
      const freeSize = options.oddFrees && random() < 0.1 && size > 4 ? size - 3 : size;

      ops.push({ kind: "f", offset, size: freeSize });
      freed.push([offset, freeSize]);

      try {
        manager.add(freeSize, offset);
      } catch {
        break;
      }
    }
  }

  return ops;
}

for (const driver of DRIVERS) {
  describe(driver.name, () => {
    test("allocations_and_frees", () => {
      for (let seed = 1; seed <= 40; seed++) {
        const ops = randomOps(seed, 2000, { oddFrees: false, doubleFrees: false });
        expect(runDriver(driver.path, ops)).toBe(runTs(ops));
      }
    });

    test("misaligned_frees", () => {
      for (let seed = 100; seed <= 120; seed++) {
        const ops = randomOps(seed, 2000, { oddFrees: true, doubleFrees: false });
        expect(runDriver(driver.path, ops)).toBe(runTs(ops));
      }
    });

    test("double_frees", () => {
      for (let seed = 200; seed <= 220; seed++) {
        const ops = randomOps(seed, 2000, { oddFrees: true, doubleFrees: true });
        expect(runDriver(driver.path, ops)).toBe(runTs(ops));
      }
    });

    test("free_next_to_global_offset_merges_back", () => {
      const ops: Op[] = [
        { kind: "a", size: 16 },
        { kind: "a", size: 8 },
        { kind: "a", size: 12 },
        { kind: "f", offset: 20, size: 8 },
        { kind: "f", offset: 28, size: 12 },
        { kind: "f", offset: 4, size: 16 },
        { kind: "a", size: 4 },
      ];

      expect(runDriver(driver.path, ops)).toBe(runTs(ops));
    });
  });
}
