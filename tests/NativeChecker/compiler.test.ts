// Compares the WAT from the native compiler (Compiler-WASM) with the TS
// compiler's, for the repo's .mypl files and for snippets
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as Compiler from "../../Compiler/index.ts";
import { MyWASMError } from "../../Compiler/types";
import { nativeCompilerInput } from "../../Compiler-WASM/native";
import { compileStage, ROOT, repoMyPLFiles, runStage } from "../native";

let stage: Awaited<ReturnType<typeof compileStage>>;
const workDir = mkdtempSync(path.join(tmpdir(), "native-checker-"));
beforeAll(async () => {
  stage = await compileStage("compile");
});

afterAll(() => {
  stage.cleanup();
  rmSync(workDir, { recursive: true, force: true });
});

async function tsWat(mainPath: string, unsafeArray: boolean) {
  const output = path.join(workDir, "ts.wat");

  try {
    await Compiler.init(mainPath, output, {
      O: 0,
      S: 0,
      fastMath: false,
      returnBuffer: false,
      unsafeArray,
      wat: true,
    });

    return readFileSync(output, "utf8");
  } catch (e) {
    const error = e as MyWASMError;

    if (error.type === undefined) {
      return `Error: ${error.message}\n`;
    }

    return `${error.type} error (line ${error.line}, column ${error.column}): ${error.message}\n`;
  }
}

function nativeWat(mainPath: string, unsafeArray: boolean) {
  return runStage(stage.wasm, nativeCompilerInput(mainPath, unsafeArray), [
    "Lexer error",
    "Grammar error",
    "Semantic error",
    "Error: ",
  ]);
}

async function expectSameWat(mainPath: string, unsafeArray = false) {
  const expected = await tsWat(mainPath, unsafeArray);
  expect(nativeWat(mainPath, unsafeArray)).toBe(expected);
}

let snippetCount = 0;

function writeSnippet(code: string) {
  snippetCount += 1;
  const file = path.join(workDir, `snippet${snippetCount}.mypl`);
  writeFileSync(file, code.endsWith("\n") ? code : code + "\n");
  return file;
}

describe("repo files", () => {
  for (const file of repoMyPLFiles()) {
    test(file, async () => {
      await expectSameWat(path.join(ROOT, file));
    });
  }
});

describe("unsafe arrays", () => {
  test("merge-sort", async () => {
    await expectSameWat(path.join(ROOT, "tests/Program/merge-sort.mypl"), true);
  });
});

describe("snippets", () => {
  const snippets: Record<string, string> = {
    empty_main: "export function int main() {}",
    globals: "int a = 1;\ndouble b = 2.5;\nbool c = true;\nexport function int main() {\n  a = a + 1;\n  return a;\n}",
    strings:
      'export function int main() {\n  string a = "hello";\n  string b = "hello";\n  print(a);\n  print("\\n");\n  print(length(a));\n  delete a;\n}',
    structs:
      "struct Node {\n  int value;\n  double weight;\n  Node next;\n  array int items;\n}\nexport function int main() {\n  Node n = new Node(1, 2.5, null, new int[3]);\n  n.next = new Node(2, 0.5, n, null);\n  n.items[1] = n.next.value;\n  print(n.next.next.weight);\n  delete n;\n}",
    arrays:
      "export function int main() {\n  array double d = new double[4];\n  array bool b = new bool[2];\n  d[0] = 1.5;\n  b[1] = d[0] > 1.0;\n  print(b[1]);\n  delete d;\n  delete b;\n}",
    control_flow:
      "export function int main() {\n  int total = 0;\n  for (int i = 0; i < 10; i = i + 1) {\n    if (i % 2 == 0) {\n      total = total + i;\n    } elseif (i == 3) {\n      total = total - 1;\n    } else {\n      while (total > 100) {\n        total = total / 2;\n      }\n    }\n  }\n  return total;\n}",
    operators:
      "export function bool main() {\n  int a = 7;\n  double b = 2.5;\n  bool c = not (a > 3) or b * 2.0 <= 5.0 and a != 4;\n  return c;\n}",
    calls_and_drop:
      "function int f(int x) {\n  return x * 2;\n}\nfunction double g() {\n  return 1.5;\n}\nexport function int main() {\n  f(1);\n  if (true) {\n    g();\n    f(f(2));\n  }\n  return f(3);\n}",
    builtins:
      'export function int main() {\n  string s = itos(42);\n  double d = itod(3) + stod("1.5");\n  int i = dtoi(d) + stoi("7");\n  print(dtos(d));\n  print(string_compare(s, s));\n  print(char_code(s, 0));\n  print(random() < 1.0);\n  string_append(s, s);\n  print(get(s, 1));\n}',
    shadowing:
      "export function int main() {\n  int x = 1;\n  if (true) {\n    int x = 2;\n    if (true) {\n      int x = 3;\n    }\n  }\n  return x;\n}",
    // Errors
    undefined_variable: "export function int main() {\n  return y;\n}",
    undefined_function: "export function int main() {\n  return f(1);\n}",
    wrong_return_type: 'export function int main() {\n  return "x";\n}',
    type_mismatch: "export function int main() {\n  int a = 1.5;\n}",
    assign_mismatch: "export function int main() {\n  int a = 1;\n  a = true;\n}",
    wrong_argument: "function int f(int x) {\n  return x;\n}\nexport function int main() {\n  return f(1.5);\n}",
    wrong_argument_count: "function int f(int x) {\n  return x;\n}\nexport function int main() {\n  return f(1, 2);\n}",
    non_boolean_condition: "export function int main() {\n  if (1) {\n  }\n}",
    non_boolean_while: "export function int main() {\n  while (1) {\n  }\n}",
    non_boolean_for: "export function int main() {\n  for (int i = 0; 1; i = i + 1) {\n  }\n}",
    mixed_operands: "export function int main() {\n  return 1 + 2.5;\n}",
    array_operator: "export function bool main() {\n  array int a = new int[1];\n  return a < a;\n}",
    not_on_int: "export function bool main() {\n  return not 1;\n}",
    duplicate_variable: "export function int main() {\n  int a = 1;\n  int a = 2;\n}",
    duplicate_function: "function int f() {\n  return 1;\n}\nfunction int f() {\n  return 2;\n}",
    duplicate_struct: "struct A {\n  int x;\n}\nstruct A {\n  int y;\n}",
    duplicate_field: "struct A {\n  int x;\n  int x;\n}",
    unknown_field_type: "struct A {\n  B b;\n}",
    unknown_struct: "export function int main() {\n  A a = null;\n}",
    new_unknown_struct: "export function int main() {\n  int a = new A(1);\n}",
    struct_argument_count: "struct A {\n  int x;\n}\nexport function int main() {\n  A a = new A(1, 2);\n}",
    struct_argument_type: "struct A {\n  int x;\n}\nexport function int main() {\n  A a = new A(true);\n}",
    array_size_type: "export function int main() {\n  array int a = new int[1.5];\n}",
    array_index_type: "export function int main() {\n  array int a = new int[2];\n  return a[true];\n}",
    index_non_array: "export function int main() {\n  int a = 1;\n  return a[0];\n}",
    read_field_of_int: "export function int main() {\n  int a = 1;\n  return a.b;\n}",
    unknown_field:
      "struct A {\n  int x;\n}\nexport function int main() {\n  A a = new A(1);\n  return a.y;\n}",
    delete_int: "export function int main() {\n  int a = 1;\n  delete a;\n}",
    string_literal_append: 'export function int main() {\n  string a = "x";\n  string_append(a, "y");\n}',
    print_overload: "export function int main() {\n  array int a = new int[1];\n  print(a);\n}",
    variable_named_like_function: "function int f() {\n  return 1;\n}\nexport function int main() {\n  int main_f = 1;\n}",
  };

  for (const [name, code] of Object.entries(snippets)) {
    test(name, async () => {
      await expectSameWat(writeSnippet(code));
    });
  }
});

describe("imports", () => {
  test("nested_imports", async () => {
    const dir = path.join(workDir, "nested");
    const lib = path.join(dir, "lib");

    Bun.spawnSync({ cmd: ["mkdir", "-p", lib] });

    writeFileSync(
      path.join(lib, "math.mypl"),
      'import "util.mypl" as Util;\nstruct Point {\n  int x;\n}\nint scale = 3;\nfunction int triple(int x) {\n  return Util::add(x, x) + x;\n}\n'
    );
    writeFileSync(path.join(lib, "util.mypl"), "function int add(int a, int b) {\n  return a + b;\n}\n");
    writeFileSync(
      path.join(dir, "main.mypl"),
      'import "lib/math.mypl" as M;\nexport function int main() {\n  M::Point p = new M::Point(2);\n  print("x");\n  return M::triple(p.x);\n}\n'
    );

    await expectSameWat(path.join(dir, "main.mypl"));
  });
});

// The native compiler compiles its own source to the same WAT as the TS
// compiler, so a compiler built from its output is the same
describe("self compilation", () => {
  test("compile stage", async () => {
    const source = path.join(workDir, "self.mypl");
    copyFileSync(stage.source, source);
    await expectSameWat(source);
  }, 120_000);
});
