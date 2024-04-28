import { ASTParser } from "../../Compiler/AST.ts";
import { Lexer } from "../../Compiler/Lexer.ts";
import { SemanticChecker } from "../../Compiler/SemanticChecker.ts";
import { StringBuffer } from "../../Compiler/StringBuffer.ts";
import { SymbolTable } from "../../Compiler/SymbolTable.ts";
import { expect, test } from "bun:test";

function len(x: any) {
  return x.length;
}

// #----------------------------------------------------------------------
// # SYMBOL TABLE TESTS
// #----------------------------------------------------------------------

test("test_empty_table", () => {
  let table = new SymbolTable();
  expect(len(table)).toBe(0);
});

test("test_push_pop", () => {
  let table = new SymbolTable();
  expect(len(table) ).toBe(0);
  table.push_environment();
  expect(len(table) ).toBe(1);
  table.pop_environment();
  expect(len(table) ).toBe(0);
  table.push_environment();
  table.push_environment();
  expect(len(table) ).toBe(2);
  table.pop_environment();
  expect(len(table) ).toBe(1);
  table.pop_environment();
  expect(len(table) ).toBe(0);
});

test("test_simple_add", () => {
  let table = new SymbolTable();
  // @ts-expect-error
  table.add("x", "int");
  expect(!table.exists("x"));
  table.push_environment();
  // @ts-expect-error
  table.add("x", "int");
  // @ts-expect-error
  expect(table.exists("x") && table.get("x")).toBe("int");
  table.pop_environment();
});
test("test_multiple_add", () => {
  const table = new SymbolTable();
  table.push_environment();
  // @ts-expect-error
  table.add("x", "int");
  // @ts-expect-error
  table.add("y", "double");
  // @ts-expect-error
  expect(table.exists("x") && table.get("x") == "int").toBe(true);
  // @ts-expect-error
  expect(table.exists("y") && table.get("y") == "double").toBe(true);
});

test("test_multiple_environments", () => {
  const table = new SymbolTable();
  table.push_environment();
  // @ts-expect-error
  table.add("x", "int");
  // @ts-expect-error
  table.add("y", "double");
  table.push_environment();
  // @ts-expect-error
  table.add("x", "string");
  // @ts-expect-error
  table.add("z", "bool");
  table.push_environment();
  // @ts-expect-error
  table.add("u", "Node");
  // @ts-expect-error
  expect(table.exists("x") && table.get("x") == "string").toBe(true);
  // @ts-expect-error
  expect(table.exists("y") && table.get("y") == "double").toBe(true);
  // @ts-expect-error
  expect(table.exists("z") && table.get("z") == "bool").toBe(true);
  // @ts-expect-error
  expect(table.exists("u") && table.get("u") == "Node").toBe(true);
  expect(!table.exists_in_curr_env("x"));
  expect(!table.exists_in_curr_env("y"));
  expect(!table.exists_in_curr_env("z"));
  expect(table.exists_in_curr_env("u"));
  table.pop_environment();
  expect(!table.exists("u")).toBe(true);
  // @ts-expect-error
  expect(table.exists_in_curr_env("x") && table.get("x") == "string").toBe(true);
  // @ts-expect-error
  expect(table.exists_in_curr_env("z") && table.get("z") == "bool").toBe(true);
  table.pop_environment();
  expect(!table.exists("z")).toBe(true);
  // @ts-expect-error
  expect(table.exists("x") && table.get("x") == "int").toBe(true);
  // @ts-expect-error
  expect(table.exists("y") && table.get("y") == "double").toBe(true);
  table.pop_environment();
});

// #----------------------------------------------------------------------
// # BASIC FUNCTION DEFINITIONS
// #----------------------------------------------------------------------

test("test_smallest_program", () => {
  const in_stream = "function void main() {}";
  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_valid_function_defs", () => {
  const in_stream = `
        function void f1(int x) {} 
        function void f2(double x) {} 
        function bool f3(bool x) {} 
        function string f4(int p1, bool p2) {} 
        function void f5(double p1, int p2, string p3) {} 
        function int f6(int p1, int p2, string p3) {} 
        function array int f7() {} 
        function void main() {} 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_two_functions_same_name", () => {
  const in_stream = `
        function void f(string msg) {} 
        function int f() {} 
        function void main() {} 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false)
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(2)");
  }
});

test("test_function_with_two_params_same_name", () => {
  const in_stream = `
        function void f(int x, double y, string x) {} 
        function void main() {} 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(27)");
  }
});

test("test_function_with_bad_param_type", () => {
  const in_stream = `
        function void f(int x, array double y, Node z) {} 
        function void main() {} 
    `;
  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(26)");
  }
});

test("test_function_with_bad_array_param_type", () => {
  const in_stream = `
        struct Node{} 
        function void f(int x, array Node x) {} 
        function void main() {} 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(27)");
  }
});

test("test_function_with_bad_return_type", () => {
  const in_stream = `
        function Node f(int x) {} 
        function void main() {} 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(26)");
  }
});

test("test_function_with_bad_array_return_type", () => {
  const in_stream = `
        function array Node f(int x) {} 
        function void main() {} 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(26)");
  }
});

// #------------------------------------------------------------
// # BASIC STRUCT DEFINITION CASES
// #------------------------------------------------------------
test("test_valid_structs", () => {
  const in_stream = `
        struct S1 {int x; int y;} 
        struct S2 {bool x; string y; double z;} 
        struct S3 {S1 s1;} 
        struct S4 {array int xs;} 
        struct S5 {array S4 s4s;} 
        function void main() {} 
    `;
  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_struct_self_ref", () => {
  const in_stream = `
        struct Node {int val; Node next;} 
        struct BigNode {array int val; array Node children;} 
        function void main() {} 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_struct_mutual_ref", () => {
  const in_stream = `
        struct S1 {int x; S2 y;} 
        struct S2 {int u; S1 v;} 
        function void main() {} 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_struct_and_function_same_name", () => {
  const in_stream = `
        struct s {} 
        function void s() {} 
        function void main() {} 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_function_with_struct_param", () => {
  const in_stream = `
        function void f(int x, S y, array S z) {} 
        struct S {} 
        function void main() {} 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_two_structs_same_name", () => {
  const in_stream = `
        struct S {int x;} 
        struct S {bool y;} 
        function void main() {} 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(1)");
  }
});

test("test_struct_with_undefined_field_type", () => {
  const in_stream = `
        struct S1 {int x; S2 s;} 
        function void main() {} 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(9)");
  }
});

test("test_struct_with_same_field_names", () => {
  const in_stream = `
        struct S {int x; double y; string x;} 
        function void main() {} 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(8)");
  }
});

// #----------------------------------------------------------------------
// # VARIABLE DECLARATIONS
// #----------------------------------------------------------------------

test("test_good_var_decls", () => {
  const in_stream = `
        function void main() { 
          int x1 = 0; 
          double x2 = 0.0; 
          bool x3 = false; 
          string x4 = "foo"; 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_good_var_decls_with_null", () => {
  const in_stream = `
        function void main() { 
          int x1 = null; 
          double x2 = null; 
          bool x3 = null; 
          string x4 = null; 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_good_var_decls_no_def", () => {
  const in_stream = `
        function void main() { 
          int x1; 
          double x2; 
          bool x3; 
          string x4; 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_local_shadow", () => {
  const in_stream = `
        function void main() { 
          int x1; 
          double x2; 
          bool x1; 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(27)");
  }
});

test("test_mismatched_var_decl_types", () => {
  const in_stream = `
        function void main() { 
          int x1 = 3.14; 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

test("test_mismatched_var_decl_array_types", () => {
  const in_stream = `
        function void main() { 
          array int x1 = 256; 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

// #----------------------------------------------------------------------
// # EXPRESSIONS
// #----------------------------------------------------------------------

test("test_expr_no_parens", () => {
  const in_stream = `
        function void main() { 
          int x1 = 1 + 2 + 3 * 4 / 5 - 6 - 7; 
          double x2 = 1.0 + 2.1 + 3.3 * 4.4 / 5.5 - 6.6 - 7.7; 
          bool x3 = not true or false and true and not false; 
          string x4 = "a" + "b" + "c"; 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_expr_with_parens", () => {
  const in_stream = `
        function void main() { 
          int x1 = ((1 + 2) + (3 * 4)) / ((5 - 6) - 7); 
          double x2 = ((1.0 + 2.1) + (3.3 * 4.4) / (5.5 - 6.6)) - 7.7; 
          bool x3 = not (true or false) and (true and not false); 
          string x4 = (("a" + "b") + "c"); 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_expr_with_parens_and_vars", () => {
  const in_stream = `
        function void main() { 
          int x1 = (1 + 2) + (3 * 4); 
          int x2 = (5 - 6) - 7; 
          int x3 = ((x1 / x2) + x1 - x2) / (x1 + x2);  
          double x4 = (1.0 + 2.1) + (3.3 * 4.4); 
          double x5 = (5.5 - 6.6) - 7.7; 
          double x6 = ((x4 / x5) + x5 - x4) / (x4 + x5); 
          bool x7 = not (true or false); 
          bool x8 = true and not x7; 
          bool x9 = (x7 and x8) or (not x7 and x8) or (x7 and not x8); 
          string x10 = "a" + "b"; 
          string x11 = (x10 + "c") + ("c" + x10); 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_basic_relational_ops", () => {
  const in_stream = `
        function void main() { 
          bool x1 = 0 < 1; 
          bool x2 = 0 <= 1;  
          bool x3 = 0 > 1; 
          bool x4 = 0 >= 1; 
          bool x5 = 0 != 1; 
          bool x6 = 0 == 1; 
          bool x7 = 0 != null; 
          bool x8 = 0 == null; 
          bool x9 = null != null; 
          bool x10 = null == null;
          bool x11 = not 0 < 1; 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_combined_relational_ops", () => {
  const in_stream = `
        function void main() { 
          bool x1 = (0 < 1) and ("a" < "b") and (3.1 < 3.2); 
          bool x2 = (not ("a" == null)) or (not (3.1 != null)); 
          bool x4 = ("abc" <= "abde") or (x1 == false); 
          bool x5 = (not x2 == null) and 3.1 >= 4.1; 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_array_comparisons", () => {
  const in_stream = `
        function void main() { 
          array int x1 = new int[10]; 
          array int x2 = x1; 
          bool x3 = (x2 != null) and ((x1 != x2) or (x1 == x2));  
        } 
    `;
  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_bad_relational_comparison", () => {
  const in_stream = `
        function void main() { 
          bool x1 = (true < false); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(24)");
  }
});

test("test_bad_array_relational_comparison", () => {
  const in_stream = `
        function void main() { 
          array int x1 = new int[10]; 
          array int x2 = x1; 
          bool x1 = x1 <= x2; 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(54)");
  }
});

test("test_bad_logical_negation", () => {
  const in_stream = `
        function void main() { 
          bool x = not (1 + 2); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(25)");
  }
});

// #----------------------------------------------------------------------
// # FUNCTION RETURN TYPES
// #----------------------------------------------------------------------

test("test_function_return_match", () => {
  const in_stream = `
        function int f() {return 42;} 
        function int g() {return null;} 
        function void h() {return null;} 
        function bool i() {return true;} 
        function array double j() {return new double[10];} 
        function void main() {} 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_bad_function_return_type", () => {
  const in_stream = `
        function int f() {return true;} 
        function void main() { } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(11)");
  }
});

test("test_bad_non_null_return", () => {
  const in_stream = `
        function void main() {return 0;} 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(11)");
  }
});

test("test_bad_one_return_bad_type", () => {
  const in_stream = `
        function int f(int x) { 
          if (x < 0) {return 0;} 
          else {return false;} 
        } 
        function void main() {} 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(11)");
  }
});

// #----------------------------------------------------------------------
// # BASIC CONDITIONAL CHECKS
// #----------------------------------------------------------------------

test("test_bad_non_bool_if", () => {
  const in_stream = `
        function void main() { 
          if (1) {} 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(16)");
  }
});

test("test_bad_non_bool_elseif", () => {
  const in_stream = `
        function void main() { 
          if (false) {} elseif ("a") {} 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(16)");
  }
});

test("test_bad_bool_array_if", () => {
  const in_stream = `
        function void main() { 
          array bool flags = new bool[2]; 
          if (flags) {} 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(16)");
  }
});

test("test_bad_bool_array_elseif", () => {
  const in_stream = `
        function void main() { 
          array bool flags = new bool[2]; 
          if (true) {} elseif (flags) {} 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(16)");
  }
});

test("test_bad_bool_while", () => {
  const in_stream = `
        function void main() { 
          while (3 * 2) { } 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(14)");
  }
});

test("test_bad_bool_array_while", () => {
  const in_stream = `
        function void main() { 
          array bool xs = new bool[2]; 
          while (xs) { } 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(14)");
  }
});

test("test_bad_bool_condition_for1", () => {
  const in_stream = `
        function void main() { 
          for (int i; i + 1; i = i + 1) { } 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(15)");
  }
});

test("test_bad_bool_condition_for", () => {
  const in_stream = `
        function void main() { 
          array bool xs = new bool[2]; 
          for (int i; xs; i = i + 1) { } 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(15)");
  }
});

// #----------------------------------------------------------------------
// # BASIC FUNCTION CALLS
// #----------------------------------------------------------------------

test("test_call_to_undeclared_function", () => {
  const in_stream = `
        function void main() { 
          f(); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(17)");
  }
});

test("test_too_few_args_in_function_call", () => {
  const in_stream = `
        function void f(int x) {} 
        function void main() { 
          f(); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_too_many_args_in_function_call", () => {
  const in_stream = `
        function void f(int x) {} 
        function void main() { 
          f(1, 2); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

// #----------------------------------------------------------------------
// # SHADOWING
// #----------------------------------------------------------------------

test("test_allowed_shadowing", () => {
  const in_stream = `
        function void main() { 
          int x = 0; 
          if (true) { 
            double x = 1.0; 
            double y = x * 0.01; 
          } 
          elseif (false) { 
            bool x = true; 
            bool y = x and false; 
          } 
          for (double x = 0.0; x < 10.0; x = x + 1.0) { 
            double y = x / 2.0; 
          } 
          while (true) { 
            string x = ""; 
            string y = x + "a"; 
          }         
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_illegal_shadowing_example", () => {
  const in_stream = `
        function void main() { 
          int x = 0; 
          if (true) { 
            int y = x  + 1; 
          } 
          double x = 1.0; 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(27)");
  }
});

// #----------------------------------------------------------------------
// # BUILT-IN FUNCTIONS
// #----------------------------------------------------------------------

// # print function

test("test_print_exampes", () => {
  const in_stream = `
        function void main() { 
          print(0); 
          print(1.0); 
          print(true); 
          print("abc"); 
          int x = print(0);   
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_print_struct_object", () => {
  const in_stream = `
        struct S {} 
        function void main() { 
          S s = new S(); 
          print(s); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(19)");
  }
});

test("test_print_array_object", () => {
  const in_stream = `
        function void main() { 
          array int xs = new int[10]; 
          print(xs); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(19)");
  }
});

test("test_print_arg_mismatch", () => {
  const in_stream = `
        function void main() { 
          print(0, 1); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

// # input function

test("test_input_example", () => {
  const in_stream = `
        function void main() { 
          string s = input(); 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_input_return_mismatch", () => {
  const in_stream = `
        function void main() { 
          int s = input(); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

test("test_input_too_many_args", () => {
  const in_stream = `
        function void main() { 
          int s = input("Name: "); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

// # casting functions

test("test_cast_examples", () => {
  const in_stream = `
        function void main() { 
          string x1 = itos(5); 
          string x2 = dtos(3.1); 
          int x3 = stoi("5"); 
          int x4 = dtoi(3.1); 
          double x5 = stod("3.1"); 
          double x6 = itod(5); 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

// # itos functions

test("test_itos_too_few_args", () => {
  const in_stream = `
        function void main() { 
          string s = itos(); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_itos_too_many_args", () => {
  const in_stream = `
        function void main() { 
          string s = itos(0, 1); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_itos_bad_arg", () => {
  const in_stream = `
        function void main() { 
          string s = itos(1.0); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(20)");
  }
});

test("test_itos_bad_return", () => {
  const in_stream = `
        function void main() { 
          bool b = itos(1); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

// # dtos function

test("test_dtos_too_few_args", () => {
  const in_stream = `
        function void main() { 
          string s = dtos(); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_dtos_too_many_args", () => {
  const in_stream = `
        function void main() { 
          string s = dtos(0.0, 1.0); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_dtos_bad_arg", () => {
  const in_stream = `
        function void main() { 
          string s = dtos(1); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(20)");
  }
});

test("test_dtos_bad_return", () => {
  const in_stream = `
        function void main() { 
          bool b = dtos(1.0); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

// # itod function

test("test_itod_too_few_args", () => {
  const in_stream = `
        function void main() { 
          double d = itod(); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_itod_too_many_args", () => {
  const in_stream = `
        function void main() { 
          double d = itod(0, 1); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_itod_bad_arg", () => {
  const in_stream = `
        function void main() { 
          double d = dtos(1); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(20)");
  }
});

test("test_itod_bad_return", () => {
  const in_stream = `
        function void main() { 
          bool b = itod(1); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

// # dtoi function

test("test_dtoi_too_few_args", () => {
  const in_stream = `
        function void main() { 
          int i = dtoi(); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_dtoi_too_many_args", () => {
  const in_stream = `
        function void main() { 
          int i = dtoi(0.0, 1.0); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_dtoi_bad_arg", () => {
  const in_stream = `
        function void main() { 
          int i = dtoi(1); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(20)");
  }
});

test("test_dtoi_bad_return", () => {
  const in_stream = `
        function void main() { 
          bool b = dtoi(1.0); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

// # length function

test("test_length_examples", () => {
  const in_stream = `
        function void main() { 
          int l1 = length("abc"); 
          int l2 = length(new int[1]); 
          int l3 = length(new double[10]); 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_length_too_few_args", () => {
  const in_stream = `
        function void main() { 
          int l = length(); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_length_too_many_args", () => {
  const in_stream = `
        function void main() { 
          int l = length("abc", "def"); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_length_bad_arg", () => {
  const in_stream = `
        function void main() { 
          int l = length(1.0); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(19)");
  }
});

test("test_length_bad_return", () => {
  const in_stream = `
        function void main() { 
          bool b = length("abc"); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

// # get function

test("test_get_examples", () => {
  const in_stream = `
        function void main() { 
          string c1 = get(0, "abc"); 
          string c2 = get(10, ""); 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_get_too_few_args", () => {
  const in_stream = `
        function void main() { 
          string c = get(0); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_get_too_many_args", () => {
  const in_stream = `
        function void main() { 
          string c = get(0, "abc", "def"); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_get_bad_first_arg", () => {
  const in_stream = `
        function void main() { 
          string c = get(1.0, "abc"); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(20)");
  }
});

test("test_get_bad_second_arg", () => {
  const in_stream = `
        function void main() { 
          string c = get(1, new string[10]); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(20)");
  }
});

test("test_get_bad_return", () => {
  const in_stream = `
        function void main() { 
          int i = get(0, "abc"); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

// #------------------------------------------------------------
// # USER-DEFINED FUNCTIONS CALLS
// #------------------------------------------------------------

test("test_single_parameter_call", () => {
  const in_stream = `
        function int f(int x) {} 
        function void main() { 
          int x = f(1) + f(1 + 2); 
        } 
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_bad_type_single_parameter_call", () => {
  const in_stream = `
        function int f(int x) {} 
        function void main() { 
          int x = f(2.0); 
          int y = f(null); 
        } 
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(20)");
  }
});

test("test_bad_too_many_params_call", () => {
  const in_stream = `
        function int f(int x) {}
        function void main() {
          int x = f(1, 2);
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_bad_too_few_params_call", () => {
  const in_stream = `
        function int f(int x) {}
        function void main() {
          int x = f();
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(18)");
  }
});

test("test_bad_return_single_parameter_call", () => {
  const in_stream = `
        function int f(int x) {}
        function void main() {
          double x = f(2);
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

test("test_mutiple_parameter_call", () => {
  const in_stream = `
        function bool f(int x, double y, string z) {}
        function void main() {
          bool x = f(1, 2.0, "abc");
          bool y = f(null, null, null);
        }
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_bad_arg_mutiple_parameter_call", () => {
  const in_stream = `
        function int f(int x, double y, string z) {}
        function void main() {
          bool x = f(1, "abc", 2.0);
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(20)");
  }
});

test("test_bad_return_mutiple_parameter_call", () => {
  const in_stream = `
        function int f(int x, double y, string z) {}
        function void main() {
          string x = f(1, 2.0, "abc");
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

test("test_bad_return_array_mutiple_parameter_call", () => {
  const in_stream = `
        function array int f(int x, double y, string z) {}
        function void main() {
          int x = f(1, 2.0, "abc");
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

test("test_bad_return_no_array_mutiple_parameter_call", () => {
  const in_stream = `
        function int f(int x, double y, string z) {}
        function void main() {
          array int x = f(1, 2.0, "abc");
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

test("test_single_param_access", () => {
  const in_stream = `
        function int f(int x) {return x;}
        function void main() { }
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_multiple_param_access", () => {
  const in_stream = `
        function double f(double x, double y) {return x + y;}
        function void main() { }
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_multiple_type_param_access", () => {
  const in_stream = `
        function double f(double x, string y) {return x + stod(y);}
        function void main() { }
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_param_type_mismatch", () => {
  const in_stream = `
        function double f(double x, string y) {return x + y;}
        function void main() { }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(23)");
  }
});

test("test_missing_param", () => {
  const in_stream = `
        function double f(double x) {return x + y;}
        function void main() { }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(31)");
  }
});

// #----------------------------------------------------------------------
// # ADDITIONAL ARRAY TESTS
// #----------------------------------------------------------------------

test("test_array_creation", () => {
  const in_stream = `
        struct S {}
        function void main() {
          int n = 10;
          array int a1 = new int[n];
          array int a2 = null;
          a2 = a1;
          array double a3 = new double[10];
          array string a4 = new string[n+1];
          array string a5 = null;
          array bool a6 = new bool[n];
          array S a7 = new S[n];
        }
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_bad_base_type_array_creation", () => {
  const in_stream = `
        function void main() {
          array int a1 = new double[n];
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(31)");
  }
});

test("test_bad_struct_type_array_creation", () => {
  const in_stream = `
        struct S1 {}
        struct S2 {}
        function void main() {
          array S1 a1 = new S2[n];
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(31)");
  }
});

test("test_array_access", () => {
  const in_stream = `
        struct S1 {string val;}
        function void main() {
          int n = 10;
          array bool a1 = new bool[n];
          array S1 a2 = new S1[n];
          bool x = a1[n-5];
          a1[0] = x or true;
          a2[0] = null;
          S1 s = a2[1];
          string t = a2[0].val;
        }
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_bad_array_assignment", () => {
  const in_stream = `
        function void main() {
          array bool a1 = new bool[10];
          a1[0] = 10;
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(13)");
  }
});

test("test_bad_array_access", () => {
  const in_stream = `
        function void main() {
          array bool a1 = new bool[10];
          int x = a1[0];
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

// #----------------------------------------------------------------------
// # ADDITIONAL STRUCT TESTS
// #----------------------------------------------------------------------

test("test_struct_creation", () => {
  const in_stream = `
        struct S1 { }
        struct S2 {int x;}
        struct S3 {int x; string y;}
        function void main() {
          S1 p1 = new S1();
          S2 p2 = new S2(5);
          S3 p3 = new S3(5, "a");
          S3 p4 = new S3(null, null);
        }
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_bad_struct_creation_too_few_args", () => {
  const in_stream = `
        struct S1 {int x;}
        function void main() {
          S1 p1 = new S1();
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(29)");
  }
});

test("test_bad_struct_creation_too_many_args", () => {
  const in_stream = `
        struct S1 {int x;}
        function void main() {
          S1 p1 = new S1(1, 2);
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(29)");
  }
});

test("test_bad_struct_creation_bad_arg_type", () => {
  const in_stream = `
        struct S1 {int x; string y;}
        function void main() {
          S1 p1 = new S1(1, 2);
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(30)");
  }
});

test("test_struct_path_examples", () => {
  const in_stream = `
        struct S {double val; T t;}
        struct T {bool val; S s;}
        function void main() {
          S s;
          T t = new T(null, s);
          s = new S(null, t);
          s.val = 1.0;
          t.val = true;
          s.t.val = false;
          t.s.val = 2.0;
          s.t.s.val = 3.0;
          t.s.t.val = true;
          double x = s.val;
          bool y = t.val;
          y = s.t.val;
          x = t.s.val;
          x = s.t.s.val;
          y = t.s.t.val;
        }
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_bad_lvalue_path_type", () => {
  const in_stream = `
        struct S1 {double val; S1 s;}
        function void main() {
          S1 p = new S1(null, null);
          s.s.val = 0;
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(31)");
  }
});

test("test_bad_rvalue_path_type", () => {
  const in_stream = `
        struct S1 {double val; S1 s;}
        function void main() {
          S1 p = new S1(null, null);
          int x = p.s.s.val;
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(12)");
  }
});

test("test_lvalue_array_path_type", () => {
  const in_stream = `
        struct S1 {double val; array S1 s;}
        function void main() {
          S1 p = new S1(null, null);
          p.s[0].s[1].val = 5.0;
        }
    `;

  new ASTParser(new Lexer(new StringBuffer(in_stream)))
    .parse()
    .accept(new SemanticChecker());
});

test("test_bad_lvalue_array_path_type", () => {
  const in_stream = `
        struct S1 {double val; array S1 s;}
        function void main() {
          S1 p = new S1(null, null);
          p.s[0].s.val = 5.0;
        }
    `;

  try {
    new ASTParser(new Lexer(new StringBuffer(in_stream)))
      .parse()
      .accept(new SemanticChecker());
  } catch (e: any) {
    expect((e.message as string)).toStartWith("(37)");
  }
});

// #----------------------------------------------------------------------
// # TODO: Add at least 10 of your own tests below. Half of the tests
// # should be positive tests, && half should be negative. Focus on
// # trickier parts of your code (e.g., rvalues, lvalues, new rvalues)
// # looking for places in your code that are not tested by the above.
// #----------------------------------------------------------------------

test("test_nested_rvalue", () => {
  const in_stream = `

            struct Node {
                int value;
                Nodee next;
            }

            struct Nodee {
                int value;
                Nodee next;
            }

            function int fun(int a) {
                Node c = new Node(null, null);
                int d = c.next.next.next.next.value;

                return d;
            }

            function void main() {
                int a = fun(20) + 20;
            }

    `;

  const ast = new ASTParser(new Lexer(new StringBuffer(in_stream))).parse();
  const visitor = new SemanticChecker();
  ast.accept(visitor);
});

test("test_path_and_array_access", () => {
  const in_stream = `

            struct Node {
                array Node next;
                int value;
            }

            function void main() {
                array Node a = new Node[10];
                int b = a[2].next[0].value;
            }

    `;

  const ast = new ASTParser(new Lexer(new StringBuffer(in_stream))).parse();
  const visitor = new SemanticChecker();
  ast.accept(visitor);
});

test("test_same_type_expr", () => {
  const in_stream = `

            struct Node {
                int value;
                Nodee next;
            }

            struct Nodee {
                int value;
                Nodee next;
            }

            function int fun(int a) {
                Node c = new Node(null, null);
                int d = c.next.next.next.next.value;

                return d;
            }

            function void main() {
                array int arr = new int[20];
                Node n = new Node(null, null);
                int a = fun(20) + 20 + arr[10] + n.value + n.next.next.value;
            }

    `;

  const ast = new ASTParser(new Lexer(new StringBuffer(in_stream))).parse();
  const visitor = new SemanticChecker();
  ast.accept(visitor);
});

test("test_new_assignment", () => {
  const in_stream = `

            struct Node {
                Node next;
                int value;
            }

            function void main() {
                Node x1 = new Node(null, null);
                x1 = new Node(x1, 10);
            }

    `;

  const ast = new ASTParser(new Lexer(new StringBuffer(in_stream))).parse();
  const visitor = new SemanticChecker();
  ast.accept(visitor);
});

test("test_variable_in_call_expr", () => {
  const in_stream = `

            function int fun(int a, int b) {
                return 30;
            }

            function void main() {
                int c = 10;
                int d = 20;
                int a = fun(c, d);
            }

    `;

  const ast = new ASTParser(new Lexer(new StringBuffer(in_stream))).parse();
  const visitor = new SemanticChecker();
  ast.accept(visitor);
});

test("test_bad_nested_rvalue", () => {
  const in_stream = `

            struct Node {
                int value;
                Nodee next;
            }

            struct Nodee {
                bool value;
                Nodee next;
            }

            function int fun(int a) {
                Node c = new Node(null, null);
                int d = c.next.next.next.next.value;
                return d;
            }

            function void main() {

            }

    `;

  const ast = new ASTParser(new Lexer(new StringBuffer(in_stream))).parse();
  const visitor = new SemanticChecker();

  try {
    ast.accept(visitor);
  } catch (err) {
    expect(
      err.message === `(12) Type mismatch. Tried assigning "bool" to "int"`
    );
  }
});

test("test_bad_path_and_array_access", () => {
  const in_stream = `

            struct Node {
                array Node next;
                int value;
            }

            function void main() {
                array Node a = new Node[10];
                int b = a[2].next[0].value.d;
            }

    `;

  const ast = new ASTParser(new Lexer(new StringBuffer(in_stream))).parse();
  const visitor = new SemanticChecker();

  try {
    ast.accept(visitor);
  } catch (err) {
    expect(err.message).toBe(`(37) Cannot read "d" from "int"`);
  }
});

test("test_bad_path_and_array_access2", () => {
  const in_stream = `

            struct Node {
                int value;
            }

            function void main() {
                array Node a = new Node[10];
                int b = a.t;
            }

    `;

  const ast = new ASTParser(new Lexer(new StringBuffer(in_stream))).parse();
  const visitor = new SemanticChecker();

  try {
    ast.accept(visitor);
  } catch (err) {
    expect(
      err.message === `(37) Cannot read "t" from "array main_Node"`
    );
  }
});

test("test_bad_type_expr", () => {
  const in_stream = `

            struct Node {
                int value;
                Nodee next;
            }

            struct Nodee {
                int value;
                Nodee next;
            }

            function int fun(int a) {
                Node c = new Node(null, null);
                int d = c.next.next.next.next.value;

                return d;
            }

            function void main() {
                array int arr = new int[20];
                Node n = new Node(null, null);
                int a = fun(20) + 20.0 + arr[10] + n.value + n.next.next.value;
            }

    `;

  const ast = new ASTParser(new Lexer(new StringBuffer(in_stream))).parse();
  const visitor = new SemanticChecker();

  try {
    ast.accept(visitor);
  } catch (err) {
    expect(
      err.message ===
        `(23) Operations can only be performed on same types, but got "double" and "int"`
    );
  }
});

test("test_illegal_op", () => {
  const in_stream = `

            function void main() {
                array int arr1 = new int[20];
                array int arr2 = new int[20];
                array int a = arr1 + arr2;
            }

    `;

  const ast = new ASTParser(new Lexer(new StringBuffer(in_stream))).parse();
  const visitor = new SemanticChecker();

  try {
    ast.accept(visitor);
  } catch (err) {
    expect(err.message).toBe(`(54) Can't use operator "+" on arrays`);
  }
});
