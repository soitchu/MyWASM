// Compares the native lexer (Compiler-WASM) with the TS lexer token by token
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Lexer } from "../../Compiler/Lexer";
import { StringBuffer } from "../../Compiler/StringBuffer";
import { MyWASMError, TokenType } from "../../Compiler/types";
import { compileStage, normalize, readRepoFile, repoMyPLFiles, runStage } from "../native";

let stage: Awaited<ReturnType<typeof compileStage>>;

beforeAll(async () => {
  stage = await compileStage("lex");
});

afterAll(() => stage.cleanup());

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

function expectSameTokens(code: string) {
  expect(runStage(stage.wasm, code, ["Lexer error"])).toBe(tsTokens(code));
}

describe("repo files", () => {
  for (const file of repoMyPLFiles()) {
    test(file, () => {
      expectSameTokens(readRepoFile(file));
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
