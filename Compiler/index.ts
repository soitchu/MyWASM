import { StringBuffer } from "./StringBuffer.ts";
import { Lexer } from "./Lexer.ts";
import { ASTParser } from "./AST.ts";
import { SemanticChecker } from "./SemanticChecker.ts";
import binaryenModule from "binaryen";
import wabt from "wabt";
import { readFileSync, writeFileSync } from "node:fs";

export async function init(input: string, output: string, options) {
  const lexer = new Lexer(new StringBuffer(readFileSync(input, "utf8")));
  const ast = new ASTParser(lexer);
  const program = ast.parse();
  const codeGen = new SemanticChecker();
  const wat = codeGen.visit_program(program) as string;

  const wabtModule = await wabt();
  let wasmModuleBuffer = wabtModule
    .parseWat("", wat, {
      gc: true,
    })
    .toBinary({}).buffer;

  if (options.optimize) {
    const wasmModule = binaryenModule.readBinary(wasmModuleBuffer);
    binaryenModule.setFastMath(true);
    binaryenModule.setOptimizeLevel(4);
    binaryenModule.setShrinkLevel(0);
    wasmModule.setFeatures(binaryenModule.Features.BulkMemory);
    wasmModule.optimize();
    wasmModuleBuffer = wasmModule.emitBinary();
  }

  writeFileSync(output, wasmModuleBuffer);
}
