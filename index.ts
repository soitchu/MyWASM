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
  .option("--optimize", "optimizes the WASM file")
  .action(async (input: string, output: string, options) => {
    Compiler.init(input, output, options);
  });

program
  .command("run")
  .description("Runs a MyWASM file")
  .argument("<string>", "input; should be a .wasm file")
  .action((input: string) => {
    Runtime.init(input);
  });

program.parse();
