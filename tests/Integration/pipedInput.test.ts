import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, test } from "bun:test";

const workDir = mkdtempSync(path.join(tmpdir(), "piped-input-"));
const INDEX = path.join(__dirname, "../../index.ts");

afterAll(() => rmSync(workDir, { recursive: true, force: true }));

// Prints every line read from stdin as [length]line| until input() gives null
const ECHO_PROGRAM = `
export function int main() {
  string line = input();

  while (line != null) {
    print("[");
    print(length(line));
    print("]");
    print(line);
    print("|");
    delete line;
    line = input();
  }

  print("eof");
}
`;

// run uses the Rust runtime when it's built, so both runtimes are tested
const RUNTIMES: Record<string, Record<string, string>> = {
  bun: { MYWASM_RUNTIME: "bun" },
  default: {},
};

function runWithStdin(stdin: string, env: Record<string, string>) {
  const file = path.join(workDir, "echo.mypl");
  writeFileSync(file, ECHO_PROGRAM);

  const result = Bun.spawnSync({
    cmd: [process.execPath, INDEX, "run", "--compile", file],
    stdin: Buffer.from(stdin),
    env: { ...process.env, ...env },
    timeout: 10_000,
  });

  expect(result.stderr.toString()).not.toContain("Error");

  // The compiler logs to stdout before the program runs
  const stdout = result.stdout.toString();
  return stdout.slice(stdout.lastIndexOf("}\n") + 2);
}

for (const [runtime, env] of Object.entries(RUNTIMES)) {
  describe(runtime, () => {
    test("piped_input_reads_lines_until_eof", () => {
      expect(runWithStdin('int a = "x";\n\n  // c\n', env)).toBe(
        '[12]int a = "x";|[0]|[6]  // c|eof'
      );
    });

    test("piped_input_without_trailing_newline", () => {
      expect(runWithStdin("a\nbc", env)).toBe("[1]a|[2]bc|eof");
    });

    test("piped_input_empty", () => {
      expect(runWithStdin("", env)).toBe("eof");
    });
  });
}
