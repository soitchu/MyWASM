// Compares the native lexer (Compiler-WASM) with the TS lexer token by token
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as Compiler from "../../Compiler/index.ts";
import { Lexer } from "../../Compiler/Lexer";
import { StringBuffer } from "../../Compiler/StringBuffer";
import { MyWASMError, TokenType } from "../../Compiler/types";
import { buildStage } from "../../Compiler-WASM/build";

const ROOT = path.join(__dirname, "../..");
const workDir = mkdtempSync(path.join(tmpdir(), "native-lexer-"));
const lexerWasm = path.join(workDir, "lex.wasm");

beforeAll(async () => {
  const source = path.join(workDir, "lex.mypl");
  buildStage("lex", source);

  await Compiler.init(source, lexerWasm, {
    O: 0,
    S: 0,
    fastMath: false,
    returnBuffer: false,
    unsafeArray: false,
  });
});

afterAll(() => rmSync(workDir, { recursive: true, force: true }));

// The native lexer reads stdin line by line and ends every line with a
// newline, so the TS lexer gets the same text
function normalize(code: string) {
  return code === "" || code.endsWith("\n") ? code : code + "\n";
}

function tsTokens(code: string) {
  const lexer = new Lexer(new StringBuffer(normalize(code)));
  let output = "";

  try {
    while (true) {
      const token = lexer.next_token();
      output += `${token.token_type} ${token.line} ${token.column} ${token.lexeme}\n`;

      if (token.token_type === TokenType.EOS) {
        return output;
      }
    }
  } catch (e) {
    const error = e as MyWASMError;
    return output + `Lexer error (line ${error.line}, column ${error.column}): ${error.message}\n`;
  }
}

function nativeTokens(code: string) {
  const result = Bun.spawnSync({
    cmd: [process.execPath, path.join(ROOT, "index.ts"), "run", lexerWasm],
    stdin: Buffer.from(code),
    timeout: 20_000,
  });

  const stdout = result.stdout.toString();
  const failed = result.exitCode !== 0;

  // A lexer error prints its message and then traps
  if (failed && !stdout.includes("Lexer error")) {
    throw new Error(`Native lexer crashed:\n${result.stderr.toString().slice(-2000)}`);
  }

  return stdout;
}

function expectSameTokens(code: string) {
  expect(nativeTokens(code)).toBe(tsTokens(code));
}

describe("repo files", () => {
  const files = Bun.spawnSync({ cmd: ["git", "ls-files", "*.mypl"], cwd: ROOT })
    .stdout.toString()
    .trim()
    .split("\n");

  for (const file of files) {
    test(file, () => {
      expectSameTokens(readFileSync(path.join(ROOT, file), "utf8"));
    });
  }
});

describe("snippets", () => {
  const snippets: Record<string, string> = {
    empty: "",
    only_whitespace: "   \t  \n\n  ",
    operators: "a==b!=c<=d>=e<f>g=h",
    arithmetic: "a+b-c*d/e%f",
    punctuation: "(a,b)[c].d;{e}",
    scope_resolution: "Lib::f(x);",
    comment_then_code: "x // comment here\ny",
    comment_at_eof: "x // no newline after",
    divide_not_comment: "a / b",
    string_literal: 'print("hello world");',
    string_with_backslash: 'print("a\\nb");',
    ints_and_doubles: "0 7 120 0.5 3.25 10.0",
    double_without_fraction: "1.",
    dot_then_digits: ".5",
    keywords:
      "null true false int double string bool void and or not if elseif else while for return struct array new function import as delete export",
    identifiers: "a abc a_b a1 B2c",
    crlf: "int a;\r\nint b;\r\n",
    tabs: "\tint\ta;",
    unicode_in_string: 'print("héllo");',
    // Errors
    stray_bang: "a ! b",
    single_colon: "a : b",
    unterminated_string: 'print("abc',
    newline_in_string: 'print("abc\ndef");',
    multiple_decimal_points: "1.2.3",
    int_leading_zero: "007",
    double_leading_zero: "00.5",
    id_starting_with_underscore: "_abc",
    unexpected_character: "a @ b",
  };

  for (const [name, code] of Object.entries(snippets)) {
    test(name, () => {
      expectSameTokens(code);
    });
  }
});
