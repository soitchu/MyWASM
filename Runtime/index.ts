import fs from "node:fs";
import * as WASM from "./WASM.ts";

export async function init(
  filename: string,
  debug: boolean,
  wasmBuffer: Uint8Array,
  memoryPages: number,
  zeroOnDealloc: boolean,
  captureOutput: boolean
) {
  const wasmModuleBuffer =
    wasmBuffer === undefined ? fs.readFileSync(filename) : wasmBuffer;

  const memory = new WebAssembly.Memory({
    initial: memoryPages,
    maximum: memoryPages,
  });

  const ini = "default" in WASM ? WASM.ini : WASM.ini;
  const exports = await ini(memory, wasmModuleBuffer, zeroOnDealloc, captureOutput);
  const wasmInstance = exports.wasmModule!.instance
    .exports as WASM.testWasmExports;
  const start = performance.now();

  wasmInstance.main();

  if (debug) {
    console.log(performance.now() - start);
    console.log(new Uint32Array(memory.buffer));
  }

  if(captureOutput) {
    return exports.output;
  }
}
