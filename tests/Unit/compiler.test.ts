import { ini, parseString, testWasmExports } from "../../Runtime/WASM";
import * as Compiler from "../../Compiler/index.ts";
import { expect, test } from "bun:test";

const TRUE = 1,
  FALSE = 0;
  
async function runMyWASMCode(code: string) {
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

  const exports = (await ini(memory, wasmModuleBuffer, true)).wasmModule!.instance
    .exports as testWasmExports;

  return [(exports.test as Function)(), memory];
}

test("itod_and_sum", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function double test() {
        int a = 10;
        double b = itod(a);
        b = b + 0.1;

        return b;
    }
  `);
  
  expect(result).toBe(10.1);
});

test("dtoi", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      double a = 10.1;
      int b = dtoi(a);

      return b;
    }
  `);

  expect(result).toBe(10);
});

test("sum", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      int a = 10 + 20;
      return a;
    }
  `);

  expect(result).toBe(30);
});

test("chained_expression", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      int a = 30 - 20 - 10;
      return a;
    }
  `);

  expect(result).toBe(20);
});

test("expr_with_parens_1", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      int a = (10 + 20) * 3;
      return a;
    }
  `);

  expect(result).toBe(90);
});

test("expr_with_parens_2", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      int a = 2 * (10 + 20);
      return a;
    }
  `);

  expect(result).toBe(60);
});

test("expr_with_parens_and_var", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      int b = 10;
      int a = (30 + 20) * (30 + b);
      return a;
    }
  `);

  expect(result).toBe(2000);
});

test("expr_with_only_vars", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      int a = 200;
      int b = 4;
      int c = 7;
      int d = 9;

      int result = (a - b) / (d - c);

      return result;
    }
  `);

  expect(result).toBe(98);
});

test("chained_expr_with_parens", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      int a = 7 * (10 - 20) + 30 - (20 + 3) - (3 + (4 - 3));
      return a;
    }
  `);

  expect(result).toBe(7);
});

test("bool_expr_1", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function bool test() {
      bool a = (1 == 2) or 2 == 2;
      return a;
    }
  `);

  expect(result).toBe(TRUE);
});

test("bool_expr_2", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function bool test() {
      bool a = (1 == 2) or 2 == 3;
      return a;
    }
  `);

  expect(result).toBe(FALSE);
});

test("bool_expr_3", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function bool test() {
      bool a = (1 == 1) and 2 == 2;
      return a;
    }
  `);

  expect(result).toBe(TRUE);
});

test("simple_if_>", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      int a = 10;

      if(a > 10) {
          return 10;
      } else {
          return 20;
      }
    }
  `);

  expect(result).toBe(20);
});

test("simple_if_>=", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      int a = 10;

      if(a <= 10) {
          return 10;
      } else {
          return 20;
      }
    }
  `);

  expect(result).toBe(10);
});

test("simple_elseif", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      int a = 10;
      int b = 20;
      int c = 30;

      if((a <= 10) and false) {
          return 10;
      }
      elseif(a == 10){
        if((b == 20) and (c == 30)) {
            return 100;
        } else{
            return 30;
        }
      } else {
          return 20;
      }
    }
  `);

  expect(result).toBe(100);
});

test("struct_access", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Point {
        int x;
        int y;
    }

    export function int test() {
        Point a = new Point(10, 20);

        return a.x;
    }
  `);

  expect(result).toBe(10);
});

test("struct_ini_with_vars", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Point {
        int x;
        int y;
    }

    export function int test() {
        int x = 50;
        int y = 60;
        Point a = new Point(x, y);

        return a.x;
    }
  `);

  expect(result).toBe(50);
});

test("struct_ini_with_expr", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Point {
        int x;
        int y;
    }

    export function int test() {
        int x = 50;
        int y = 60;
        Point a = new Point((x + y) * (y - x), y);

        return a.x;
    }
  `);

  expect(result).toBe(1100);
});

test("struct_assginment", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Point {
        int x;
        int y;
    }

    export function int test() {
        int x = 50;
        int y = 60;
        Point a = new Point(x + y + x, y);
        
        a.x = a.x * 20;
        return a.x;
    }
  `);

  expect(result).toBe(3200);
});

test("struct_arrays_and_loop", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Point {
        int x;
        int y;
    }

    export function int test() {
        int x = 20;
        int y = 20;
        Point a = new Point(x, y);
        array int arr = new int[a.x];
        int result = 0;

        arr[0] = 1;
        arr[1] = 1;

        for(int i = 2; i < a.x; i = i + 1) {
            arr[i] =  arr[i - 1] + arr[i - 2];
        }

        return arr[a.x - 1];
    }
  `);

  expect(result).toBe(6765);
});

test("chained_struct_assignment_1", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Node {
        int value;
        Node next;
    }

    export function bool test() {
        Node first = new Node(0, null);
        Node second = new Node(1, null);
        Node third = new Node(2, null);

        first.next = second;
        second.next = third;
        third.next = third;

        return first == first;
    }
  `);

  expect(result).toBe(TRUE);
});

test("chained_struct_assignment_2", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Node {
        int value;
        Node next;
    }

    export function bool test() {
        Node first = new Node(0, null);
        Node second = new Node(1, null);
        Node third = new Node(2, null);

        first.next = second;
        second.next = third;
        third.next = third;

        return first == first.next;
    }
  `);

  expect(result).toBe(FALSE);
});

test("chained_struct_assignment_3", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Node {
        int value;
        Node next;
    }

    export function bool test() {
        Node first = new Node(0, null);
        Node second = new Node(1, null);
        Node third = new Node(2, null);

        first.next = second;
        second.next = third;
        third.next = third;

        return third == first.next.next;
    }
  `);

  expect(result).toBe(TRUE);
});

test("chained_struct_assignment_and_access", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Node {
      int value;
      Node next;
      Map map;
    }

    struct Map {
        int x;
        array int values;
    }

    export function int test() {
        Map a = new Map(0, null);
        array int vals = new int[20];
        a.values = vals;

        a.values[0] = 1;
        a.values[1] = 1;

        for(int i = 2; i < 20; i = i + 1) {
            a.values[i] =  a.values[i - 1] + a.values[i - 2];
        }

        Node first = new Node(0, null, null);
        Node second = new Node(1, null, null);
        Node third = new Node(2, null, null);

        first.next = second;
        second.next = third;
        third.next = third;
        third.map = a;


        return first.next.next.next.next.next.map.values[19];
    }
  `);

  expect(result).toBe(6765);
});

test("arrays_in_structs", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Map {
        int x;
        array int values;
    }

    export function int test() {
        Map a = new Map(0, null);
        array int vals = new int[20];
        a.values = vals;

        a.values[0] = 1;
        a.values[1] = 1;

        for(int i = 2; i < 20; i = i + 1) {
            a.values[i] =  a.values[i - 1] + a.values[i - 2];
        }

        return a.values[19];

    }
  `);

  expect(result).toBe(6765);
});

test("struct_assignment_to_array", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Node {
        int a;
        int b;
        int c;
        int d;
    }

    struct Map {
        int x;
        array int values;
    }

    export function int test() {
        array Node a = new Node[10];
        a[0] = new Node(10, 13, 16, 20);
        a[1] = new Node(30, 33, 36, 40);
        a[2] = new Node(50, 53, 56, 60);

        return a[1].c;
    }
  `);

  expect(result).toBe(36);
});

test("double_arrays_1", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Node {
        int value;
        Node next;
        Map map;
    }

    struct Map {
        int x;
        array double values;
    }

    export function double test() {
        Map a = new Map(0, null);
        array double vals = new double[20];
        a.values = vals;

        a.values[0] = 1.2;
        a.values[1] = 1.3;

        for(int i = 2; i < 20; i = i + 1) {
            a.values[i] =  a.values[i - 1] + a.values[i - 2];
        }

        Node first = new Node(0, null, null);
        Node second = new Node(1, null, null);
        Node third = new Node(2, null, null);

        first.next = second;
        second.next = third;
        third.next = third;
        third.map = a;


        return first.next.next.next.next.next.map.values[19];
    }
  `);

  expect(result).toBe(8536.1);
});

test("double_arrays_2", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function double test() {
        array double a = new double[10];
        array double b = new double[10];
        a[0] = 10.12345678912345678912345678;

        for(int i = 1; i < 10; i = i + 1) {
            a[i] = a[i - 1] + 0.1;
        }

        return a[9];
    }
  `);

  expect(result).toBe(11.023456789123454);
});

test("double_in_structs_1", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Point {
        int a;
        double b;
        double c;
        int d;
        double e;
        int f;
      }
      
      export function double test() {
        Point a = new Point(10, 20.1, 30.2, 40, 50.3, 60);
      
        return a.b;
      }
  `);

  expect(result).toBe(20.1);
});

test("double_in_structs_2", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Point {
        int a;
        double b;
        double c;
        int d;
        double e;
        int f;
      }
      
      export function bool test() {
        Point a = new Point(10, 20.1, 30.2, 40, 50.3, 60);
        
        return ((a.a == 10) and (a.b == 20.1) and (a.c == 30.2) and (a.d == 40) and (a.e == 50.3) and (a.f == 60));
      }
  `);

  expect(result).toBe(TRUE);
});

test("double_in_structs_3", async () => {
  const [result, memory] = await runMyWASMCode(`
    struct Point {
        int a;
        double b;
        double c;
        int d;
        int e;
      }
      
      export function void test() {
        Point a = new Point(10, 20.1, 30.2, 40, 60);
      }
  `);

  expect(new Int32Array(memory.buffer, 12)[0]).toBe(10);
  expect(new Float64Array(memory.buffer, 16)[0]).toBe(20.1);
  expect(new Float64Array(memory.buffer, 24)[0]).toBe(30.2);
  expect(new Int32Array(memory.buffer, 32)[0]).toBe(40);
  expect(new Int32Array(memory.buffer, 36)[0]).toBe(60);
});

test("check_memory_of_arrays", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function void test() {
      array int a = new int[10];
      array int b = new int[11];
      array double c = new double[12];
      array int d = new int[13];
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(10);
  expect(intArray[1 + 10]).toBe(11);
  expect(intArray[1 + 10 + 1 + 11]).toBe(12);
  expect(intArray[1 + 10 + 1 + 11 + 1 + 12 * 2]).toBe(13);
});

test("recursion", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int fib(int a) {
      if((a == 0) or (a == 1)) {
        return a;
      }
    
      return fib(a - 1) + fib(a - 2);
    }

    export function int test() {
      return fib(15);
    }
  `);

  expect(result).toBe(610);
});

test("selection_sort", async () => {
  const [result, memory] = await runMyWASMCode(`
    int ARRAY_LENGTH = 10;

    export function void sort(array int arr, int n) 
    { 
        int min_idx; 
    
        for (int i = 0; i < (n - 1); i = i + 1) { 
    
            min_idx = i; 

            for (int j = i + 1; j < n; j = j + 1) { 
                if (arr[j] < arr[min_idx]) {
                    min_idx = j; 
                }
            } 
    
            if (min_idx != i) {
                int tmp = arr[i];
                arr[i] = arr[min_idx];
                arr[min_idx] = tmp;
            }
        } 
    } 

    export function void test() {
        array int arr = new int[ARRAY_LENGTH];

        for(int i = 0; i < ARRAY_LENGTH; i = i + 1) {
            arr[ARRAY_LENGTH - (i + 1)] = i + 1;
        }

        sort(arr, ARRAY_LENGTH);
    }
  `);

  const intArray = new Int32Array(memory.buffer, 12);
  for (let i = 0; i < 10; i++) {
    expect(intArray[i]).toBe(i + 1);
  }
});

test("string_concat_1", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function int test() {
      array int a = new int[10];
      string s1 = "hello";
      string s2 = " world" + s1 + s1;

      return length(s2);
    }
  `);

  expect(result).toBe(6 + 5 + 5);
});

test("string_concat_2", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
      array double a = new double[40];
      string s1 = "hel";
      string s2 = "lo";
      array double b = new double[40];
      string s3 = s1 + s2 + " world";

      return s3;
    }
  `);

  const stringPosition = Math.floor(result / 4);
  expect(parseString(stringPosition, memory)).toBe("hello world");
});

test("string_concat_3", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
        string a = "h" + "e" + "l" + "l" + "o" + " w" + "o" + "r" + "l" + "d";
        string b = "hello world";

        return b;
    }
  `);

  expect(result).toBe(120);
});

test("string_concat_4", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
        string a = "h" + "e" + "l" + "l" + "o" + " w" + "o" + "r" + "l" + "d";
        string b = "hello world";

        return a;
    }
  `);

  expect(result).toBe(180);
});

test("string_concat_5", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
        string a = "h" + "e" + "l" + "l" + "o" + " w" + "o" + "r" + "l" + "d";
        string c = "ed";
        string b = "ed" + "hello world" + "_" + "w" + a;
      
        return b;
    }
  `);

  const resultantString = parseString(result / 4, memory);

  expect(resultantString).toBe("edhello world_whello world");
});

test("string_reassignment", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
      string s1 = "hello world";
      string s2 = s1;

      return s1;
    }
  `);

  expect(parseString(result / 4, memory)).toBe("hello world");
  expect(parseString(result / 4 + "hello world".length + 1, memory)).toBe(
    "hello world"
  );
});

test("middle_memory_deletion", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {

      // Testing deleting the memory in middle of allocated memories
      array int a = new int[5];
      array int b = new int[5];
      array int c = new int[5];
    
      delete b;
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(5);
  expect(intArray[6]).toBe(0);
  expect(intArray[12]).toBe(5);
});

test("middle_deletion_and_allocation", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {

      // Testing deleting and allocating the memory 
      // in middle of allocated memories
      
      array int a = new int[5];
      array int b = new int[5];
      array int c = new int[5];

      delete b;

      b = new int[5];
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(5);
  expect(intArray[6]).toBe(5);
  expect(intArray[12]).toBe(5);
});

test("end_memory_deletion", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {

      // Testing deleting the memory right next to the global offset
      array int a = new int[5];
      array int b = new int[5];
      array int c = new int[5];

      delete c;
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(5);
  expect(intArray[6]).toBe(5);
  expect(intArray[12]).toBe(0);
});

test("end_memory_deletion_and_allocation", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
        // Testing deleting the memory right next to the global offset
        array int a = new int[5];
        array int b = new int[5];
        array int c = new int[5];

        delete c;

        c = new int[5];
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(5);
  expect(intArray[6]).toBe(5);
  expect(intArray[12]).toBe(5);
});

test("deleting_contiguous_memory_sequentially", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
        // Testing deleting the memory right next to the global offset
        array int a = new int[5];
        array int b = new int[5];
        array int c = new int[5];

        delete a;
        delete b;
        delete c;
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(0);
  expect(intArray[6]).toBe(0);
  expect(intArray[12]).toBe(0);
});

test("deleting_contiguous_memory_sequentially_and_reallocating", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
        // Testing deleting the memory right next to the global offset
        array int a = new int[5];
        array int b = new int[5];
        array int c = new int[5];

        a = new int[5];
        b = new int[5];
        c = new int[5];
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(5);
  expect(intArray[6]).toBe(5);
  expect(intArray[12]).toBe(5);
});

test("deleting_contiguous_memory_non_seq", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
        // Testing that freed memory is "pooled" together
        array int a = new int[5];
        array int b = new int[5];
        array int c = new int[5];

        delete c;
        delete a;
        delete b;
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(0);
  expect(intArray[6]).toBe(0);
  expect(intArray[12]).toBe(0);
});

test("deleting_contiguous_memory_non_seq_and_reallocating", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {

      // Testing that freed memory is "pooled" together
      array int a = new int[5];
      array int b = new int[5];
      array int c = new int[5];

      delete c;
      delete a;
      delete b;

      a = new int[5];
      b = new int[5];
      c = new int[5];
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(5);
  expect(intArray[6]).toBe(5);
  expect(intArray[12]).toBe(5);
});

test("deleting_contiguous_memory_non_seq_not_next_to_globa_offset", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
        // Testing deleting the memory in the middle
        // testing that freed memory is "pooled" together
        
        array int a = new int[5];
        array int b = new int[5];
        array int c = new int[5];
        array int d = new int[5];       // this makes sure that c isn't next to
                                        // global offset

        delete c;
        delete a;
        delete b;
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(0);
  expect(intArray[6]).toBe(0);
  expect(intArray[12]).toBe(0);
  expect(intArray[18]).toBe(5);
});

test("deleting_contiguous_memory_non_seq_not_next_to_globa_offset_and_realloc", async () => {
  const [result, memory] = await runMyWASMCode(`
    export function string test() {
        // Testing deleting the memory in the middle
        // testing that freed memory is "pooled" together
        
        array int a = new int[5];
        array int b = new int[5];
        array int c = new int[5];
        array int d = new int[5];       // this makes sure that c isn't next to
                                        // global offset

        delete c;
        delete a;
        delete b;

        a = new int[5];
        b = new int[5];
        c = new int[5];
    }
  `);

  const intArray = new Int32Array(memory.buffer, 8);
  expect(intArray[0]).toBe(5);
  expect(intArray[6]).toBe(5);
  expect(intArray[12]).toBe(5);
  expect(intArray[18]).toBe(5);
});
