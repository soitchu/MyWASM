import { MemoryManager } from "./MemoryManager.ts";
import rl from "readline-sync";


export interface testWasmExports extends WebAssembly.Exports {
    main: Function,
    string_ini: (length: number) => number,
    string_ini_assign: (array: number, index: number, value: number) => void
}

interface DeallocQueue {
    next: null | DeallocQueue,
    index: number,
    size: number
}


export async function ini(memory: WebAssembly.Memory, wasmModuleBuffer: Uint8Array) {
    const freed_mem = new MemoryManager();
    const intArray = new Int32Array(memory.buffer);
    // const nullError = new WebAssembly.Tag({ parameters: ["i32"] });

    let sum = 0;
    let head = {
        next: null,
        index: 0,
        size: 0
    };

    const totalMemory = memory.buffer.byteLength;

    let used = 0;

    let toDealloc: DeallocQueue = head;


    function deallocate(queue: DeallocQueue, freed_mem: MemoryManager) {
        let head = queue as DeallocQueue | null;
        
        while(head !== null && head.next !== null && (used / totalMemory) > 0.9) {
            used -= head.size;
            freed_mem.add(head.size, head.index);
            head = head.next;
        }
    
    }

    const startDealloc = function() {
        deallocate(head, freed_mem);
        head = {
            next: null,
            index: 0,
            size: 0
        };

        toDealloc = head;
    };

    setInterval(() => {
        
    }, 100);

    let b;
    const wasmModule = (await WebAssembly.instantiate(wasmModuleBuffer, b = {
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

            allocate_memory(requestedSize: number, second: boolean = false) {
                if(used / totalMemory > 0.9) {
                    // console.log(`Usage: ${(used / totalMemory) * 100}`);
                    startDealloc();
                    // console.log(`Usage: ${(used / totalMemory) * 100}`);
                }
                
                used += requestedSize;
                // TODO make sure that we don't give an insane amount of memory
                // if only a few bytes are needed. Also, make sure that the remainder
                // of the memory goes back into the freed pool
                // let start = performance.now();

                const foundOffset = freed_mem.getOffset(requestedSize);
                
                if (foundOffset === undefined) {
                    let tmpOffset = freed_mem.globalOffset;

                    if((freed_mem.globalOffset + requestedSize) >= totalMemory) {
                        if(!second) {
                            console.log("Trying to deallocate and allocate");
                            startDealloc();
                            return b.env.allocate_memory(requestedSize, true)
                        } else{
                            throw new Error("Out of memory");
                        }
                    }

                    freed_mem.increaseGlobalOffset(requestedSize);

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

                toDealloc.index = index;
                toDealloc.size = size;

                toDealloc.next = {
                    next: null,
                    index: 0,
                    size: 0
                };

                toDealloc = toDealloc.next;

                // console.log(head);
                // toDealloc.push(size, index);
                // freed_mem.add(size, index);
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