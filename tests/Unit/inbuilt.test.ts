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

test("char_code", async () => {
  const output = await runMyWASMOutput(`
    export function int main() {
      string s = "Az /";
      print(char_code(s, 0));
      print(",");
      print(char_code(s, 1));
      print(",");
      print(char_code(s, 2));
      print(",");
      print(char_code(s, 3));
    }
  `);

  expect(output).toBe("65,122,32,47");
});

test("char_code_concatenated", async () => {
  const output = await runMyWASMOutput(`
    export function int main() {
      string a = "ab";
      string b = "cd";
      string_append(a, b);
      print(char_code(a, 1));
      print(",");
      print(char_code(a, 2));
      print(",");
      print(char_code(a, 3));
    }
  `);

  expect(output).toBe("98,99,100");
});

test("chars_to_string", async () => {
  const output = await runMyWASMOutput(`
    export function int main() {
      array int chars = new int[5];
      chars[0] = 104;
      chars[1] = 105;
      chars[2] = 33;
      string s = chars_to_string(chars, 2);
      chars[0] = 120;
      print(s);
      print(",");
      print(length(s));
      delete s;
      delete chars;
    }
  `);

  expect(output).toBe("hi,2");
});

test("chars_to_string_empty", async () => {
  const output = await runMyWASMOutput(`
    export function int main() {
      array int chars = new int[3];
      string s = chars_to_string(chars, 0);
      print("[");
      print(s);
      print("]");
      print(length(s));
    }
  `);

  expect(output).toBe("[]0");
});
