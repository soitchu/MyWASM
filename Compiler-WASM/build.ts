// Builds a native compiler stage by concatenating its MyPL sources into one
// file. Importing the same file through two paths gives two copies of its
// types (main_A_Text and main_B_Text), so the sources can't share types via
// imports yet.
//
// Usage: bun Compiler-WASM/build.ts <stage> <output.mypl>

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const STAGES: Record<string, string[]> = {
  lex: ["Text.mypl", "Token.mypl", "Lexer.mypl", "drivers/lex.mypl"],
  parse: [
    "Text.mypl",
    "Token.mypl",
    "Lexer.mypl",
    "Ast.mypl",
    "Parser.mypl",
    "AstDump.mypl",
    "drivers/parse.mypl",
  ],
  compile: [
    "Text.mypl",
    "Token.mypl",
    "Lexer.mypl",
    "Ast.mypl",
    "Parser.mypl",
    "Map.mypl",
    "Path.mypl",
    "Checker.mypl",
    "CoreWat.mypl",
    "Builtins.mypl",
    "drivers/compile.mypl",
  ],
};

export function buildStage(stage: string, output: string) {
  const files = STAGES[stage];

  if (files === undefined) {
    throw new Error(`Unknown stage "${stage}". Stages: ${Object.keys(STAGES).join(", ")}`);
  }

  const source = files
    .map((file) => {
      const contents = readFileSync(path.join(__dirname, file), "utf8");
      return `// ---- ${file} ----\n${contents}\n`;
    })
    .join("\n");

  writeFileSync(output, source);
}

if (import.meta.main) {
  const [stage, output] = process.argv.slice(2);

  if (stage === undefined || output === undefined) {
    console.error("Usage: bun Compiler-WASM/build.ts <stage> <output.mypl>");
    process.exit(1);
  }

  buildStage(stage, output);
}
