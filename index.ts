import { Command } from "commander";
import * as Runtime from "./Runtime/index.ts";
import * as Compiler from "./Compiler/index.ts";

const program = new Command();

program.name("MyWASM").description("A WASM compiler for MyPL").version("0.0.1");

program
  .command("compile")
  .description("Compiles a MyPL file to WASM")
  .argument("<string>", "input; should be a .mypl file")
  .argument("<string>", "output; should be a .wasm file")
  .option("-O <number>", "level of optimization")
  .option("-S <number>", "shrink level")
  .option("--fast-math", 'allows "loose" math semantics')
  .option("--unsafe-array", 'Disables null and bound checking')
  .option("--wat", 'emits the wat instead')
  .action(async (input: string, output: string, options) => {
    Compiler.init(input, output, options);
  });

program
  .command("run")
  .description("Runs a MyWASM file")
  .argument("<string>", "input; should be a .wasm file")
  .option("--debug", "prints the time taken to execute and the memory")
  .option("--compile", "compiles a .mypl file and then runs it")
  .option("--zero-on-dealloc", "zeroes the memory when it is deallocated")
  .option("--memory <string>", "Size of memory that will be passed to the WASM runtime. eg. 10K, 10kb, 10M, 10mb, 1G, 4.5gb")
  .action(async (input: string, config) => {

    let wasmBuffer: Uint8Array | undefined;

    // console.log(config.memory);
    const memoryPages = config.memory ? convertToWASMPages(config.memory): 16;

    if (config.compile) {
      wasmBuffer = await Compiler.init(input, "", {
        fastMath: false,
        O: 4,
        S: 0,
        returnBuffer: true,
        unsafeArray: false
      });
    }

    await Runtime.init(input, config.debug, wasmBuffer!, memoryPages, config.zeroOnDealloc === true, false);
  });

program.parse();

function convertToWASMPages(sizeStr: string): number | never {
  const sizeUnits: Record<string, number> = {
      'kb': 1024,
      'k': 1024,
      'mb': 1024 ** 2,
      'm': 1024 ** 2,
      'gb': 1024 ** 3,
      'g': 1024 ** 3,
  };

  sizeStr = sizeStr.toLowerCase();

  try {
      const numericPart = parseFloat(sizeStr.slice(0, -1));
      let unit = sizeStr.slice(-2);

      if(unit.charCodeAt(0) >= 48 && unit.charCodeAt(0) <= 57) {
        unit = sizeStr.slice(-1);
      }

      unit = unit.toLowerCase();

      if (!(unit in sizeUnits)) {
          throw new Error(`Unsupported size unit: ${unit}`);
      }

      if(Math.floor(numericPart * sizeUnits[unit]) % 2 ** 16 !== 0) {
        throw new Error("The memory size must be a multiple of 64kb");
      }

      return Math.floor(numericPart * sizeUnits[unit]) / 2 ** 16;
  } catch (error) {
      throw new Error(`Invalid size string: ${sizeStr}: ${error.message}`);
  }
}

export {
  Runtime,
  Compiler
};