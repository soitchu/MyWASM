import fs from "node:fs";
import * as WASM from "./WASM.ts";

export async function init(filename: string, debug: boolean, wasmBuffer: Uint8Array) {
    const wasmModuleBuffer = wasmBuffer === undefined ? fs.readFileSync(filename) : wasmBuffer;

    const memory = new WebAssembly.Memory({
        initial: 16800,
        maximum: 16800,
    });

    const ini = "default" in WASM ? WASM.ini : WASM.ini;
    const exports = (await ini(memory, wasmModuleBuffer)).instance.exports as WASM.testWasmExports;

    const start = performance.now();
    exports.main();

    if(debug){
        console.log(performance.now() - start);
        console.log(new Uint32Array(memory.buffer));
    }
}