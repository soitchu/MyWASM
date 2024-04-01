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
  .option("--fast-math", "allows \"loose\" math semantics")
  .action(async (input: string, output: string, options) => {
    Compiler.init(input, output, options);
  });

program
  .command("run")
  .description("Runs a MyWASM file")
  .argument("<string>", "input; should be a .wasm file")
  .option("--debug", "prints the time taken to execute and the memory")
  .action(async (input: string, config) => {
    await Runtime.init(input, config.debug);
  });

program.parse();
