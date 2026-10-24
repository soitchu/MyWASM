import { ini, testWasmExports } from "../../Runtime/WASM";
import * as Compiler from "../../Compiler/index.ts";
import { expect, test } from "bun:test";

async function runMyWASMOutput(code: string): Promise<string> {
  const memory = new WebAssembly.Memory({
    initial: 1,
    maximum: 100,
  });

  const wasmModuleBuffer = (await Compiler.init(code, "", {
    O: 0,
    S: 0,
    fastMath: false,
    returnBuffer: true,
    unsafeArray: false,
    rawCode: true,
  })) as Uint8Array;

  const runtime = await ini(memory, wasmModuleBuffer, true, true);
  (runtime.wasmModule!.instance.exports as testWasmExports).main();

  return runtime.output;
}

test("itos_zero", async () => {
  const output = await runMyWASMOutput(`
    export function int main() {
      print(itos(0));
    }
  `);

  expect(output).toBe("0");
});

test("print_int_zero", async () => {
  const output = await runMyWASMOutput(`
    export function int main() {
      print(0);
      print(",");
      print(10 - 10);
    }
  `);

  expect(output).toBe("0,0");
});

test("itos_other_ints", async () => {
  const output = await runMyWASMOutput(`
    export function int main() {
      print(itos(7));
      print(",");
      print(itos(120));
      print(",");
      print(itos(0 - 45));
    }
  `);

  expect(output).toBe("7,120,-45");
});
