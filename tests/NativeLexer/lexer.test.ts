import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, expect, test } from "bun:test";

const NATIVE_DIR = path.join(__dirname, "../../Compiler-WASM");
const workDir = mkdtempSync(path.join(tmpdir(), "native-lexer-"));

copyFileSync(
  path.join(NATIVE_DIR, "StringBuffer.mypl"),
  path.join(workDir, "StringBuffer.mypl")
);

// Lexer.mypl without its main function, so tests can supply their own
const lexerSource = readFileSync(path.join(NATIVE_DIR, "Lexer.mypl"), "utf8")
  .split("export function int main()")[0];

afterAll(() => rmSync(workDir, { recursive: true, force: true }));

// Runs `main` with the lexer's functions in scope. Runs in a separate process
// so a program that hangs fails the test instead of the whole suite
function runWithLexer(name: string, main: string) {
  const file = path.join(workDir, `${name}.mypl`);
  writeFileSync(file, lexerSource + "\nexport function int main() {\n" + main + "\n}\n");

  const result = Bun.spawnSync({
    cmd: [process.execPath, path.join(__dirname, "run.ts"), file],
    timeout: 10_000,
  });

  const stdout = result.stdout.toString();

  if (result.exitCode !== 0 || !stdout.includes("\0")) {
    throw new Error(
      `${name} exited with ${result.exitCode ?? result.signalCode}: ` +
        result.stderr
          .toString()
          .split("\n")
          .filter((line) => /error/i.test(line) && line.length < 300)
          .join("\n")
    );
  }

  return stdout.slice(stdout.indexOf("\0") + 1);
}

// Use-after-free

test("is_valid_id_keeps_its_argument", () => {
  const output = runWithLexer("is_valid_id", `
    string code = "ab";
    StringBuffer::ini(code);
    read();
    print(is_valid_id(lexeme));
    print(lexeme);
    read();
    print(lexeme);
  `);

  expect(output).toBe("trueab");
});

test("isNumeric_keeps_its_argument", () => {
  const output = runWithLexer("isNumeric", `
    string s = "5";
    print(isNumeric(s));
    print(s);
    print(isNumeric(s));
  `);

  expect(output).toBe("true5true");
});

test("handle_comments_clears_lexeme", () => {
  const output = runWithLexer("handle_comments", `
    string code = "// hi";
    StringBuffer::ini(code);
    read();
    handle_comments();
    print(lexeme == null);
    read();
    print(lexeme);
  `);

  expect(output).toBe("true/");
});

// EOF

test("is_eof", () => {
  const output = runWithLexer("is_eof", `
    string code = "a";
    StringBuffer::ini(code);
    print(StringBuffer::is_eof());
    read();
    print(StringBuffer::is_eof());
  `);

  expect(output).toBe("falsetrue");
});

test("is_eof_on_empty_input", () => {
  const output = runWithLexer("is_eof_empty", `
    string code = "";
    StringBuffer::ini(code);
    print(StringBuffer::is_eof());
  `);

  expect(output).toBe("true");
});

test("read_past_eof_gives_null", () => {
  const output = runWithLexer("read_past_eof", `
    string code = "a";
    StringBuffer::ini(code);
    read();
    print(lexeme);
    read();
    print(lexeme == null);
    read();
    print(lexeme == null);
  `);

  expect(output).toBe("atruetrue");
});

test("peek_at_eof_gives_null", () => {
  const output = runWithLexer("peek_at_eof", `
    string code = "";
    StringBuffer::ini(code);
    peek();
    print(lexeme == null);
  `);

  expect(output).toBe("true");
});

test("whitespace_before_char", () => {
  const output = runWithLexer("whitespace_before_char", `
    string code = "   b";
    StringBuffer::ini(code);
    handle_whitespaces();
    print(lexeme);
  `);

  expect(output).toBe("b");
});

test("trailing_whitespace_reaches_eof", () => {
  const output = runWithLexer("trailing_whitespace", `
    string code = "a  ";
    StringBuffer::ini(code);
    read();
    handle_whitespaces();
    print(lexeme == null);
  `);

  expect(output).toBe("true");
});

test("only_whitespace_reaches_eof", () => {
  const output = runWithLexer("only_whitespace", `
    string code = "   ";
    StringBuffer::ini(code);
    handle_whitespaces();
    print(lexeme == null);
    print(StringBuffer::is_eof());
  `);

  expect(output).toBe("truetrue");
});

test("whitespace_on_empty_input", () => {
  const output = runWithLexer("whitespace_empty", `
    string code = "";
    StringBuffer::ini(code);
    handle_whitespaces();
    print(lexeme == null);
  `);

  expect(output).toBe("true");
});

test("helpers_handle_null", () => {
  const output = runWithLexer("helpers_null", `
    string s = null;
    print(isSpace(s));
    print(isNewLine(s));
    print(isNumeric(s));
    print(isAlpha(s));
    print(is_valid_id(s));
  `);

  expect(output).toBe("falsefalsefalsefalsefalse");
});
