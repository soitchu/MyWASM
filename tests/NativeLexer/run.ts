// Compiles and runs a MyWASM file, then writes its captured output after a
// NUL byte, since the compiler logs to stdout as well
import * as Runtime from "../../Runtime/index.ts";
import * as Compiler from "../../Compiler/index.ts";

const wasmBuffer = (await Compiler.init(process.argv[2], "", {
  fastMath: false,
  O: 0,
  S: 0,
  returnBuffer: true,
  unsafeArray: false,
})) as Uint8Array;

const output = await Runtime.init("", false, wasmBuffer, 100, true, true);

process.stdout.write("\0" + output);
