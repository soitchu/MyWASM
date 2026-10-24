// Runs the native compiler. It can only read stdin, so this builds its input
// from the main file, inbuilt.mypl and the files the main file imports.
//
// Usage: bun Compiler-WASM/native.ts <input.mypl> <output.wat> [--unsafe-array]

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as Compiler from "../Compiler/index.ts";
import { buildStage } from "./build";

export const INBUILT = path.join(__dirname, "../Compiler/inbuilt.mypl");

// The files a file imports, by the path the TS compiler resolves them to
function importedFiles(file: string, dir: string, found: Map<string, string>) {
  const source = readFileSync(file, "utf8");

  for (const match of source.matchAll(/import\s+"([^"]+)"\s+as/g)) {
    const importPath = path.join(dir, match[1]);

    if (!found.has(importPath) && existsSync(importPath)) {
      found.set(importPath, readFileSync(importPath, "utf8"));
      importedFiles(importPath, path.join(dir, match[1], "../"), found);
    }
  }

  return found;
}

function fileInput(filePath: string, source: string) {
  const lines = source.split("\n");

  if (source.endsWith("\n")) {
    lines.pop();
  }

  return `${filePath}\n${lines.length}\n${lines.map((line) => line + "\n").join("")}`;
}

// The native compiler's stdin for compiling mainPath (see drivers/compile.mypl)
export function nativeCompilerInput(mainPath: string, unsafeArray: boolean) {
  // inbuilt.mypl and the main file always come first, even when they're the
  // same file
  const files: [string, string][] = [
    [INBUILT, readFileSync(INBUILT, "utf8")],
    [mainPath, readFileSync(mainPath, "utf8")],
    ...importedFiles(mainPath, path.join(mainPath, "../"), new Map()),
  ];

  return (
    `${unsafeArray ? 1 : 0}\n${mainPath}\n${files.length}\n` +
    files.map(([filePath, source]) => fileInput(filePath, source)).join("")
  );
}

// Builds a stage and compiles it to WASM with the TS compiler
export async function compileStage(stage: string, workDir: string) {
  const source = path.join(workDir, `${stage}.mypl`);
  const wasm = path.join(workDir, `${stage}.wasm`);

  buildStage(stage, source);

  // Compiler.init logs its string map, which isn't useful here
  const log = console.log;
  console.log = () => {};

  try {
    await Compiler.init(source, wasm, {
      O: 0,
      S: 0,
      fastMath: false,
      returnBuffer: false,
      unsafeArray: false,
    });
  } finally {
    console.log = log;
  }

  return { source, wasm };
}

// Runs a compiled stage with the given stdin
export function runStage(wasm: string, stdin: string) {
  return Bun.spawnSync({
    cmd: [process.execPath, path.join(__dirname, "../index.ts"), "run", "--memory", "256M", wasm],
    stdin: Buffer.from(stdin),
    timeout: 120_000,
  });
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const unsafeArray = args.includes("--unsafe-array");
  const [input, output] = args.filter((arg) => arg !== "--unsafe-array");

  if (input === undefined || output === undefined) {
    console.error("Usage: bun Compiler-WASM/native.ts <input.mypl> <output.wat> [--unsafe-array]");
    process.exit(1);
  }

  const workDir = mkdtempSync(path.join(tmpdir(), "native-compiler-"));

  try {
    const { wasm } = await compileStage("compile", workDir);
    const result = runStage(wasm, nativeCompilerInput(path.resolve(input), unsafeArray));
    const stdout = result.stdout.toString();

    if (result.exitCode !== 0) {
      // Compile errors are printed and then the compiler traps
      console.error(stdout.trim() || result.stderr.toString());
      process.exit(1);
    }

    writeFileSync(output, stdout);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}
