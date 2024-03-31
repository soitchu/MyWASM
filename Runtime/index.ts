import fs from "node:fs";
import * as WASM from "./WASM.ts";

export async function init(filename: string) {
    const wasmModuleBuffer = fs.readFileSync(filename);

    const memory = new WebAssembly.Memory({
        initial: 10000,
        maximum: 10000,
    });

    const ini = "default" in WASM ? WASM.ini : WASM.ini;
    const exports = (await ini(memory, wasmModuleBuffer)).instance.exports as WASM.testWasmExports;

    exports.main();
}