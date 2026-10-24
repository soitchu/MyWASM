import { ini, testWasmExports } from "../../Runtime/WASM";
import * as Compiler from "../../Compiler/index.ts";
import { expect, test } from "bun:test";

const TRUE = 1,
  FALSE = 0;

async function runMyWASMCode(code: string): Promise<[number, string]> {
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

  const runtime = await ini(memory, wasmModuleBuffer, true, true);
  const exports = runtime.wasmModule!.instance.exports as testWasmExports;
  const result = (exports.test as Function)();

  return [result, runtime.output];
}

// Operators of the same precedence group left to right

test("left_assoc_subtraction", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return 30 - 20 - 10;
    }
  `);

  expect(result).toBe(0);
});

test("left_assoc_division", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return 100 / 10 / 5;
    }
  `);

  expect(result).toBe(2);
});

test("left_assoc_mod", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return 17 % 10 % 4;
    }
  `);

  expect(result).toBe(3);
});

test("left_assoc_plus_minus", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return 10 - 3 + 2;
    }
  `);

  expect(result).toBe(9);
});

test("left_assoc_times_divide", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return 100 / 10 * 2;
    }
  `);

  expect(result).toBe(20);
});

test("left_assoc_doubles", async () => {
  const [result] = await runMyWASMCode(`
    export function double test() {
      return 10.0 - 2.5 - 2.5;
    }
  `);

  expect(result).toBe(5.0);
});

test("left_assoc_vars", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      int a = 50;
      int b = 20;
      int c = 5;
      return a - b - c;
    }
  `);

  expect(result).toBe(25);
});

test("left_assoc_long_chain", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return 1 - 2 - 3 - 4 - 5;
    }
  `);

  expect(result).toBe(-13);
});

// Precedence

test("precedence_times_after_plus", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return 2 + 3 * 4;
    }
  `);

  expect(result).toBe(14);
});

test("precedence_times_before_plus", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return 2 * 3 + 4;
    }
  `);

  expect(result).toBe(10);
});

test("precedence_minus_and_times", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return 20 - 2 * 3 - 4;
    }
  `);

  expect(result).toBe(10);
});

test("precedence_mod_and_plus", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return 1 + 10 % 4 * 3;
    }
  `);

  expect(result).toBe(7);
});

test("precedence_parens_override", async () => {
  const [result] = await runMyWASMCode(`
    export function int test() {
      return (2 + 3) * 4;
    }
  `);

  expect(result).toBe(20);
});

test("precedence_arithmetic_before_equality", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      return 1 + 2 == 3;
    }
  `);

  expect(result).toBe(TRUE);
});

test("precedence_arithmetic_before_comparison", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      return 10 - 5 > 3 + 1;
    }
  `);

  expect(result).toBe(TRUE);
});

test("precedence_comparison_before_and", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      return 1 < 2 and 3 < 4;
    }
  `);

  expect(result).toBe(TRUE);
});

test("precedence_equality_before_or", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      return 1 == 2 or 2 == 2;
    }
  `);

  expect(result).toBe(TRUE);
});

test("precedence_and_before_or", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      return false and false or true;
    }
  `);

  expect(result).toBe(TRUE);
});

test("precedence_or_after_and", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      return true or false and false;
    }
  `);

  expect(result).toBe(TRUE);
});

test("precedence_mixed_bool_and_arithmetic", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      int x = 7;
      return x % 2 == 1 and x * 2 > 10 or x == 0;
    }
  `);

  expect(result).toBe(TRUE);
});

test("precedence_double_comparison", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      return 1.5 * 2.0 - 1.0 >= 2.0;
    }
  `);

  expect(result).toBe(TRUE);
});

// not keeps applying to the rest of the expression

test("not_applies_to_comparison", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      return not 1 == 2;
    }
  `);

  expect(result).toBe(TRUE);
});

test("not_applies_to_and", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      return not true and false;
    }
  `);

  expect(result).toBe(TRUE);
});

test("not_in_parens", async () => {
  const [result] = await runMyWASMCode(`
    export function bool test() {
      return (not true) or 1 + 1 == 2;
    }
  `);

  expect(result).toBe(TRUE);
});

// Operands are evaluated left to right

test("operand_evaluation_order", async () => {
  const [result, output] = await runMyWASMCode(`
    function int f(int x) {
      print(x);
      return x;
    }

    export function int test() {
      return f(1) - f(2) - f(3) * f(4);
    }
  `);

  expect(output).toBe("1234");
  expect(result).toBe(-13);
});
