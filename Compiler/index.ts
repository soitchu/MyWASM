import { StringBuffer } from "./StringBuffer";
import { Lexer } from "./Lexer";
import { ASTParser } from "./AST";
import { SemanticChecker } from "./SemanticChecker";
import binaryenModule from "binaryen";
import { readFileSync, writeFileSync } from "node:fs";
import { MyWASMError } from "./types";
import { join } from "node:path";
import wabt from "wabt";

interface CompilerOptions {
  O: number | undefined;
  S: number | undefined;
  unsafeArray: boolean | undefined;
  fastMath: boolean;
  returnBuffer: boolean;
  rawCode?: boolean;
  wat?: boolean;
}

export async function init(
  input: string,
  output: string,
  options: CompilerOptions
) {

  // const inbuitCode = readFileSync(join(__dirname, "./inbuilt.mypl"), "utf8");
  // const inbuiltLexer = new Lexer(new StringBuffer(inbuitCode));
  // const inbuiltast = new ASTParser(inbuiltLexer);
  // const inbuiltProgram = inbuiltast.parse();

  const code = (options.rawCode ? input : readFileSync(input, "utf8"));
  const lexer = new Lexer(new StringBuffer(code));
  const ast = new ASTParser(lexer);
  const program = ast.parse();

  // program.fun_defs.push(...inbuiltProgram.fun_defs);
  // program.struct_defs.push(...inbuiltProgram.struct_defs);


  const codeGen = new SemanticChecker(true, undefined, join(input, "../"));
  const wat = codeGen.visit_program(program, options) as string;

  // console.log(wat);


  if(options.wat) {
    writeFileSync(output, wat, "utf-8");
    return;
  }

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

  if (options.returnBuffer === true) {
    return wasmModuleBuffer;
  } else {
    writeFileSync(output, wasmModuleBuffer);
  }
}
