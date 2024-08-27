import fs from "fs";
const EMCC_WASM_FILE = fs.readFileSync("./a.out.wasm");

const memory = new WebAssembly.Memory({
  initial: 24000,
  maximum: 24000,
});

(async function () {
  const module = await WebAssembly.instantiate(EMCC_WASM_FILE, {
    env: {
      memory,
    },
  });

  const start = performance.now();
  module.instance.exports.sort();
  console.log(performance.now() - start);

  const offset = Number(module.instance.exports.getOffset());

  let array = new Uint32Array(
    memory.buffer,
    Number(offset)
  );
  
  console.log(array);
})();
