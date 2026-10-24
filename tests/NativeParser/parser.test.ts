// Compares the native parser's AST (Compiler-WASM) with the TS parser's
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { ASTParser } from "../../Compiler/AST";
import { Lexer } from "../../Compiler/Lexer";
import { StringBuffer } from "../../Compiler/StringBuffer";
import { MyWASMError } from "../../Compiler/types";
import { compileStage, normalize, readRepoFile, repoMyPLFiles, runStage } from "../native";
import { dumpProgram } from "./dump";

let stage: Awaited<ReturnType<typeof compileStage>>;

beforeAll(async () => {
  stage = await compileStage("parse");
});

afterAll(() => stage.cleanup());

function tsAst(code: string) {
  try {
    const parser = new ASTParser(new Lexer(new StringBuffer(normalize(code))));
    return dumpProgram(parser.parse());
  } catch (e) {
    const error = e as MyWASMError;
    return `${error.type} error (line ${error.line}, column ${error.column}): ${error.message}\n`;
  }
}

function expectSameAst(code: string) {
  expect(runStage(stage.wasm, code, ["Lexer error", "Grammar error"])).toBe(tsAst(code));
}

describe("repo files", () => {
  for (const file of repoMyPLFiles()) {
    test(file, () => {
      expectSameAst(readRepoFile(file));
    });
  }
});

describe("snippets", () => {
  const snippets: Record<string, string> = {
    empty: "",
    globals: 'int a = 1;\ndouble b = 2.5;\nstring s = "x";\nbool t = true;\nNode n = null;',
    imports: 'import "lib/a.mypl" as A;\nimport "b.mypl" as *;',
    struct_with_fields: "struct Node {\n  int value;\n  Node next;\n  array int items;\n  Lib::Thing t;\n}",
    empty_function: "function void f() {}",
    exported_function: "export function int main() {\n  return 0;\n}",
    params_and_shadowing:
      "function int f(int a, array double b, Node c) {\n  int x = a;\n  if (true) {\n    int x = 2;\n    x = x + a;\n  } elseif (false) {\n    int a = 3;\n  } else {\n    x = 4;\n  }\n  return x;\n}",
    loops:
      "function void f() {\n  for (int i = 0; i < 10; i = i + 1) {\n    int j = i;\n    while (j > 0) {\n      j = j - 1;\n    }\n  }\n}",
    precedence:
      "function bool f(int a, int b) {\n  return not a + b * 2 - 1 > 3 and a % 2 == 0 or (a / b != 1);\n}",
    nested_not: "function bool f(bool a) {\n  return not not a and (not a);\n}",
    struct_paths:
      "function void f(Node n) {\n  n.next.items[n.value + 1].x = n.items[0];\n  delete n.next;\n  delete n;\n}",
    new_values:
      "function void f() {\n  Node a = new Node(1, null, new int[3]);\n  array Node b = new Node[5];\n  Lib::Thing c = new Lib::Thing();\n  array Lib::Thing d = new Lib::Thing[2];\n}",
    calls:
      'function void f() {\n  print("hi");\n  g(1, h(2), Lib::k(3));\n  Lib::run();\n  int x = length(s) + itos(5);\n}',
    variable_named_like_type:
      "struct Node {\n  int v;\n}\nfunction void f() {\n  int Node = 1;\n  Node n = null;\n}",
    comments: "// leading\nfunction void f() { // trailing\n  int a = 1; // here\n}\n// end",
    // Errors
    missing_semicolon: "function void f() {\n  int a = 1\n}",
    missing_rbrace: "function void f() {\n  int a = 1;",
    global_needs_literal: "int a = 1 + 2;",
    global_needs_value: "int a;",
    global_from_variable: "int a = b;",
    bad_struct: "struct { int a; }",
    bad_function_name: "function int (int a) {}",
    bad_rvalue: "function void f() {\n  int a = ;\n}",
    bad_new: "function void f() {\n  int a = new 5;\n}",
    bad_import: 'import "x.mypl" Lib;',
    missing_function_keyword: "export int f() {}",
    bad_for: "function void f() {\n  for (int i = 0; i < 3; 5) {}\n}",
    lexer_error_inside_parser: "function void f() {\n  int a = 1 ! 2;\n}",
  };

  for (const [name, code] of Object.entries(snippets)) {
    test(name, () => {
      expectSameAst(code);
    });
  }
});
