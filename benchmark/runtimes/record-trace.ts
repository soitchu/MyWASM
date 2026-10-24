// Runs a program with the TS runtime and records every allocate_memory and
// deallocate_memory call, for replaying through both memory managers.
//
// Usage: bun record-trace.ts <file.wasm> <memory pages> <trace output>
// The program's stdin is this script's stdin.

import { writeFileSync } from "node:fs";
import { MemoryManager } from "../../Runtime/MemoryManager";
import * as Runtime from "../../Runtime/index.ts";

const [wasm, pages, output] = process.argv.slice(2);

// The calls are recorded from MemoryManager.ts, so the runtime must use it
process.env.MYWASM_MEMORY_MANAGER = "ts";
const ops: string[] = [];
let started = false;
let inGetOffset = false;

const getOffset = MemoryManager.prototype.getOffset;
const add = MemoryManager.prototype.add;

function start(manager: MemoryManager) {
  if (!started) {
    started = true;
    ops.push(`g ${manager.globalOffset}`);
  }
}

MemoryManager.prototype.getOffset = function (size: number) {
  start(this);
  ops.push(`a ${size}`);
  inGetOffset = true;

  try {
    return getOffset.call(this, size);
  } finally {
    inGetOffset = false;
  }
};

// getOffset calls add for the rest of a block it splits, which isn't a call
// from the program
MemoryManager.prototype.add = function (size: number, offset: number) {
  if (!inGetOffset) {
    start(this);
    ops.push(`f ${offset} ${size}`);
  }

  return add.call(this, size, offset);
};

// Captures the program's output so it doesn't mix with the trace
await Runtime.init(wasm, false, undefined as unknown as Uint8Array, Number(pages), false, true);
writeFileSync(output, ops.join("\n") + "\n");
