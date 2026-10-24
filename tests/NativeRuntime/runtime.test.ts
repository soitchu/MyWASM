// Runs the same compiled programs with the TS runtime (index.ts run with
// MYWASM_RUNTIME=bun) and the Rust runtime, and compares their output
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as Compiler from "../../Compiler/index.ts";
import { compileStage, nativeCompilerInput } from "../../Compiler-WASM/native";

const ROOT = path.join(__dirname, "../..");
const workDir = mkdtempSync(path.join(tmpdir(), "native-runtime-"));

const RUNTIMES = [
  {
    name: "Rust",
    path: path.join(ROOT, "Runtime-Rust/target/release/mywasm-run"),
    build: ["cargo", "build", "--release", "--manifest-path", path.join(ROOT, "Runtime-Rust/Cargo.toml")],
  },
];

beforeAll(() => {
  for (const runtime of RUNTIMES) {
    const result = Bun.spawnSync({ cmd: runtime.build });

    if (result.exitCode !== 0) {
      throw new Error(result.stderr.toString());
    }
  }
}, 600_000);

afterAll(() => rmSync(workDir, { recursive: true, force: true }));

let wasmCount = 0;

async function compile(file: string, unsafeArray = false) {
  wasmCount += 1;
  const wasm = path.join(workDir, `program${wasmCount}.wasm`);

  // Compiler.init logs its string map
  const log = console.log;
  console.log = () => {};

  try {
    await Compiler.init(file, wasm, { O: 0, S: 0, fastMath: false, returnBuffer: false, unsafeArray });
  } finally {
    console.log = log;
  }

  return wasm;
}

function run(cmd: string[], stdin: string, env: Record<string, string> = {}) {
  const result = Bun.spawnSync({
    cmd,
    stdin: Buffer.from(stdin),
    env: { ...process.env, ...env },
    timeout: 120_000,
  });
  return { stdout: result.stdout.toString(), ok: result.exitCode === 0 };
}

function expectSameRun(wasm: string, options: { stdin?: string; flags?: string[] } = {}) {
  const flags = options.flags ?? [];
  const stdin = options.stdin ?? "";

  // index.ts run would use the Rust runtime too
  const ts = run([process.execPath, path.join(ROOT, "index.ts"), "run", ...flags, wasm], stdin, {
    MYWASM_RUNTIME: "bun",
  });

  for (const runtime of RUNTIMES) {
    expect({ runtime: runtime.name, ...run([runtime.path, ...flags, wasm], stdin) }).toEqual({
      runtime: runtime.name,
      ...ts,
    });
  }

  return ts;
}

let snippetCount = 0;

async function compileSnippet(code: string) {
  snippetCount += 1;
  const file = path.join(workDir, `snippet${snippetCount}.mypl`);
  writeFileSync(file, code);
  return compile(file);
}

describe("repo programs", () => {
  // exec-3-basic-functions isn't here since it loops forever on this branch
  const programs = [
    "tests/Integration/hw-6/exec-1-hello.mypl",
    "tests/Integration/hw-6/exec-2-expr.mypl",
    "tests/Integration/hw-6/exec-4-built-ins.mypl",
    "tests/Integration/hw-6/exec-5-while.mypl",
    "tests/Integration/hw-6/exec-6-nested-if.mypl",
    "tests/Integration/hw-6/exec-8-fac.mypl",
    "tests/Integration/hw-6/exec-9-fib.mypl",
    "tests/Integration/hw-6/exec-10-cond.mypl",
    "tests/Integration/hw-6/exec-12-simple-struct.mypl",
    "tests/Integration/hw-6/exec-13-more-structs.mypl",
    "tests/Integration/hw-6/exec-14-arrays.mypl",
    "tests/Integration/hw-6/exec-15-arrays-structs.mypl",
    "tests/Integration/hw-6/exec-16-linked-list.mypl",
    "tests/Integration/hw-6/exec-17-tree.mypl",
    "tests/Integration/Import/main.mypl",
    "tests/Integration/Import/main2.mypl",
    "tests/Program/AVL.mypl",
    "tests/Program/mandebrot.mypl",
    "tests/Program/prime.mypl",
  ];

  for (const program of programs) {
    test(program, async () => {
      const wasm = await compile(path.join(ROOT, program));
      expectSameRun(wasm, { flags: ["--memory", "16M"] });
    });
  }

  test("tests/Program/AVL.mypl with --zero-on-dealloc", async () => {
    const wasm = await compile(path.join(ROOT, "tests/Program/AVL.mypl"));
    expectSameRun(wasm, { flags: ["--zero-on-dealloc", "--memory", "16M"] });
  });

  test("tests/Program/input.mypl", async () => {
    const wasm = await compile(path.join(ROOT, "tests/Program/input.mypl"));
    expectSameRun(wasm, { stdin: "97\n" });
    expectSameRun(wasm, { stdin: "100\n" });
  });

  test("tests/Program/sum-to-prime.mypl", async () => {
    const wasm = await compile(path.join(ROOT, "tests/Program/sum-to-prime.mypl"));
    expectSameRun(wasm, { stdin: "4\n6\n8\n10\n7\n" });
  });

  test("tests/Program/prime-factorization.mypl", async () => {
    const wasm = await compile(path.join(ROOT, "tests/Program/prime-factorization.mypl"));
    expectSameRun(wasm, { stdin: "360\n" });
  });
});

describe("native compiler", () => {
  test("compiles a program to the same WAT", async () => {
    const { wasm } = await compileStage("compile", workDir);
    const input = nativeCompilerInput(path.join(ROOT, "tests/Program/AVL.mypl"), false);
    const result = expectSameRun(wasm, { stdin: input, flags: ["--memory", "256M"] });

    expect(result.stdout).toContain("(module");
  }, 120_000);
});

describe("snippets", () => {
  const snippets: Record<string, { code: string; stdin?: string; flags?: string[] }> = {
    newlines_and_unicode: {
      code: 'export function int main() {\n  print("a\\nb ünïcode ✓ 😀\\n");\n  print(1.5);\n  print(true);\n}\n',
    },
    echo_until_eof: {
      code:
        'export function int main() {\n  string line = input();\n  while (line != null) {\n    print("[");\n    print(line);\n    print("]");\n    line = input();\n  }\n}\n',
      stdin: "first\n\nthird ü\nno newline",
    },
    main_without_result: {
      code: 'export function void main() {\n  print("void main");\n}\n',
    },
    null_struct_access: {
      code:
        'struct A {\n  int x;\n}\nexport function int main() {\n  print("before");\n  A a = null;\n  print(a.x);\n}\n',
    },
    array_out_of_bounds: {
      code: 'export function int main() {\n  array int a = new int[2];\n  print("before");\n  a[5] = 1;\n}\n',
    },
    out_of_memory: {
      code:
        'export function int main() {\n  print("allocating");\n  array int a = new int[100000];\n  print("allocated");\n}\n',
      flags: ["--memory", "64K"],
    },
    reuse_freed_memory: {
      code:
        "struct Node {\n  int value;\n  Node next;\n}\nexport function int main() {\n  for (int i = 0; i < 2000; i = i + 1) {\n    Node a = new Node(i, null);\n    array int b = new int[i % 17];\n    Node c = new Node(i, a);\n    delete a;\n    print(length(b));\n    delete b;\n    delete c;\n  }\n}\n",
    },
    read_after_zero_on_dealloc: {
      code:
        "export function int main() {\n  array int a = new int[4];\n  a[1] = 42;\n  delete a;\n  array int b = new int[4];\n  print(b[1]);\n}\n",
      flags: ["--zero-on-dealloc"],
    },
  };

  for (const [name, { code, stdin, flags }] of Object.entries(snippets)) {
    test(name, async () => {
      const wasm = await compileSnippet(code);
      expectSameRun(wasm, { stdin, flags });
    });
  }
});
