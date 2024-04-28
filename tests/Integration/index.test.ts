import * as Runtime from "../../Runtime/index.ts";
import * as Compiler from "../../Compiler/index.ts";
import path from "path";

const wasmBuffer = await Compiler.init(
  path.join(__dirname, "Import/a.mypl"),
  "",
  {
    fastMath: false,
    O: 4,
    S: 0,
    returnBuffer: true,
    unsafeArray: false,
  }
) as Uint8Array;

const output = await Runtime.init("", false, wasmBuffer, 100, true, true);

console.log(output === "10\n20.0000000000");