import * as Runtime from "../../Runtime/index.ts";
import * as Compiler from "../../Compiler/index.ts";
import path from "path";

async function runMyWASMFile(entryFile: string) {
  const wasmBuffer = (await Compiler.init(
    path.join(__dirname, entryFile),
    "",
    {
      fastMath: false,
      O: 4,
      S: 0,
      returnBuffer: true,
      unsafeArray: false,
    }
  )) as Uint8Array;

  return await Runtime.init("", false, wasmBuffer, 100, true, true) as string;
}

runMyWASMFile("DancingParrot/main.mypl").then((x) => {
  console.log(x);
})
