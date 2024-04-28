// #----------------------------------------------------------------------
// # Basic Function Definitions
// #----------------------------------------------------------------------
import { ASTParser } from "../Compiler/AST"
import { Lexer } from "../Compiler/Lexer"
import { StringBuffer } from "../Compiler/StringBuffer"
import { WhileStmt } from "../Compiler/types";
// import { test } from "./test";
function len(x: any) { return x.length }
import { expect, test } from "bun:test";


test("test_empty_input", () => {
    const in_stream = ''
    const p = new ASTParser(new Lexer(
        new StringBuffer(in_stream)
    )).parse()

    expect(p.fun_defs.length).toBe(0);
    expect(p.struct_defs.length).toBe(0);
});

test("test_empty_fun", () => {
    const in_stream = 'function int f() {}';
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    expect(len(p.fun_defs)).toBe(1);
    expect(len(p.struct_defs)).toBe(0);
    expect(p.fun_defs[0].return_type.type_name.lexeme).toBe('int');
    expect(p.fun_defs[0].return_type.is_array).toBe(false);
    expect(p.fun_defs[0].fun_name.lexeme).toBe('f');
    expect(len(p.fun_defs[0].params)).toBe(0);
    expect(len(p.fun_defs[0].stmts)).toBe(0);
});

test("test_empty_fun_array_return", () => {
    const in_stream = 'function array int f() {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(1);
    expect(p.fun_defs[0].return_type.type_name.lexeme).toBe('int');
    expect(p.fun_defs[0].return_type.is_array).toBe(true);
    expect(p.fun_defs[0].fun_name.lexeme).toBe('f');
    expect(len(p.fun_defs[0].params)).toBe(0);
    expect(len(p.fun_defs[0].stmts)).toBe(0);
});

test("test_empty_fun_one_param", () => {
    const in_stream = 'function int f(string x) {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(1)
    expect(len(p.fun_defs[0].params)).toBe(1)
    expect(p.fun_defs[0].params[0].data_type.is_array).toBe(false)
    expect(p.fun_defs[0].params[0].data_type.type_name.lexeme).toBe('string')
    expect(p.fun_defs[0].params[0].var_name.lexeme).toBe('x')

});
test("test_empty_fun_one_id_param", () => {
    const in_stream = 'function int f(S s1) {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(1)
    expect(len(p.fun_defs[0].params)).toBe(1)
    expect(p.fun_defs[0].params[0].data_type.is_array).toBe(false)
    expect(p.fun_defs[0].params[0].data_type.type_name.lexeme).toBe('S')
    expect(p.fun_defs[0].params[0].var_name.lexeme).toBe('s1')

});
test("test_empty_fun_one_array_param", () => {
    const in_stream = 'function int f(array int ys) {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(1)
    expect(len(p.fun_defs[0].params)).toBe(1)
    expect(p.fun_defs[0].params[0].data_type.is_array).toBe(true)
    expect(p.fun_defs[0].params[0].data_type.type_name.lexeme).toBe('int')
    expect(p.fun_defs[0].params[0].var_name.lexeme).toBe('ys')

});
test("test_empty_fun_two_params", () => {
    const in_stream = 'function int f(bool x, int y) {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(1)
    expect(len(p.fun_defs[0].params)).toBe(2)
    expect(p.fun_defs[0].params[0].data_type.is_array).toBe(false)
    expect(p.fun_defs[0].params[0].data_type.type_name.lexeme).toBe('bool')
    expect(p.fun_defs[0].params[0].var_name.lexeme).toBe('x')
    expect(p.fun_defs[0].params[1].data_type.is_array).toBe(false)
    expect(p.fun_defs[0].params[1].data_type.type_name.lexeme).toBe('int')
    expect(p.fun_defs[0].params[1].var_name.lexeme).toBe('y')

});
test("test_empty_fun_three_params", () => {
    const in_stream = 'function int f(bool x, int y, array string z) {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(1)
    expect(len(p.fun_defs[0].params)).toBe(3)
    expect(p.fun_defs[0].params[0].data_type.is_array).toBe(false)
    expect(p.fun_defs[0].params[0].data_type.type_name.lexeme).toBe('bool')
    expect(p.fun_defs[0].params[0].var_name.lexeme).toBe('x')
    expect(p.fun_defs[0].params[1].data_type.is_array).toBe(false)
    expect(p.fun_defs[0].params[1].data_type.type_name.lexeme).toBe('int')
    expect(p.fun_defs[0].params[1].var_name.lexeme).toBe('y')
    expect(p.fun_defs[0].params[2].data_type.is_array).toBe(true)
    expect(p.fun_defs[0].params[2].data_type.type_name.lexeme).toBe('string')
    expect(p.fun_defs[0].params[2].var_name.lexeme).toBe('z')

});

test("test_multiple_empty_funs", () => {
    const in_stream = 'function void f() {} function int g() {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(2)
    expect(len(p.struct_defs)).toBe(0)
});


// #----------------------------------------------------------------------
// # Basic Struct Definitions
// #----------------------------------------------------------------------

test("test_empty_struct", () => {
    const in_stream = 'struct S {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(0)
    expect(len(p.struct_defs)).toBe(1)
    expect(p.struct_defs[0].struct_name.lexeme).toBe('S')
    expect(len(p.struct_defs[0].fields)).toBe(0)
});

test("test_one_base_type_field_struct", () => {
    const in_stream = 'struct S {int x;}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(0)
    expect(len(p.struct_defs)).toBe(1)
    expect(p.struct_defs[0].struct_name.lexeme).toBe('S')
    expect(len(p.struct_defs[0].fields)).toBe(1)
    expect(p.struct_defs[0].fields[0].data_type.is_array).toBe(false)
    expect(p.struct_defs[0].fields[0].data_type.type_name.lexeme).toBe('int')
    expect(p.struct_defs[0].fields[0].var_name.lexeme).toBe('x')

});
test("test_one_id_field_struct", () => {
    const in_stream = 'struct S {S s1;}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(0)
    expect(len(p.struct_defs)).toBe(1)
    expect(p.struct_defs[0].struct_name.lexeme).toBe('S')
    expect(len(p.struct_defs[0].fields)).toBe(1)
    expect(p.struct_defs[0].fields[0].data_type.is_array).toBe(false)
    expect(p.struct_defs[0].fields[0].data_type.type_name.lexeme).toBe('S')
    expect(p.struct_defs[0].fields[0].var_name.lexeme).toBe('s1')

});
test("test_one_array_field_struct", () => {
    const in_stream = 'struct S {array int x1;}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(0)
    expect(len(p.struct_defs)).toBe(1)
    expect(p.struct_defs[0].struct_name.lexeme).toBe('S')
    expect(len(p.struct_defs[0].fields)).toBe(1)
    expect(p.struct_defs[0].fields[0].data_type.is_array).toBe(true)
    expect(p.struct_defs[0].fields[0].data_type.type_name.lexeme).toBe('int')
    expect(p.struct_defs[0].fields[0].var_name.lexeme).toBe('x1')

});
test("test_two_field_struct", () => {
    const in_stream = 'struct S {int x1; bool x2;}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(0)
    expect(len(p.struct_defs)).toBe(1)
    expect(p.struct_defs[0].struct_name.lexeme).toBe('S')
    expect(len(p.struct_defs[0].fields)).toBe(2)
    expect(p.struct_defs[0].fields[0].data_type.is_array).toBe(false)
    expect(p.struct_defs[0].fields[0].data_type.type_name.lexeme).toBe('int')
    expect(p.struct_defs[0].fields[0].var_name.lexeme).toBe('x1')
    expect(p.struct_defs[0].fields[1].data_type.is_array).toBe(false)
    expect(p.struct_defs[0].fields[1].data_type.type_name.lexeme).toBe('bool')
    expect(p.struct_defs[0].fields[1].var_name.lexeme).toBe('x2')

});

test("test_three_field_struct", () => {
    const in_stream = 'struct S {int x1; bool x2; array S x3;}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(0)
    expect(len(p.struct_defs)).toBe(1)
    expect(p.struct_defs[0].struct_name.lexeme).toBe('S')
    expect(len(p.struct_defs[0].fields)).toBe(3)
    expect(p.struct_defs[0].fields[0].data_type.is_array).toBe(false)
    expect(p.struct_defs[0].fields[0].data_type.type_name.lexeme).toBe('int')
    expect(p.struct_defs[0].fields[0].var_name.lexeme).toBe('x1')
    expect(p.struct_defs[0].fields[1].data_type.is_array).toBe(false)
    expect(p.struct_defs[0].fields[1].data_type.type_name.lexeme).toBe('bool')
    expect(p.struct_defs[0].fields[1].var_name.lexeme).toBe('x2')
    expect(p.struct_defs[0].fields[2].data_type.is_array).toBe(true)
    expect(p.struct_defs[0].fields[2].data_type.type_name.lexeme).toBe('S')
    expect(p.struct_defs[0].fields[2].var_name.lexeme).toBe('x3')
});


test("test_empty_struct_and_fun", () => {
    const in_stream = `struct S1 {} 
        function int f() {} 
        struct S2 {}
        function int g() {}
        struct S3 {}`

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs)).toBe(2)
    expect(len(p.struct_defs)).toBe(3)
    expect(p.fun_defs[0].fun_name.lexeme).toBe('f')
    expect(p.fun_defs[1].fun_name.lexeme).toBe('g')
    expect(p.struct_defs[0].struct_name.lexeme).toBe('S1')
    expect(p.struct_defs[1].struct_name.lexeme).toBe('S2')
    expect(p.struct_defs[2].struct_name.lexeme).toBe('S3')
});

// #----------------------------------------------------------------------
// # Variable Declaration Statements
// #----------------------------------------------------------------------

test("test_var_base_type_var_decls", () => {
    const in_stream =
        `function void main() { 
          int x1; 
          double x2; 
          bool x3; 
          string x4; 
        }`;

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(4)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.is_array).toBe(false)
    expect(p.fun_defs[0].stmts[1].var_def.data_type.is_array).toBe(false)
    expect(p.fun_defs[0].stmts[2].var_def.data_type.is_array).toBe(false)
    expect(p.fun_defs[0].stmts[3].var_def.data_type.is_array).toBe(false)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme).toBe('int')
    expect(p.fun_defs[0].stmts[1].var_def.data_type.type_name.lexeme).toBe('double')
    expect(p.fun_defs[0].stmts[2].var_def.data_type.type_name.lexeme).toBe('bool')
    expect(p.fun_defs[0].stmts[3].var_def.data_type.type_name.lexeme).toBe('string')
    expect(p.fun_defs[0].stmts[0].var_def.var_name.lexeme).toBe('x1')
    expect(p.fun_defs[0].stmts[1].var_def.var_name.lexeme).toBe('x2')
    expect(p.fun_defs[0].stmts[2].var_def.var_name.lexeme).toBe('x3')
    expect(p.fun_defs[0].stmts[3].var_def.var_name.lexeme).toBe('x4')
});

test("test_array_var_decl", () => {
    const in_stream = ` 
        function void main() { 
          array int x1; 
        } 
    `;
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.is_array).toBe(true)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme).toBe('int')
    expect(p.fun_defs[0].stmts[0].var_def.var_name.lexeme).toBe('x1')
});

test("test_id_var_decl", () => {
    const in_stream = `
        function void main() { 
          S s1; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.is_array).toBe(false)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme).toBe('S')
    expect(p.fun_defs[0].stmts[0].var_def.var_name.lexeme).toBe('s1')
});

test("test_base_type_var_def", () => {
    const in_stream = `
        function void main() { 
          int x1 = 0; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.is_array).toBe(false)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme).toBe('int')
    expect(p.fun_defs[0].stmts[0].var_def.var_name.lexeme).toBe('x1')
    expect(p.fun_defs[0].stmts[0].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme).toBe('0')
});

test("test_id_var_def", () => {
    const in_stream = `
        function void main() { 
          Node my_node = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.is_array).toBe(false)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme).toBe('Node')
    expect(p.fun_defs[0].stmts[0].var_def.var_name.lexeme).toBe('my_node')
    expect(p.fun_defs[0].stmts[0].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme).toBe('null')
});

test("test_array_var_def", () => {
    const in_stream = `
        function void main() { 
          array bool my_bools = null; 
          array Node my_nodes = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(2)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.is_array).toBe(true)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme).toBe('bool')
    expect(p.fun_defs[0].stmts[0].var_def.var_name.lexeme).toBe('my_bools')
    expect(p.fun_defs[0].stmts[0].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme).toBe('null')
    expect(p.fun_defs[0].stmts[1].var_def.data_type.is_array).toBe(true)
    expect(p.fun_defs[0].stmts[1].var_def.data_type.type_name.lexeme).toBe('Node')
    expect(p.fun_defs[0].stmts[1].var_def.var_name.lexeme).toBe('my_nodes')
    expect(p.fun_defs[0].stmts[1].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[1].expr.first.rvalue.value.lexeme).toBe('null')
});

// #----------------------------------------------------------------------
// # Assignment Statements
// #----------------------------------------------------------------------

test("test_simple_assignment", () => {
    const in_stream = `
        function void main() { 
          x = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    expect(p.fun_defs[0].stmts[0].lvalue[0].var_name.lexeme).toBe('x')
    expect(p.fun_defs[0].stmts[0].lvalue[0].array_expr).toBe(undefined)
    expect(p.fun_defs[0].stmts[0].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme).toBe('null')
    expect(p.fun_defs[0].stmts[0].expr.rest).toBe(undefined)
});

test("test_simple_path_assignment", () => {
    const in_stream = `
        function void main() { 
          x.y = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    expect(p.fun_defs[0].stmts[0].lvalue[0].var_name.lexeme).toBe('x')
    expect(p.fun_defs[0].stmts[0].lvalue[0].array_expr).toBe(undefined)
    expect(p.fun_defs[0].stmts[0].lvalue[1].var_name.lexeme).toBe('y')
    expect(p.fun_defs[0].stmts[0].lvalue[1].array_expr).toBe(undefined)
    expect(p.fun_defs[0].stmts[0].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme).toBe('null')
    expect(p.fun_defs[0].stmts[0].expr.rest).toBe(undefined)
});

test("test_simple_array_assignment", () => {
    const in_stream = `
        function void main() { 
          x[0] = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)

    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.lvalue[0].var_name.lexeme).toBe('x')
    expect(stmt.lvalue[0].array_expr.not_op).toBe(false)
    expect(stmt.lvalue[0].array_expr.first.rvalue.value.lexeme).toBe('0')
    expect(stmt.lvalue[0].array_expr.rest).toBe(undefined)
    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.value.lexeme).toBe('null')
    expect(stmt.expr.rest).toBe(undefined)
});

test("test_multiple_path_assignment", () => {
    const in_stream = `
        function void main() { 
          x1.x2[0].x3.x4[1] = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(len(stmt.lvalue)).toBe(4)
    expect(stmt.lvalue[0].var_name.lexeme).toBe('x1')
    expect(stmt.lvalue[0].array_expr).toBe(undefined)
    expect(stmt.lvalue[1].var_name.lexeme).toBe('x2')
    expect(stmt.lvalue[1].array_expr.not_op).toBe(false)
    expect(stmt.lvalue[1].array_expr.first.rvalue.value.lexeme).toBe('0')
    expect(stmt.lvalue[2].var_name.lexeme).toBe('x3')
    expect(stmt.lvalue[2].array_expr).toBe(undefined)
    expect(stmt.lvalue[3].var_name.lexeme).toBe('x4')
    expect(stmt.lvalue[3].array_expr.not_op).toBe(false)
    expect(stmt.lvalue[3].array_expr.first.rvalue.value.lexeme).toBe('1')
});


// #----------------------------------------------------------------------
// # If Statements
// #----------------------------------------------------------------------

test("test_single_if_statement", () => {
    const in_stream = `
        function void main() { 
          if (true) {} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.if_part.condition.first.rvalue.value.lexeme).toBe('true')
    expect(len(stmt.if_part.stmts)).toBe(0)
    expect(len(stmt.else_ifs)).toBe(0)
    expect(len(stmt.else_stmts)).toBe(0)
});

test("test_if_statement_with_body", () => {
    const in_stream = `
        function void main() { 
          if (true) {int x = 0;} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.if_part.condition.first.rvalue.value.lexeme).toBe('true')
    expect(len(stmt.if_part.stmts)).toBe(1)
    expect(len(stmt.else_ifs)).toBe(0)
    expect(len(stmt.else_stmts)).toBe(0)
});

test("test_if_statement_with_one_else_if", () => {
    const in_stream = `
        function void main() { 
          if (true) {} 
          elseif (false) {} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.if_part.condition.first.rvalue.value.lexeme).toBe('true')
    expect(len(stmt.if_part.stmts)).toBe(0)
    expect(len(stmt.else_ifs)).toBe(1)
    expect(stmt.else_ifs[0].condition.first.rvalue.value.lexeme).toBe('false')
    expect(len(stmt.else_ifs[0].stmts)).toBe(0)
});

test("test_if_statement_with_two_else_ifs", () => {
    const in_stream = `
        function void main() { 
          if (true) {} 
          elseif (false) {} 
          elseif (true) {} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.if_part.condition.first.rvalue.value.lexeme).toBe('true')
    expect(len(stmt.if_part.stmts)).toBe(0)
    expect(len(stmt.else_ifs)).toBe(2)
    expect(stmt.else_ifs[0].condition.first.rvalue.value.lexeme).toBe('false')
    expect(len(stmt.else_ifs[0].stmts)).toBe(0)
    expect(stmt.else_ifs[1].condition.first.rvalue.value.lexeme).toBe('true')
    expect(len(stmt.else_ifs[1].stmts)).toBe(0)
    expect(len(stmt.else_stmts)).toBe(0)
});

test("test_if_statement_with_empty_else", () => {
    const in_stream = `
        function void main() { 
          if (true) {} 
          else {} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.if_part.condition.first.rvalue.value.lexeme).toBe('true')
    expect(len(stmt.if_part.stmts)).toBe(0)
    expect(len(stmt.else_ifs)).toBe(0)
    expect(len(stmt.else_stmts)).toBe(0)
});

test("test_if_statement_with_non_empty_else", () => {
    const in_stream = `
        function void main() { 
          if (true) {} 
          else {x = 5;} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.if_part.condition.first.rvalue.value.lexeme).toBe('true')
    expect(len(stmt.if_part.stmts)).toBe(0)
    expect(len(stmt.else_ifs)).toBe(0)
    expect(len(stmt.else_stmts)).toBe(1)

});
test("test_full_if_statement", () => {
    const in_stream = `
        function void main() { 
          if (true) {x = 5;} 
          elseif (false) {x = 6;} 
          else {x = 7;} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.if_part.condition.first.rvalue.value.lexeme).toBe('true')
    expect(len(stmt.if_part.stmts)).toBe(1)
    expect(len(stmt.else_ifs)).toBe(1)
    expect(stmt.else_ifs[0].condition.first.rvalue.value.lexeme).toBe('false')
    expect(len(stmt.else_ifs[0].stmts)).toBe(1)
    expect(len(stmt.else_stmts)).toBe(1)

});

// #----------------------------------------------------------------------
// # While Statements
// #----------------------------------------------------------------------

test("test_empty_while_statement", () => {
    const in_stream = `
        function void main() { 
          while (true) {} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.condition.first.rvalue.value.lexeme).toBe('true')
    expect(len(stmt.stmts)).toBe(0)

});
test("test_while_statement_with_body", () => {
    const in_stream = `
        function void main() { 
          while (true) {x = 5;} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.condition.first.rvalue.value.lexeme).toBe('true')
    expect(len(stmt.stmts)).toBe(1)
});

// #----------------------------------------------------------------------
// # Expressions
// #----------------------------------------------------------------------


test("test_literals", () => {
    const in_stream = `
        function void main() { 
          x = true; 
          x = false;         
          x = 0; 
          x = 0.0; 
          x = "a"; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(5)
    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme).toBe('true')
    expect(p.fun_defs[0].stmts[1].expr.first.rvalue.value.lexeme).toBe('false')
    expect(p.fun_defs[0].stmts[2].expr.first.rvalue.value.lexeme).toBe('0')
    expect(p.fun_defs[0].stmts[3].expr.first.rvalue.value.lexeme).toBe('0.0')
    expect(p.fun_defs[0].stmts[4].expr.first.rvalue.value.lexeme).toBe('a')
    expect(p.fun_defs[0].stmts[0].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[1].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[2].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[3].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[4].expr.not_op).toBe(false)

});
test("test_simple_bool_expr", () => {
    const in_stream = `
        function void main() { 
          x = true and false; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.value.lexeme).toBe('true')
    expect(stmt.expr.op.lexeme).toBe('and')
    expect(stmt.expr.rest.not_op).toBe(false)
    expect(stmt.expr.rest.first.rvalue.value.lexeme).toBe('false')
    expect(stmt.expr.rest.op).toBe(undefined)
    expect(stmt.expr.rest.rest).toBe(undefined)

});
test("test_simple_not_bool_expr", () => {
    const in_stream = `
        function void main() { 
          x = not true and false; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.expr.not_op).toBe(true)
    expect(stmt.expr.first.rvalue.value.lexeme).toBe('true')
    expect(stmt.expr.op.lexeme).toBe('and')
    expect(stmt.expr.rest.not_op).toBe(false)
    expect(stmt.expr.rest.first.rvalue.value.lexeme).toBe('false')
    expect(stmt.expr.rest.op).toBe(undefined)
    expect(stmt.expr.rest.rest).toBe(undefined)

});
test("test_simple_paren_expr", () => {
    const in_stream = `
        function void main() { 
          x = (1 + 2); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.expr.first.rvalue.value.lexeme).toBe('1')
    expect(stmt.expr.first.expr.op.lexeme).toBe('+')
    expect(stmt.expr.first.expr.rest.not_op).toBe(false)
    expect(stmt.expr.first.expr.rest.first.rvalue.value.lexeme).toBe('2')
    expect(stmt.expr.first.expr.rest.op).toBe(undefined)
    expect(stmt.expr.first.expr.rest.rest).toBe(undefined)

});
test("test_expr_after_paren_expr", () => {
    const in_stream = `
        function void main() { 
          x = (1 + 2) - 3; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.expr.first.rvalue.value.lexeme).toBe('1')
    expect(stmt.expr.first.expr.op.lexeme).toBe('+')
    expect(stmt.expr.first.expr.rest.not_op).toBe(false)
    expect(stmt.expr.first.expr.rest.first.rvalue.value.lexeme).toBe('2')
    expect(stmt.expr.first.expr.rest.op).toBe(undefined)
    expect(stmt.expr.first.expr.rest.rest).toBe(undefined)
    expect(stmt.expr.op.lexeme).toBe('-')
    expect(stmt.expr.rest.not_op).toBe(false)
    expect(stmt.expr.rest.first.rvalue.value.lexeme).toBe('3')
    expect(stmt.expr.rest.op).toBe(undefined)
    expect(stmt.expr.rest.rest).toBe(undefined)

});
test("test_expr_before_paren_expr", () => {
    const in_stream = `
        function void main() { 
          x = 3 * (1 + 2); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.value.lexeme).toBe('3')
    expect(stmt.expr.op.lexeme).toBe('*')
    expect(stmt.expr.rest.not_op).toBe(false)
    expect(stmt.expr.rest.first.expr.first.rvalue.value.lexeme).toBe('1')
    expect(stmt.expr.rest.first.expr.op.lexeme).toBe('+')
    expect(stmt.expr.rest.first.expr.rest.not_op).toBe(false)
    expect(stmt.expr.rest.first.expr.rest.first.rvalue.value.lexeme).toBe('2')
    expect(stmt.expr.rest.first.expr.rest.op).toBe(undefined)
    expect(stmt.expr.rest.first.expr.rest.rest).toBe(undefined)
    expect(stmt.expr.rest.op).toBe(undefined)
    expect(stmt.expr.rest.rest).toBe(undefined)

});
test("test_expr_with_two_ops", () => {
    const in_stream = `
        function void main() { 
          x = 1 / 2 * 3; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.value.lexeme).toBe('1')
    expect(stmt.expr.op.lexeme).toBe('/')
    expect(stmt.expr.rest.not_op).toBe(false)
    expect(stmt.expr.rest.first.rvalue.value.lexeme).toBe('2')
    expect(stmt.expr.rest.op.lexeme).toBe('*')
    expect(stmt.expr.rest.rest.not_op).toBe(false)
    expect(stmt.expr.rest.rest.first.rvalue.value.lexeme).toBe('3')
    expect(stmt.expr.rest.rest.op).toBe(undefined)
    expect(stmt.expr.rest.rest.rest).toBe(undefined)

});
test("test_empty_call_expr", () => {
    const in_stream = `
        function void main() { 
          f(); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.fun_name.lexeme).toBe('f')
    expect(len(stmt.args)).toBe(0)

});
test("test_one_arg_call_expr", () => {
    const in_stream = `
        function void main() { 
          f(3); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]

    expect(stmt.fun_name.lexeme).toBe('f')
    expect(len(stmt.args)).toBe(1)
    expect(stmt.args[0].not_op).toBe(false)
    expect(stmt.args[0].first.rvalue.value.lexeme).toBe('3')
    expect(stmt.args[0].op).toBe(undefined)
    expect(stmt.args[0].rest).toBe(undefined)

});
test("test_two_arg_call_expr", () => {
    const in_stream = `
        function void main() { 
          f(3, 4); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.fun_name.lexeme).toBe('f')
    expect(len(stmt.args)).toBe(2)
    expect(stmt.args[0].not_op).toBe(false)
    expect(stmt.args[0].first.rvalue.value.lexeme).toBe('3')
    expect(stmt.args[0].op).toBe(undefined)
    expect(stmt.args[0].rest).toBe(undefined)
    expect(stmt.args[1].not_op).toBe(false)
    expect(stmt.args[1].first.rvalue.value.lexeme).toBe('4')
    expect(stmt.args[1].op).toBe(undefined)
    expect(stmt.args[1].rest).toBe(undefined)

});
test("test_simple_struct_new_expr", () => {
    const in_stream = `
        function void main() { 
          x = new S(); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.type_name.lexeme).toBe('S')
    expect(stmt.expr.first.rvalue.array_expr).toBe(undefined)
    expect(len(stmt.expr.first.rvalue.struct_params)).toBe(0)

});
test("test_two_arg_struct_new_expr", () => {
    const in_stream = `
        function void main() { 
          x = new S(3, 4); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.type_name.lexeme).toBe('S')
    expect(stmt.expr.first.rvalue.array_expr).toBe(undefined)
    expect(len(stmt.expr.first.rvalue.struct_params)).toBe(2)
    expect(stmt.expr.first.rvalue.struct_params[0].first.rvalue.value.lexeme).toBe('3')
    expect(stmt.expr.first.rvalue.struct_params[1].first.rvalue.value.lexeme).toBe('4')

});
test("test_base_type_array_new_expr", () => {
    const in_stream = `
        function void main() { 
          x = new int[10]; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.type_name.lexeme).toBe('int')
    expect(stmt.expr.first.rvalue.array_expr.first.rvalue.value.lexeme).toBe('10')
    expect(stmt.expr.first.rvalue.struct_params).toBe(undefined)

});
test("test_simple_var_rvalue", () => {
    const in_stream = `
        function void main() { 
          x = y; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(stmt.expr.not_op).toBe(false)
    expect(len(stmt.expr.first.rvalue.path)).toBe(1)
    expect(stmt.expr.first.rvalue.path[0].var_name.lexeme).toBe('y')
    expect(stmt.expr.first.rvalue.path[0].array_expr).toBe(undefined)

});
test("test_simple_array_var_rvalue", () => {
    const in_stream = `
        function void main() { 
          x = y[0]; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(len(stmt.expr.first.rvalue.path)).toBe(1)
    expect(stmt.expr.first.rvalue.path[0].var_name.lexeme).toBe('y')
    expect(stmt.expr.first.rvalue.path[0].array_expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.path[0].array_expr.first.rvalue.value.lexeme).toBe('0')
    expect(stmt.expr.first.rvalue.path[0].array_expr.op).toBe(undefined)
    expect(stmt.expr.first.rvalue.path[0].array_expr.rest).toBe(undefined)

});
test("test_two_path_var_rvalue", () => {
    const in_stream = `
        function void main() { 
          x = y.z; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(len(stmt.expr.first.rvalue.path)).toBe(2)
    expect(stmt.expr.first.rvalue.path[0].var_name.lexeme).toBe('y')
    expect(stmt.expr.first.rvalue.path[0].array_expr).toBe(undefined)
    expect(stmt.expr.first.rvalue.path[1].var_name.lexeme).toBe('z')
    expect(stmt.expr.first.rvalue.path[1].array_expr).toBe(undefined)


});
test("test_mixed_path_var_rvalue", () => {
    const in_stream = `
        function void main() { 
          x = u[2].v.w[1].y; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    expect(len(p.fun_defs[0].stmts)).toBe(1)
    const stmt = p.fun_defs[0].stmts[0]
    expect(len(stmt.expr.first.rvalue.path)).toBe(4)
    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.op).toBe(undefined)
    expect(stmt.expr.rest).toBe(undefined)
    const path = stmt.expr.first.rvalue.path
    expect(path[0].var_name.lexeme).toBe('u')
    expect(path[0].array_expr.not_op).toBe(false)
    expect(path[0].array_expr.first.rvalue.value.lexeme).toBe('2')
    expect(path[0].array_expr.op).toBe(undefined)
    expect(path[0].array_expr.rest).toBe(undefined)
    expect(path[1].var_name.lexeme).toBe('v')
    expect(path[1].array_expr).toBe(undefined)
    expect(path[2].var_name.lexeme).toBe('w')
    expect(path[2].array_expr.not_op).toBe(false)
    expect(path[2].array_expr.first.rvalue.value.lexeme).toBe('1')
    expect(path[2].array_expr.op).toBe(undefined)
    expect(path[2].array_expr.rest).toBe(undefined)
    expect(path[3].var_name.lexeme).toBe('y')
    expect(path[3].array_expr).toBe(undefined)
});


// #----------------------------------------------------------------------
// # TODO: Add at least 10 of your own tests below. Define at least two
// # tests for statements, one test for return statements, five tests
// # for expressions, and two tests that are more involved combining
// # multiple constructs.
// #----------------------------------------------------------------------

// # Two for statement tests

test("test_simple_for", () => {
    const in_stream = `
        function int main() {
            for(int i = 0; i < 30; i = i + 1) {
                int a = 10;
            }
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    expect(len(p.fun_defs[0].stmts)).toBe(1)
    expect(len(p.fun_defs[0].stmts[0].stmts)).toBe(1)

    expect(p.fun_defs[0].stmts[0].var_decl.var_def.var_name.lexeme).toBe("i")
    expect(p.fun_defs[0].stmts[0].var_decl.var_def.data_type.is_array).toBe(false)
    expect(p.fun_defs[0].stmts[0].var_decl.var_def.data_type.type_name.lexeme).toBe("int")

    expect(p.fun_defs[0].stmts[0].condition.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].condition.first.rvalue.path[0].var_name.lexeme).toBe("i")
    expect(p.fun_defs[0].stmts[0].condition.op.lexeme).toBe("<")
    expect(p.fun_defs[0].stmts[0].condition.rest.first.rvalue.value.lexeme).toBe("30")

    expect(p.fun_defs[0].stmts[0].assign_stmt.lvalue[0].var_name.lexeme).toBe("i")
    expect(p.fun_defs[0].stmts[0].assign_stmt.expr.first.rvalue.path[0].var_name.lexeme).toBe("i")
    expect(p.fun_defs[0].stmts[0].assign_stmt.expr.op.lexeme).toBe("+")

    expect(p.fun_defs[0].stmts[0].assign_stmt.expr.rest.first.rvalue.value.lexeme).toBe("1")


});
test("test_simple_for_non_simple_condition", () => {
    const in_stream = `
        function int main() {
            for(int i = (a + 1) * 200; i < (30 * 10); a[i] = a[i] + 1) {
                int a = 10;
            }
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    const assign_stmt: AssignStmt = p.fun_defs[0].stmts[0].assign_stmt;

    expect(len(p.fun_defs[0].stmts)).toBe(1)

    expect(p.fun_defs[0].stmts[0].var_decl.var_def.var_name.lexeme).toBe("i")
    expect(p.fun_defs[0].stmts[0].var_decl.var_def.data_type.is_array).toBe(false)
    expect(p.fun_defs[0].stmts[0].var_decl.var_def.data_type.type_name.lexeme).toBe("int")

    expect(p.fun_defs[0].stmts[0].var_decl.expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].var_decl.expr.first.expr.first.rvalue.path[0].var_name.lexeme).toBe("a")
    expect(p.fun_defs[0].stmts[0].var_decl.expr.op.lexeme).toBe('*')
    expect(p.fun_defs[0].stmts[0].var_decl.expr.rest.first.rvalue.value.lexeme).toBe('200')

    expect(p.fun_defs[0].stmts[0].condition.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].condition.first.rvalue.path[0].var_name.lexeme).toBe("i")
    expect(p.fun_defs[0].stmts[0].condition.op.lexeme).toBe("<")
    expect(p.fun_defs[0].stmts[0].condition.rest.first.expr.first.rvalue.value.lexeme).toBe("30")
    expect(p.fun_defs[0].stmts[0].condition.rest.first.expr.rest.first.rvalue.value.lexeme).toBe("10")

    expect(assign_stmt.lvalue[0].var_name.lexeme).toBe("a")
    expect(assign_stmt.lvalue[0].array_expr.first.rvalue.path[0].var_name.lexeme).toBe("i")
    expect(assign_stmt.expr.first.rvalue.path[0].var_name.lexeme).toBe("a")
    expect(assign_stmt.expr.first.rvalue.path[0].array_expr.first.rvalue.path[0].var_name.lexeme).toBe("i")

});

// # One return statement test
test("test_return_statement", () => {
    const in_stream = `
        function int main() {
            int y = 10;
            return 20;
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    expect(p.fun_defs[0].stmts.at(-1).expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts.at(-1).expr.first.rvalue.value.lexeme).toBe("20")
    expect(p.fun_defs[0].stmts.at(-1).expr.op).toBe(undefined)
    expect(p.fun_defs[0].stmts.at(-1).expr.rest).toBe(undefined)

});

// # Five expression tests
test("test_expr_with_function", () => {
    const in_stream = `
        function int main() {
            int y = f(2) * 3;
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.fun_name.lexeme).toBe("f")
    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.args[0].first.rvalue.value.lexeme).toBe("2")
    expect(p.fun_defs[0].stmts[0].expr.op.lexeme).toBe("*")
    expect(p.fun_defs[0].stmts[0].expr.rest.first.rvalue.value.lexeme).toBe("3")

});
test("test_expr_with_newVal", () => {
    const in_stream = `
        function int main() {
            int y = new int[2] * 3;
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    expect(p.fun_defs[0].stmts[0].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.type_name.lexeme).toBe("int")
    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.array_expr.first.rvalue.value.lexeme).toBe("2")
    expect(p.fun_defs[0].stmts[0].expr.op.lexeme).toBe("*")
    expect(p.fun_defs[0].stmts[0].expr.rest.first.rvalue.value.lexeme).toBe("3")

});
test("test_complex_expr", () => {
    const in_stream = `
        function int main() {
            int y = (2 + y) * 10;
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    expect(p.fun_defs[0].stmts[0].expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].expr.first.expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].expr.first.expr.first.rvalue.value.lexeme).toBe("2")
    expect(p.fun_defs[0].stmts[0].expr.first.expr.op.lexeme).toBe("+")
    expect(p.fun_defs[0].stmts[0].expr.first.expr.rest.first.rvalue.path[0].var_name.lexeme).toBe("y")
    expect(p.fun_defs[0].stmts[0].expr.op.lexeme).toBe("*")
    expect(p.fun_defs[0].stmts[0].expr.rest.first.rvalue.value.lexeme).toBe("10")

});
test("test_complex_expr_with_not", () => {
    const in_stream = `
        function int main() {
            bool y = not (a > 10);
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    expect(p.fun_defs[0].stmts[0].expr.not_op).toBe(true)
    expect(p.fun_defs[0].stmts[0].expr.first.expr.not_op).toBe(false)
    expect(p.fun_defs[0].stmts[0].expr.first.expr.first.rvalue.path[0].var_name.lexeme).toBe("a")
    expect(p.fun_defs[0].stmts[0].expr.first.expr.op.lexeme).toBe(">")
    expect(p.fun_defs[0].stmts[0].expr.first.expr.rest.first.rvalue.value.lexeme).toBe("10")
    expect(p.fun_defs[0].stmts[0].expr.op).toBe(undefined)
    expect(p.fun_defs[0].stmts[0].expr.rest).toBe(undefined)

});

test("test_complex_expr_with_multiple_paths", () => {
    const in_stream = `
        function int main() {
            bool y = a.b[2 + 3].c;
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    const stmt = p.fun_defs[0].stmts[0]

    expect(stmt.expr.first.rvalue.path[0].var_name.lexeme).toBe("a")
    expect(stmt.expr.first.rvalue.path[1].var_name.lexeme).toBe("b")

    expect(stmt.expr.first.rvalue.path[1].array_expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.path[1].array_expr.first.rvalue.value.lexeme).toBe("2")
    expect(stmt.expr.first.rvalue.path[1].array_expr.op.lexeme).toBe("+")

    expect(stmt.expr.first.rvalue.path[1].array_expr.rest.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.path[1].array_expr.rest.first.rvalue.value.lexeme).toBe("3")
    expect(stmt.expr.first.rvalue.path[1].array_expr.rest.op).toBe(undefined)
    expect(stmt.expr.first.rvalue.path[1].array_expr.rest.rest).toBe(undefined)

    expect(stmt.expr.first.rvalue.path[2].var_name.lexeme).toBe("c")

});

// # Three more involved tests that involve multiple constructs

test("test_while_statement_with_expression_and_body", () => {
    const in_stream = `
        function void main() { 
          while (not a > b) {
            int c = new bool[2] * 3;
          }
        } 
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    const whileStmt: WhileStmt = p.fun_defs[0].stmts[0]
    const stmt: VarDecl = whileStmt.stmts[0]

    expect(len(p.fun_defs[0].stmts)).toBe(1)
    expect(len(whileStmt.stmts)).toBe(1)

    expect(whileStmt.condition.not_op).toBe(true)
    expect(whileStmt.condition.first.rvalue.path[0].var_name.lexeme).toBe("a")
    expect(whileStmt.condition.op.lexeme).toBe(">")
    expect(whileStmt.condition.rest.first.rvalue.path[0].var_name.lexeme).toBe("b")
    expect(whileStmt.condition.rest.first.rvalue.path[0].var_name.lexeme).toBe("b")

    expect(stmt.var_def.data_type.is_array).toBe(false)
    expect(stmt.var_def.data_type.type_name.lexeme).toBe("int")
    expect(stmt.var_def.var_name.lexeme).toBe("c")

    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.type_name.lexeme).toBe("bool")
    expect(stmt.expr.first.rvalue.array_expr.first.rvalue.value.lexeme).toBe("2")
    expect(stmt.expr.op.lexeme).toBe("*")
    expect(stmt.expr.rest.first.rvalue.value.lexeme).toBe("3")

});
test("test_if_statement_with_complex_expression_and_body", () => {
    const in_stream = `
        function void main() { 
          if (not a > b) {
            int c = new bool[2] * 3;
          }
          elseif (not a > b) {
            int c = new bool[2] * 3;
          }
        } 
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    const ifStmt: BasicIf = p.fun_defs[0].stmts[0].if_part
    const elseIfStmt: BasicIf = p.fun_defs[0].stmts[0].else_ifs[0]
    const stmt: VarDecl = ifStmt.stmts[0]

    expect(len(p.fun_defs[0].stmts)).toBe(1)
    expect(len(ifStmt.stmts)).toBe(1)

    expect(ifStmt.condition.not_op).toBe(true)
    expect(ifStmt.condition.first.rvalue.path[0].var_name.lexeme).toBe("a")
    expect(ifStmt.condition.op.lexeme).toBe(">")
    expect(ifStmt.condition.rest.first.rvalue.path[0].var_name.lexeme).toBe("b")
    expect(ifStmt.condition.rest.first.rvalue.path[0].var_name.lexeme).toBe("b")

    expect(elseIfStmt.condition.not_op).toBe(true)
    expect(elseIfStmt.condition.first.rvalue.path[0].var_name.lexeme).toBe("a")
    expect(elseIfStmt.condition.op.lexeme).toBe(">")
    expect(elseIfStmt.condition.rest.first.rvalue.path[0].var_name.lexeme).toBe("b")
    expect(elseIfStmt.condition.rest.first.rvalue.path[0].var_name.lexeme).toBe("b")

    expect(stmt.var_def.data_type.is_array).toBe(false)
    expect(stmt.var_def.data_type.type_name.lexeme).toBe("int")
    expect(stmt.var_def.var_name.lexeme).toBe("c")

    expect(stmt.expr.not_op).toBe(false)
    expect(stmt.expr.first.rvalue.type_name.lexeme).toBe("bool")
    expect(stmt.expr.first.rvalue.array_expr.first.rvalue.value.lexeme).toBe("2")
    expect(stmt.expr.op.lexeme).toBe("*")
    expect(stmt.expr.rest.first.rvalue.value.lexeme).toBe("3")

});
test("test_structs_and_funcs", () => {
    const in_stream = `
        struct S {int x;}
        function void main() { 
          array int a = 10;
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    expect(len(p.fun_defs)).toBe(1)
    expect(len(p.struct_defs)).toBe(1)
    expect(len(p.struct_defs[0].fields)).toBe(1)
    expect(len(p.fun_defs[0].stmts)).toBe(1)

    expect(p.struct_defs[0].struct_name.lexeme).toBe('S')
    expect(p.struct_defs[0].fields[0].data_type.is_array).toBe(false)
    expect(p.struct_defs[0].fields[0].data_type.type_name.lexeme).toBe('int')
    expect(p.struct_defs[0].fields[0].var_name.lexeme).toBe('x')

    expect(p.fun_defs[0].stmts[0].var_def.data_type.is_array).toBe(true)
    expect(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme).toBe("int")
    expect(p.fun_defs[0].stmts[0].var_def.var_name.lexeme).toBe("a")
    expect(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme).toBe("10")
});