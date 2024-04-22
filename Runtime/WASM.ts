import { MemoryManager } from "./MemoryManager.ts";
import rl from "readline-sync";


export interface testWasmExports extends WebAssembly.Exports {
    main: Function,
    string_ini: (length: number) => number,
    string_ini_assign: (array: number, index: number, value: number) => void
}

export async function ini(memory: WebAssembly.Memory, wasmModuleBuffer: Uint8Array) {
    const freed_mem = new MemoryManager();
    const intArray = new Int32Array(memory.buffer);
    // const nullError = new WebAssembly.Tag({ parameters: ["i32"] });

    let sum = 0;

    const wasmModule = (await WebAssembly.instantiate(wasmModuleBuffer, {
        env: {
            memory: memory,
            print: function (index: number) {
                const str = parseString(index / 4, memory).replace(/\\n/g, "\n");
                process.stdout.write(str);
            },
            
            input: function () {
                const exported = wasmModule.instance.exports as testWasmExports;
                const input = rl.question("");
                const stringPointer = exported.string_ini(input.length);
                for (let i = 0; i < input.length; i++) {
                    exported.string_ini_assign(stringPointer, i, input.charCodeAt(i));
                }
                return stringPointer;
            },

            allocate_memory(requestedSize: number) {
                // TODO make sure that we don't give an insane amount of memory
                // if only a few bytes are needed. Also, make sure that the remainder
                // of the memory goes back into the freed pool
                // let start = performance.now();

                const foundOffset = freed_mem.getOffset(requestedSize);
                
                if (foundOffset === undefined) {
                    let tmpOffset = freed_mem.globalOffset;
                    freed_mem.increaseGlobalOffset(requestedSize);
                    // sum += performance.now() - start;
                    // console.log(sum);
                    return tmpOffset;
                }
                else {
                    return foundOffset;
                }
            },
            deallocate_memory(index: number, size: number) {
                // let start = performance.now();

                // const realIndex = index / 4;
                // const realSize = size / 4;
                
                // for (let i = realIndex; i < (realIndex + realSize); i++) {
                //     intArray[i] = 0;
                // }
                
                freed_mem.add(size, index);
                // sum += performance.now() - start;
                // console.log(sum);
            },
            sleep(ms: number) {
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
            },
            random() {
                return Math.random();
            }
        }
    }));

    freed_mem.globalOffset = new Uint32Array(memory.buffer)[1];

    return wasmModule;
}

export function parseString(startIndex: number, memory: WebAssembly.Memory) {
    const intArray = new Int32Array(memory.buffer, 0);
    const length = intArray[startIndex - 1];
    let resultantString = "";

    for (let i = 0; i < length; i++) {
        resultantString += String.fromCharCode(intArray[startIndex + i]);
    }

    return resultantString;
}