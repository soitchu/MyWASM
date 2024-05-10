import * as Runtime from "../../Runtime/index.ts";
import * as Compiler from "../../Compiler/index.ts";
import path from "path";
import { expect, test } from "bun:test";

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
      wat: false
    }
  )) as Uint8Array;

  return await Runtime.init("", false, wasmBuffer, 100, true, true) as string;
}

test("import_system_1", async () => {
  const output = await runMyWASMFile("Import/main.mypl");

  expect(output).toBe("10\n20.0000000000");
});

test("import_system_2", async () => {
  const output = await runMyWASMFile("Import/main2.mypl");

  expect(output).toBe("20\n3.0000000000");
});