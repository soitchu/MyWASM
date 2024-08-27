import * as Runtime from "../../Runtime/index.ts";
import * as Compiler from "../../Compiler/index.ts";
import path from "path";
import { expect, test } from "bun:test";

async function runMyWASMFile(entryFile: string) {
  const wasmBuffer = (await Compiler.init(
    path.join(__dirname, entryFile),
    "",
    {
      fastMath: false,
      O: 0,
      S: 0,
      returnBuffer: true,
      unsafeArray: false,
      wat: false
    }
  )) as Uint8Array;

  return await Runtime.init("", false, wasmBuffer, 100, true, true) as string;
}

test("import_system_1", async () => {
  const output = await runMyWASMFile("Import/main.mypl");

  expect(output).toBe("10\n20.0000000000");
});

test("import_system_2", async () => {
  const output = await runMyWASMFile("Import/main2.mypl");

  expect(output).toBe("20\n3.0000000000");
});

test("exec-1-hello.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-1-hello.mypl");

  expect(output).toBe("Hello World!\n");
});

test("exec-2-expr.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-2-expr.mypl");

  expect(output).toBe(`Integer Tests: \n  Should be '5': 5
  Should be '9': 9
  Should be '6': 6
  Should be '6': 6
  Should be '1': 1
  Should be '2': 2
  Should be '-1': -1
  Should be true 3 < 4: true
  Should be true 3 <= 4: true
  Should be true 4 > 3: true
  Should be true 4 >= 3: true
  Should be true 4 == 4: true
  Should be true 4 != 3: true
  Should be true not 4 != 4: true
Double Tests: 
  Should be '5.5': 5.5000000000
  Should be '9.25': 9.2500000000
  Should be '6.75': 6.7500000000
  Should be '9.375': 9.3750000000
  Should be '1.75': 1.7500000000
  Should be '2.08': 2.0800000000
  Should be '-3.4': -3.3999999999
  Should be true 3.1 < 4.2: true
  Should be true 3.1 <= 4.2: true
  Should be true 4.2 > 3.1: true
  Should be true 4.2 >= 3.1: true
  Should be true 4.2 == 4.2: true
  Should be true 4.2 != 3.1: true
Bool Tests: 
  Should be true (not false): true
  Should be true (true and true): true
  Should be true (not false and true): true
  Should be true ((not false) and true): true
  Should be true (not (true and false)): true
  Should be true (true or false): true
  Should be true (false or true): true
  Should be true (false or (not false)): true
  Should be true (not false or false): true\n`);
});

test("exec-2-expr.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-2-expr.mypl");

  expect(output).toBe(`Integer Tests: \n  Should be '5': 5
  Should be '9': 9
  Should be '6': 6
  Should be '6': 6
  Should be '1': 1
  Should be '2': 2
  Should be '-1': -1
  Should be true 3 < 4: true
  Should be true 3 <= 4: true
  Should be true 4 > 3: true
  Should be true 4 >= 3: true
  Should be true 4 == 4: true
  Should be true 4 != 3: true
  Should be true not 4 != 4: true
Double Tests: 
  Should be '5.5': 5.5000000000
  Should be '9.25': 9.2500000000
  Should be '6.75': 6.7500000000
  Should be '9.375': 9.3750000000
  Should be '1.75': 1.7500000000
  Should be '2.08': 2.0800000000
  Should be '-3.4': -3.3999999999
  Should be true 3.1 < 4.2: true
  Should be true 3.1 <= 4.2: true
  Should be true 4.2 > 3.1: true
  Should be true 4.2 >= 3.1: true
  Should be true 4.2 == 4.2: true
  Should be true 4.2 != 3.1: true
Bool Tests: 
  Should be true (not false): true
  Should be true (true and true): true
  Should be true (not false and true): true
  Should be true ((not false) and true): true
  Should be true (not (true and false)): true
  Should be true (true or false): true
  Should be true (false or true): true
  Should be true (false or (not false)): true
  Should be true (not false or false): true\n`);
});

test("exec-3-basic-functions.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-3-basic-functions.mypl");

  expect(output).toBe("... in f1\nShould be 7: 7\n... in f2, x = ab\n... in f3, after f2, x = ab\nShould be abab: abab\n");
});

test("exec-4-built-ins.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-4-built-ins.mypl");

  expect(output).toBe("Normal String\nShould be '24': 24\nShould be '3.5': 3.5000000000\nShould be '7': 7\n");
});

test("exec-5-while.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-5-while.mypl");

  expect(output).toBe("1, 1, 1\n1, 1, 2\n1, 1, 3\n1, 2, 1\n1, 2, 2\n1, 2, 3\n1, 3, 1\n1, 3, 2\n1, 3, 3\n2, 1, 1\n2, 1, 2\n2, 1, 3\n2, 2, 1\n2, 2, 2\n2, 2, 3\n2, 3, 1\n2, 3, 2\n2, 3, 3\n3, 1, 1\n3, 1, 2\n3, 1, 3\n3, 2, 1\n3, 2, 2\n3, 2, 3\n3, 3, 1\n3, 3, 2\n3, 3, 3\n");
});

test("exec-6-nested-if.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-6-nested-if.mypl");

  expect(output).toBe("test 1: pass\ntest 2: pass\ntest 3: pass\n");
});

test("exec-8-fac.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-8-fac.mypl");

  expect(output).toBe("the factorial of 12 is 479001600\n");
});

test("exec-9-fib.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-9-fib.mypl");

  expect(output).toBe("fib(0) = 0\nfib(1) = 1\nfib(2) = 1\nfib(3) = 2\nfib(4) = 3\nfib(5) = 5\nfib(6) = 8\nfib(7) = 13\nfib(8) = 21\nfib(9) = 34\nfib(10) = 55\nfib(11) = 89\nfib(12) = 144\nfib(13) = 233\nfib(14) = 377\nfib(15) = 610\nfib(16) = 987\nfib(17) = 1597\nfib(18) = 2584\nfib(19) = 4181\nfib(20) = 6765\nfib(21) = 10946\nfib(22) = 17711\nfib(23) = 28657\nfib(24) = 46368\nfib(25) = 75025\n");
});

test("exec-10-cond.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-10-cond.mypl");

  expect(output).toBe("Should be 0: 0\nShould print else case: else case\nShould print elseif case: elseif case\nShould print else case: else case\nShould print oops: oops\nshould be 1 2 ... 6: 1 2 3 4 5 6 \nshould be 5 4 ... 0: 5 4 3 2 1 0 \n");
});

test("exec-12-simple-struct.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-12-simple-struct.mypl");

  expect(output).toBe("t1.x should be 0: 0\nt1.y should be 1: 1\nt1.x should now be 5: 5\nt1.y should now be 6: 6\nt1.x should now be 7: 7\nt1.y should now be 8: 8\n");
});


test("exec-13-more-structs.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-13-more-structs.mypl");

  expect(output).toBe("Should be 0: 0\nShould be 1: 1\nShould be 5: 5\nShould be 3: 3\n");
});

test("exec-14-arrays.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-14-arrays.mypl");

  expect(output).toBe("should be [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\nshould be [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]\nshould be [9, 10, 7, 8, 5, 6, 3, 4, 1, 2]: [9, 10, 7, 8, 5, 6, 3, 4, 1, 2]\nshould be [9, 10, 7, 8, 5, 6, 3, 4, 1, 2]: [9, 10, 7, 8, 5, 6, 3, 4, 1, 2]\n");
});

test("exec-15-arrays-structs.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-15-arrays-structs.mypl");

  expect(output).toBe("should be 20: 20\nshould be 10: 10\nshould be 30: 30\nshould be 5: 5\nshould be 15: 15\n");
});

test("exec-16-linked-list.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-16-linked-list.mypl");

  expect(output).toBe("[10, 20, 30, 40, 50]\n");
});

test("exec-17-tree.mypl", async () => {
  const output = await runMyWASMFile("hw-6/exec-17-tree.mypl");

  expect(output).toBe("Tree Values: 1 2 5 7 10 12 13 14 15 \nTree Height: 5\n");
});













