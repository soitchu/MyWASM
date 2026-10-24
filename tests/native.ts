// Helpers for testing the native compiler stages in Compiler-WASM
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as Native from "../Compiler-WASM/native";

export const ROOT = path.join(__dirname, "..");

// Builds a stage and compiles it to WASM, returning the .wasm path and a
// function that removes the temporary files
export async function compileStage(stage: string) {
  const workDir = mkdtempSync(path.join(tmpdir(), `native-${stage}-`));
  const { source, wasm } = await Native.compileStage(stage, workDir);

  return {
    source,
    wasm,
    cleanup: () => rmSync(workDir, { recursive: true, force: true }),
  };
}

// Runs a compiled stage with stdin as its input. Native errors print a
// message starting with one of errorPrefixes and then trap; any other
// failure throws
export function runStage(wasm: string, stdin: string, errorPrefixes: string[]) {
  const result = Native.runStage(wasm, stdin);
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
