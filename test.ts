import {
  ini,
  parseString,
  parseStringStruct,
  testWasmExports,
} from "./Runtime/WASM";
import * as Compiler from "./Compiler/index.ts";
import { expect, test } from "bun:test";

export async function runMyWASMCode(code: string) {
  const memory = new WebAssembly.Memory({
    initial: 1,
    maximum: 100,
  });

  const wasmModuleBuffer = (await Compiler.init(code, "", {
    O: 0,
    S: 0,
    fastMath: false,
    returnBuffer: true,
    unsafeArray: true,
    rawCode: true,
  })) as Uint8Array;

  // console.log(wasmModuleBuffer);

  const exports = (await ini(memory, wasmModuleBuffer, true)).wasmModule!
    .instance.exports as testWasmExports;

  return [(exports.main as Function)(), memory];
}

const [result, memory] = await runMyWASMCode(`
      export function string main() {
        array double a = new double[40];
        string s1 = "hel";
        string s2 = "lo";
        array double b = new double[40];
        string s3 = " world";
        
        string_append(s1, s2);
        string_append(s1, s3);
  
        return s1;
      }
    `);

const resultantString = parseStringStruct(result / 4, memory);
// console.log(result / 4);
console.log(resultantString);
console.log(new Int32Array(memory.buffer));
