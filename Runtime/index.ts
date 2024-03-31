import binaryenModule from "binaryen";
import fs from "node:fs";
import wabt from "wabt";
import * as WASM from "./WASM.ts";

async function init() {
    const wabtModule = await wabt();
    // // console.log(wabtModule);
    const watFile = fs.readFileSync("out.wat").toString();
    const wasmModuleBuffer = wabtModule.parseWat("", watFile, {
        gc: true,
    }).toBinary({}).buffer;

    const wasmModule = binaryenModule.readBinary(wasmModuleBuffer);
    
    binaryenModule.setFastMath(true);
    binaryenModule.setOptimizeLevel(4);
    binaryenModule.setShrinkLevel(0);

    wasmModule.setFeatures(binaryenModule.Features.BulkMemory);
    wasmModule.optimize();

    const memory = new WebAssembly.Memory({
        initial: 10000,
        maximum: 10000,
    });

    // // console.log()
    // const optimizedWat =  wasmModule.emitText();
    // fs.writeFileSync(path.join(__dirname, "../opti.wat"), optimizedWat);
    // // console.log(wasmModule.emitText())

    const ini = "default" in WASM ? WASM.ini : WASM.ini;
    const exports = (await ini(memory, wasmModule.emitBinary())).instance.exports;
    

    // console.log(exports);
    exports.main()
    // let start = performance.now();
    // console.log();
    // console.log(performance.now() - start);
    // console.log(new Uint32Array(memory.buffer));
}

init();
// var myModule = new binaryen.Module();


// const watFile = fs.readFileSync("out.wat").toString();


// console.log(binaryen.parseText(watFile));