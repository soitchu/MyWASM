// The generated native compiler files must match what generate.ts produces
// from the current TS compiler. Run `bun Compiler-WASM/generate.ts` to update
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "bun:test";
import { GENERATED_FILES } from "../../Compiler-WASM/generate";

for (const [file, generate] of Object.entries(GENERATED_FILES)) {
  test(`${file} is up to date`, () => {
    const current = readFileSync(path.join(__dirname, "../../Compiler-WASM", file), "utf8");
    expect(current).toBe(generate());
  });
}
