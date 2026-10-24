// Helpers for testing the native compiler stages in Compiler-WASM
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as Compiler from "../Compiler/index.ts";
import { buildStage } from "../Compiler-WASM/build";

export const ROOT = path.join(__dirname, "..");

// Builds a stage and compiles it to WASM, returning the .wasm path and a
// function that removes the temporary files
export async function compileStage(stage: string) {
  const workDir = mkdtempSync(path.join(tmpdir(), `native-${stage}-`));
  const source = path.join(workDir, `${stage}.mypl`);
  const wasm = path.join(workDir, `${stage}.wasm`);

  buildStage(stage, source);

  await Compiler.init(source, wasm, {
    O: 0,
    S: 0,
    fastMath: false,
    returnBuffer: false,
    unsafeArray: false,
  });

  return {
    wasm,
    cleanup: () => rmSync(workDir, { recursive: true, force: true }),
  };
}

// Runs a compiled stage with stdin as its input. Native errors print a
// message starting with errorPrefix and then trap; any other failure throws
export function runStage(wasm: string, stdin: string, errorPrefixes: string[]) {
  const result = Bun.spawnSync({
    cmd: [process.execPath, path.join(ROOT, "index.ts"), "run", "--memory", "256M", wasm],
    stdin: Buffer.from(stdin),
    timeout: 60_000,
  });

  const stdout = result.stdout.toString();

  if (result.exitCode !== 0 && !errorPrefixes.some((prefix) => stdout.includes(prefix))) {
    throw new Error(`Native stage crashed:\n${result.stderr.toString().slice(-2000)}`);
  }

  return stdout;
}

// The native stages read stdin line by line and end every line with a
// newline, so the TS stages get the same text
export function normalize(code: string) {
  return code === "" || code.endsWith("\n") ? code : code + "\n";
}

export function repoMyPLFiles() {
  return Bun.spawnSync({ cmd: ["git", "ls-files", "*.mypl"], cwd: ROOT })
    .stdout.toString()
    .trim()
    .split("\n");
}

export function readRepoFile(file: string) {
  return readFileSync(path.join(ROOT, file), "utf8");
}
