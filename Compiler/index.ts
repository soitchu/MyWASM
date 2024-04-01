import { StringBuffer } from "./StringBuffer.ts";
import { Lexer } from "./Lexer.ts";
import { ASTParser } from "./AST.ts";
import { SemanticChecker } from "./SemanticChecker.ts";
import binaryenModule from "binaryen";
import wabt from "wabt";
import { readFileSync, writeFileSync } from "node:fs";

interface CompilerOptions {
  O: number | undefined
  S: number | undefined,
  fastMath: boolean
}

export async function init(input: string, output: string, options: CompilerOptions) {
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

  const shouldOptimize = options.O !== undefined && options.O > 0;
  const shouldShrink = options.S !== undefined && options.S > 0;
  const shouldFastMatch = options.fastMath === true;

  if (shouldOptimize || shouldShrink || shouldFastMatch) {
    const wasmModule = binaryenModule.readBinary(wasmModuleBuffer);

    binaryenModule.setFastMath(shouldFastMatch);
    binaryenModule.setOptimizeLevel(options.O ?? 0);
    binaryenModule.setShrinkLevel(options.S ?? 0);

    wasmModule.setFeatures(binaryenModule.Features.BulkMemory);
    wasmModule.optimize();

    wasmModuleBuffer = wasmModule.emitBinary();
  }

  writeFileSync(output, wasmModuleBuffer);
}
