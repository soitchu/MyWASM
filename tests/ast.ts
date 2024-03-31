// #----------------------------------------------------------------------
// # Basic Function Definitions
// #----------------------------------------------------------------------
import { ASTParser } from "../Core/AST"
import { Lexer } from "../Core/Lexer"
import { StringBuffer } from "../Core/StringBuffer"
import { WhileStmt } from "../Core/types";
import { test } from "./test";
function len(x: any) { return x.length }


test("test_empty_input", () => {
    const in_stream = ''
    const p = new ASTParser(new Lexer(
        new StringBuffer(in_stream)
    )).parse()

    console.assert(p.fun_defs.length == 0);
    console.assert(p.struct_defs.length == 0);
});

test("test_empty_fun", () => {
    const in_stream = 'function int f() {}';
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    console.assert(len(p.fun_defs) == 1);
    console.assert(len(p.struct_defs) == 0);
    console.assert(p.fun_defs[0].return_type.type_name.lexeme == 'int');
    console.assert(p.fun_defs[0].return_type.is_array == false);
    console.assert(p.fun_defs[0].fun_name.lexeme == 'f');
    console.assert(len(p.fun_defs[0].params) == 0);
    console.assert(len(p.fun_defs[0].stmts) == 0);
});

test("test_empty_fun_array_return", () => {
    const in_stream = 'function array int f() {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 1);
    console.assert(p.fun_defs[0].return_type.type_name.lexeme == 'int');
    console.assert(p.fun_defs[0].return_type.is_array == true);
    console.assert(p.fun_defs[0].fun_name.lexeme == 'f');
    console.assert(len(p.fun_defs[0].params) == 0);
    console.assert(len(p.fun_defs[0].stmts) == 0);
});

test("test_empty_fun_one_param", () => {
    const in_stream = 'function int f(string x) {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 1)
    console.assert(len(p.fun_defs[0].params) == 1)
    console.assert(p.fun_defs[0].params[0].data_type.is_array == false)
    console.assert(p.fun_defs[0].params[0].data_type.type_name.lexeme == 'string')
    console.assert(p.fun_defs[0].params[0].var_name.lexeme == 'x')

});
test("test_empty_fun_one_id_param", () => {
    const in_stream = 'function int f(S s1) {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 1)
    console.assert(len(p.fun_defs[0].params) == 1)
    console.assert(p.fun_defs[0].params[0].data_type.is_array == false)
    console.assert(p.fun_defs[0].params[0].data_type.type_name.lexeme == 'S')
    console.assert(p.fun_defs[0].params[0].var_name.lexeme == 's1')

});
test("test_empty_fun_one_array_param", () => {
    const in_stream = 'function int f(array int ys) {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 1)
    console.assert(len(p.fun_defs[0].params) == 1)
    console.assert(p.fun_defs[0].params[0].data_type.is_array == true)
    console.assert(p.fun_defs[0].params[0].data_type.type_name.lexeme == 'int')
    console.assert(p.fun_defs[0].params[0].var_name.lexeme == 'ys')

});
test("test_empty_fun_two_params", () => {
    const in_stream = 'function int f(bool x, int y) {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 1)
    console.assert(len(p.fun_defs[0].params) == 2)
    console.assert(p.fun_defs[0].params[0].data_type.is_array == false)
    console.assert(p.fun_defs[0].params[0].data_type.type_name.lexeme == 'bool')
    console.assert(p.fun_defs[0].params[0].var_name.lexeme == 'x')
    console.assert(p.fun_defs[0].params[1].data_type.is_array == false)
    console.assert(p.fun_defs[0].params[1].data_type.type_name.lexeme == 'int')
    console.assert(p.fun_defs[0].params[1].var_name.lexeme == 'y')

});
test("test_empty_fun_three_params", () => {
    const in_stream = 'function int f(bool x, int y, array string z) {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 1)
    console.assert(len(p.fun_defs[0].params) == 3)
    console.assert(p.fun_defs[0].params[0].data_type.is_array == false)
    console.assert(p.fun_defs[0].params[0].data_type.type_name.lexeme == 'bool')
    console.assert(p.fun_defs[0].params[0].var_name.lexeme == 'x')
    console.assert(p.fun_defs[0].params[1].data_type.is_array == false)
    console.assert(p.fun_defs[0].params[1].data_type.type_name.lexeme == 'int')
    console.assert(p.fun_defs[0].params[1].var_name.lexeme == 'y')
    console.assert(p.fun_defs[0].params[2].data_type.is_array == true)
    console.assert(p.fun_defs[0].params[2].data_type.type_name.lexeme == 'string')
    console.assert(p.fun_defs[0].params[2].var_name.lexeme == 'z')

});

test("test_multiple_empty_funs", () => {
    const in_stream = 'function void f() {} function int g() {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 2)
    console.assert(len(p.struct_defs) == 0)
});


// #----------------------------------------------------------------------
// # Basic Struct Definitions
// #----------------------------------------------------------------------

test("test_empty_struct", () => {
    const in_stream = 'struct S {}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 0)
    console.assert(len(p.struct_defs) == 1)
    console.assert(p.struct_defs[0].struct_name.lexeme == 'S')
    console.assert(len(p.struct_defs[0].fields) == 0)
});

test("test_one_base_type_field_struct", () => {
    const in_stream = 'struct S {int x;}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 0)
    console.assert(len(p.struct_defs) == 1)
    console.assert(p.struct_defs[0].struct_name.lexeme == 'S')
    console.assert(len(p.struct_defs[0].fields) == 1)
    console.assert(p.struct_defs[0].fields[0].data_type.is_array == false)
    console.assert(p.struct_defs[0].fields[0].data_type.type_name.lexeme == 'int')
    console.assert(p.struct_defs[0].fields[0].var_name.lexeme == 'x')

});
test("test_one_id_field_struct", () => {
    const in_stream = 'struct S {S s1;}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 0)
    console.assert(len(p.struct_defs) == 1)
    console.assert(p.struct_defs[0].struct_name.lexeme == 'S')
    console.assert(len(p.struct_defs[0].fields) == 1)
    console.assert(p.struct_defs[0].fields[0].data_type.is_array == false)
    console.assert(p.struct_defs[0].fields[0].data_type.type_name.lexeme == 'S')
    console.assert(p.struct_defs[0].fields[0].var_name.lexeme == 's1')

});
test("test_one_array_field_struct", () => {
    const in_stream = 'struct S {array int x1;}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 0)
    console.assert(len(p.struct_defs) == 1)
    console.assert(p.struct_defs[0].struct_name.lexeme == 'S')
    console.assert(len(p.struct_defs[0].fields) == 1)
    console.assert(p.struct_defs[0].fields[0].data_type.is_array == true)
    console.assert(p.struct_defs[0].fields[0].data_type.type_name.lexeme == 'int')
    console.assert(p.struct_defs[0].fields[0].var_name.lexeme == 'x1')

});
test("test_two_field_struct", () => {
    const in_stream = 'struct S {int x1; bool x2;}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 0)
    console.assert(len(p.struct_defs) == 1)
    console.assert(p.struct_defs[0].struct_name.lexeme == 'S')
    console.assert(len(p.struct_defs[0].fields) == 2)
    console.assert(p.struct_defs[0].fields[0].data_type.is_array == false)
    console.assert(p.struct_defs[0].fields[0].data_type.type_name.lexeme == 'int')
    console.assert(p.struct_defs[0].fields[0].var_name.lexeme == 'x1')
    console.assert(p.struct_defs[0].fields[1].data_type.is_array == false)
    console.assert(p.struct_defs[0].fields[1].data_type.type_name.lexeme == 'bool')
    console.assert(p.struct_defs[0].fields[1].var_name.lexeme == 'x2')

});

test("test_three_field_struct", () => {
    const in_stream = 'struct S {int x1; bool x2; array S x3;}'
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 0)
    console.assert(len(p.struct_defs) == 1)
    console.assert(p.struct_defs[0].struct_name.lexeme == 'S')
    console.assert(len(p.struct_defs[0].fields) == 3)
    console.assert(p.struct_defs[0].fields[0].data_type.is_array == false)
    console.assert(p.struct_defs[0].fields[0].data_type.type_name.lexeme == 'int')
    console.assert(p.struct_defs[0].fields[0].var_name.lexeme == 'x1')
    console.assert(p.struct_defs[0].fields[1].data_type.is_array == false)
    console.assert(p.struct_defs[0].fields[1].data_type.type_name.lexeme == 'bool')
    console.assert(p.struct_defs[0].fields[1].var_name.lexeme == 'x2')
    console.assert(p.struct_defs[0].fields[2].data_type.is_array == true)
    console.assert(p.struct_defs[0].fields[2].data_type.type_name.lexeme == 'S')
    console.assert(p.struct_defs[0].fields[2].var_name.lexeme == 'x3')
});


test("test_empty_struct_and_fun", () => {
    const in_stream = `struct S1 {} 
        function int f() {} 
        struct S2 {}
        function int g() {}
        struct S3 {}`

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs) == 2)
    console.assert(len(p.struct_defs) == 3)
    console.assert(p.fun_defs[0].fun_name.lexeme == 'f')
    console.assert(p.fun_defs[1].fun_name.lexeme == 'g')
    console.assert(p.struct_defs[0].struct_name.lexeme == 'S1')
    console.assert(p.struct_defs[1].struct_name.lexeme == 'S2')
    console.assert(p.struct_defs[2].struct_name.lexeme == 'S3')
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
    console.assert(len(p.fun_defs[0].stmts) == 4)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.is_array == false)
    console.assert(p.fun_defs[0].stmts[1].var_def.data_type.is_array == false)
    console.assert(p.fun_defs[0].stmts[2].var_def.data_type.is_array == false)
    console.assert(p.fun_defs[0].stmts[3].var_def.data_type.is_array == false)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme == 'int')
    console.assert(p.fun_defs[0].stmts[1].var_def.data_type.type_name.lexeme == 'double')
    console.assert(p.fun_defs[0].stmts[2].var_def.data_type.type_name.lexeme == 'bool')
    console.assert(p.fun_defs[0].stmts[3].var_def.data_type.type_name.lexeme == 'string')
    console.assert(p.fun_defs[0].stmts[0].var_def.var_name.lexeme == 'x1')
    console.assert(p.fun_defs[0].stmts[1].var_def.var_name.lexeme == 'x2')
    console.assert(p.fun_defs[0].stmts[2].var_def.var_name.lexeme == 'x3')
    console.assert(p.fun_defs[0].stmts[3].var_def.var_name.lexeme == 'x4')
});

test("test_array_var_decl", () => {
    const in_stream = ` 
        function void main() { 
          array int x1; 
        } 
    `;
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.is_array == true)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme == 'int')
    console.assert(p.fun_defs[0].stmts[0].var_def.var_name.lexeme == 'x1')
});

test("test_id_var_decl", () => {
    const in_stream = `
        function void main() { 
          S s1; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.is_array == false)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme == 'S')
    console.assert(p.fun_defs[0].stmts[0].var_def.var_name.lexeme == 's1')
});

test("test_base_type_var_def", () => {
    const in_stream = `
        function void main() { 
          int x1 = 0; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.is_array == false)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme == 'int')
    console.assert(p.fun_defs[0].stmts[0].var_def.var_name.lexeme == 'x1')
    console.assert(p.fun_defs[0].stmts[0].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme == '0')
});

test("test_id_var_def", () => {
    const in_stream = `
        function void main() { 
          Node my_node = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.is_array == false)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme == 'Node')
    console.assert(p.fun_defs[0].stmts[0].var_def.var_name.lexeme == 'my_node')
    console.assert(p.fun_defs[0].stmts[0].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme == 'null')
});

test("test_array_var_def", () => {
    const in_stream = `
        function void main() { 
          array bool my_bools = null; 
          array Node my_nodes = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 2)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.is_array == true)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme == 'bool')
    console.assert(p.fun_defs[0].stmts[0].var_def.var_name.lexeme == 'my_bools')
    console.assert(p.fun_defs[0].stmts[0].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme == 'null')
    console.assert(p.fun_defs[0].stmts[1].var_def.data_type.is_array == true)
    console.assert(p.fun_defs[0].stmts[1].var_def.data_type.type_name.lexeme == 'Node')
    console.assert(p.fun_defs[0].stmts[1].var_def.var_name.lexeme == 'my_nodes')
    console.assert(p.fun_defs[0].stmts[1].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[1].expr.first.rvalue.value.lexeme == 'null')
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
    console.assert(len(p.fun_defs[0].stmts) == 1)
    console.assert(p.fun_defs[0].stmts[0].lvalue[0].var_name.lexeme == 'x')
    console.assert(p.fun_defs[0].stmts[0].lvalue[0].array_expr == undefined)
    console.assert(p.fun_defs[0].stmts[0].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme == 'null')
    console.assert(p.fun_defs[0].stmts[0].expr.rest == undefined)
});

test("test_simple_path_assignment", () => {
    const in_stream = `
        function void main() { 
          x.y = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    console.assert(p.fun_defs[0].stmts[0].lvalue[0].var_name.lexeme == 'x')
    console.assert(p.fun_defs[0].stmts[0].lvalue[0].array_expr == undefined)
    console.assert(p.fun_defs[0].stmts[0].lvalue[1].var_name.lexeme == 'y')
    console.assert(p.fun_defs[0].stmts[0].lvalue[1].array_expr == undefined)
    console.assert(p.fun_defs[0].stmts[0].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme == 'null')
    console.assert(p.fun_defs[0].stmts[0].expr.rest == undefined)
});

test("test_simple_array_assignment", () => {
    const in_stream = `
        function void main() { 
          x[0] = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)

    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.lvalue[0].var_name.lexeme == 'x')
    console.assert(stmt.lvalue[0].array_expr.not_op == false)
    console.assert(stmt.lvalue[0].array_expr.first.rvalue.value.lexeme == '0')
    console.assert(stmt.lvalue[0].array_expr.rest == undefined)
    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.value.lexeme == 'null')
    console.assert(stmt.expr.rest == undefined)
});

test("test_multiple_path_assignment", () => {
    const in_stream = `
        function void main() { 
          x1.x2[0].x3.x4[1] = null; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(len(stmt.lvalue) == 4)
    console.assert(stmt.lvalue[0].var_name.lexeme == 'x1')
    console.assert(stmt.lvalue[0].array_expr == undefined)
    console.assert(stmt.lvalue[1].var_name.lexeme == 'x2')
    console.assert(stmt.lvalue[1].array_expr.not_op == false)
    console.assert(stmt.lvalue[1].array_expr.first.rvalue.value.lexeme == '0')
    console.assert(stmt.lvalue[2].var_name.lexeme == 'x3')
    console.assert(stmt.lvalue[2].array_expr == undefined)
    console.assert(stmt.lvalue[3].var_name.lexeme == 'x4')
    console.assert(stmt.lvalue[3].array_expr.not_op == false)
    console.assert(stmt.lvalue[3].array_expr.first.rvalue.value.lexeme == '1')
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
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.if_part.condition.first.rvalue.value.lexeme == 'true')
    console.assert(len(stmt.if_part.stmts) == 0)
    console.assert(len(stmt.else_ifs) == 0)
    console.assert(len(stmt.else_stmts) == 0)
});

test("test_if_statement_with_body", () => {
    const in_stream = `
        function void main() { 
          if (true) {int x = 0;} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.if_part.condition.first.rvalue.value.lexeme == 'true')
    console.assert(len(stmt.if_part.stmts) == 1)
    console.assert(len(stmt.else_ifs) == 0)
    console.assert(len(stmt.else_stmts) == 0)
});

test("test_if_statement_with_one_else_if", () => {
    const in_stream = `
        function void main() { 
          if (true) {} 
          elseif (false) {} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.if_part.condition.first.rvalue.value.lexeme == 'true')
    console.assert(len(stmt.if_part.stmts) == 0)
    console.assert(len(stmt.else_ifs) == 1)
    console.assert(stmt.else_ifs[0].condition.first.rvalue.value.lexeme == 'false')
    console.assert(len(stmt.else_ifs[0].stmts) == 0)
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
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.if_part.condition.first.rvalue.value.lexeme == 'true')
    console.assert(len(stmt.if_part.stmts) == 0)
    console.assert(len(stmt.else_ifs) == 2)
    console.assert(stmt.else_ifs[0].condition.first.rvalue.value.lexeme == 'false')
    console.assert(len(stmt.else_ifs[0].stmts) == 0)
    console.assert(stmt.else_ifs[1].condition.first.rvalue.value.lexeme == 'true')
    console.assert(len(stmt.else_ifs[1].stmts) == 0)
    console.assert(len(stmt.else_stmts) == 0)
});

test("test_if_statement_with_empty_else", () => {
    const in_stream = `
        function void main() { 
          if (true) {} 
          else {} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.if_part.condition.first.rvalue.value.lexeme == 'true')
    console.assert(len(stmt.if_part.stmts) == 0)
    console.assert(len(stmt.else_ifs) == 0)
    console.assert(len(stmt.else_stmts) == 0)
});

test("test_if_statement_with_non_empty_else", () => {
    const in_stream = `
        function void main() { 
          if (true) {} 
          else {x = 5;} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.if_part.condition.first.rvalue.value.lexeme == 'true')
    console.assert(len(stmt.if_part.stmts) == 0)
    console.assert(len(stmt.else_ifs) == 0)
    console.assert(len(stmt.else_stmts) == 1)

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
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.if_part.condition.first.rvalue.value.lexeme == 'true')
    console.assert(len(stmt.if_part.stmts) == 1)
    console.assert(len(stmt.else_ifs) == 1)
    console.assert(stmt.else_ifs[0].condition.first.rvalue.value.lexeme == 'false')
    console.assert(len(stmt.else_ifs[0].stmts) == 1)
    console.assert(len(stmt.else_stmts) == 1)

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
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.condition.first.rvalue.value.lexeme == 'true')
    console.assert(len(stmt.stmts) == 0)

});
test("test_while_statement_with_body", () => {
    const in_stream = `
        function void main() { 
          while (true) {x = 5;} 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.condition.first.rvalue.value.lexeme == 'true')
    console.assert(len(stmt.stmts) == 1)
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
    console.assert(len(p.fun_defs[0].stmts) == 5)
    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme == 'true')
    console.assert(p.fun_defs[0].stmts[1].expr.first.rvalue.value.lexeme == 'false')
    console.assert(p.fun_defs[0].stmts[2].expr.first.rvalue.value.lexeme == '0')
    console.assert(p.fun_defs[0].stmts[3].expr.first.rvalue.value.lexeme == '0.0')
    console.assert(p.fun_defs[0].stmts[4].expr.first.rvalue.value.lexeme == 'a')
    console.assert(p.fun_defs[0].stmts[0].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[1].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[2].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[3].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[4].expr.not_op == false)

});
test("test_simple_bool_expr", () => {
    const in_stream = `
        function void main() { 
          x = true and false; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.value.lexeme == 'true')
    console.assert(stmt.expr.op.lexeme == 'and')
    console.assert(stmt.expr.rest.not_op == false)
    console.assert(stmt.expr.rest.first.rvalue.value.lexeme == 'false')
    console.assert(stmt.expr.rest.op == undefined)
    console.assert(stmt.expr.rest.rest == undefined)

});
test("test_simple_not_bool_expr", () => {
    const in_stream = `
        function void main() { 
          x = not true and false; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.expr.not_op == true)
    console.assert(stmt.expr.first.rvalue.value.lexeme == 'true')
    console.assert(stmt.expr.op.lexeme == 'and')
    console.assert(stmt.expr.rest.not_op == false)
    console.assert(stmt.expr.rest.first.rvalue.value.lexeme == 'false')
    console.assert(stmt.expr.rest.op == undefined)
    console.assert(stmt.expr.rest.rest == undefined)

});
test("test_simple_paren_expr", () => {
    const in_stream = `
        function void main() { 
          x = (1 + 2); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.expr.first.rvalue.value.lexeme == '1')
    console.assert(stmt.expr.first.expr.op.lexeme == '+')
    console.assert(stmt.expr.first.expr.rest.not_op == false)
    console.assert(stmt.expr.first.expr.rest.first.rvalue.value.lexeme == '2')
    console.assert(stmt.expr.first.expr.rest.op == undefined)
    console.assert(stmt.expr.first.expr.rest.rest == undefined)

});
test("test_expr_after_paren_expr", () => {
    const in_stream = `
        function void main() { 
          x = (1 + 2) - 3; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.expr.first.rvalue.value.lexeme == '1')
    console.assert(stmt.expr.first.expr.op.lexeme == '+')
    console.assert(stmt.expr.first.expr.rest.not_op == false)
    console.assert(stmt.expr.first.expr.rest.first.rvalue.value.lexeme == '2')
    console.assert(stmt.expr.first.expr.rest.op == undefined)
    console.assert(stmt.expr.first.expr.rest.rest == undefined)
    console.assert(stmt.expr.op.lexeme == '-')
    console.assert(stmt.expr.rest.not_op == false)
    console.assert(stmt.expr.rest.first.rvalue.value.lexeme == '3')
    console.assert(stmt.expr.rest.op == undefined)
    console.assert(stmt.expr.rest.rest == undefined)

});
test("test_expr_before_paren_expr", () => {
    const in_stream = `
        function void main() { 
          x = 3 * (1 + 2); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.value.lexeme == '3')
    console.assert(stmt.expr.op.lexeme == '*')
    console.assert(stmt.expr.rest.not_op == false)
    console.assert(stmt.expr.rest.first.expr.first.rvalue.value.lexeme == '1')
    console.assert(stmt.expr.rest.first.expr.op.lexeme == '+')
    console.assert(stmt.expr.rest.first.expr.rest.not_op == false)
    console.assert(stmt.expr.rest.first.expr.rest.first.rvalue.value.lexeme == '2')
    console.assert(stmt.expr.rest.first.expr.rest.op == undefined)
    console.assert(stmt.expr.rest.first.expr.rest.rest == undefined)
    console.assert(stmt.expr.rest.op == undefined)
    console.assert(stmt.expr.rest.rest == undefined)

});
test("test_expr_with_two_ops", () => {
    const in_stream = `
        function void main() { 
          x = 1 / 2 * 3; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.value.lexeme == '1')
    console.assert(stmt.expr.op.lexeme == '/')
    console.assert(stmt.expr.rest.not_op == false)
    console.assert(stmt.expr.rest.first.rvalue.value.lexeme == '2')
    console.assert(stmt.expr.rest.op.lexeme == '*')
    console.assert(stmt.expr.rest.rest.not_op == false)
    console.assert(stmt.expr.rest.rest.first.rvalue.value.lexeme == '3')
    console.assert(stmt.expr.rest.rest.op == undefined)
    console.assert(stmt.expr.rest.rest.rest == undefined)

});
test("test_empty_call_expr", () => {
    const in_stream = `
        function void main() { 
          f(); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.fun_name.lexeme == 'f')
    console.assert(len(stmt.args) == 0)

});
test("test_one_arg_call_expr", () => {
    const in_stream = `
        function void main() { 
          f(3); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]

    console.assert(stmt.fun_name.lexeme == 'f')
    console.assert(len(stmt.args) == 1)
    console.assert(stmt.args[0].not_op == false)
    console.assert(stmt.args[0].first.rvalue.value.lexeme == '3')
    console.assert(stmt.args[0].op == undefined)
    console.assert(stmt.args[0].rest == undefined)

});
test("test_two_arg_call_expr", () => {
    const in_stream = `
        function void main() { 
          f(3, 4); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.fun_name.lexeme == 'f')
    console.assert(len(stmt.args) == 2)
    console.assert(stmt.args[0].not_op == false)
    console.assert(stmt.args[0].first.rvalue.value.lexeme == '3')
    console.assert(stmt.args[0].op == undefined)
    console.assert(stmt.args[0].rest == undefined)
    console.assert(stmt.args[1].not_op == false)
    console.assert(stmt.args[1].first.rvalue.value.lexeme == '4')
    console.assert(stmt.args[1].op == undefined)
    console.assert(stmt.args[1].rest == undefined)

});
test("test_simple_struct_new_expr", () => {
    const in_stream = `
        function void main() { 
          x = new S(); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.type_name.lexeme == 'S')
    console.assert(stmt.expr.first.rvalue.array_expr == undefined)
    console.assert(len(stmt.expr.first.rvalue.struct_params) == 0)

});
test("test_two_arg_struct_new_expr", () => {
    const in_stream = `
        function void main() { 
          x = new S(3, 4); 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.type_name.lexeme == 'S')
    console.assert(stmt.expr.first.rvalue.array_expr == undefined)
    console.assert(len(stmt.expr.first.rvalue.struct_params) == 2)
    console.assert(stmt.expr.first.rvalue.struct_params[0].first.rvalue.value.lexeme == '3')
    console.assert(stmt.expr.first.rvalue.struct_params[1].first.rvalue.value.lexeme == '4')

});
test("test_base_type_array_new_expr", () => {
    const in_stream = `
        function void main() { 
          x = new int[10]; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.type_name.lexeme == 'int')
    console.assert(stmt.expr.first.rvalue.array_expr.first.rvalue.value.lexeme == '10')
    console.assert(stmt.expr.first.rvalue.struct_params == undefined)

});
test("test_simple_var_rvalue", () => {
    const in_stream = `
        function void main() { 
          x = y; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(stmt.expr.not_op == false)
    console.assert(len(stmt.expr.first.rvalue.path) == 1)
    console.assert(stmt.expr.first.rvalue.path[0].var_name.lexeme == 'y')
    console.assert(stmt.expr.first.rvalue.path[0].array_expr == undefined)

});
test("test_simple_array_var_rvalue", () => {
    const in_stream = `
        function void main() { 
          x = y[0]; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(len(stmt.expr.first.rvalue.path) == 1)
    console.assert(stmt.expr.first.rvalue.path[0].var_name.lexeme == 'y')
    console.assert(stmt.expr.first.rvalue.path[0].array_expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.path[0].array_expr.first.rvalue.value.lexeme == '0')
    console.assert(stmt.expr.first.rvalue.path[0].array_expr.op == undefined)
    console.assert(stmt.expr.first.rvalue.path[0].array_expr.rest == undefined)

});
test("test_two_path_var_rvalue", () => {
    const in_stream = `
        function void main() { 
          x = y.z; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(len(stmt.expr.first.rvalue.path) == 2)
    console.assert(stmt.expr.first.rvalue.path[0].var_name.lexeme == 'y')
    console.assert(stmt.expr.first.rvalue.path[0].array_expr == undefined)
    console.assert(stmt.expr.first.rvalue.path[1].var_name.lexeme == 'z')
    console.assert(stmt.expr.first.rvalue.path[1].array_expr == undefined)


});
test("test_mixed_path_var_rvalue", () => {
    const in_stream = `
        function void main() { 
          x = u[2].v.w[1].y; 
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();
    console.assert(len(p.fun_defs[0].stmts) == 1)
    const stmt = p.fun_defs[0].stmts[0]
    console.assert(len(stmt.expr.first.rvalue.path) == 4)
    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.op == undefined)
    console.assert(stmt.expr.rest == undefined)
    const path = stmt.expr.first.rvalue.path
    console.assert(path[0].var_name.lexeme == 'u')
    console.assert(path[0].array_expr.not_op == false)
    console.assert(path[0].array_expr.first.rvalue.value.lexeme == '2')
    console.assert(path[0].array_expr.op == undefined)
    console.assert(path[0].array_expr.rest == undefined)
    console.assert(path[1].var_name.lexeme == 'v')
    console.assert(path[1].array_expr == undefined)
    console.assert(path[2].var_name.lexeme == 'w')
    console.assert(path[2].array_expr.not_op == false)
    console.assert(path[2].array_expr.first.rvalue.value.lexeme == '1')
    console.assert(path[2].array_expr.op == undefined)
    console.assert(path[2].array_expr.rest == undefined)
    console.assert(path[3].var_name.lexeme == 'y')
    console.assert(path[3].array_expr == undefined)
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

    console.assert(len(p.fun_defs[0].stmts) == 1)
    console.assert(len(p.fun_defs[0].stmts[0].stmts) == 1)

    console.assert(p.fun_defs[0].stmts[0].var_decl.var_def.var_name.lexeme == "i")
    console.assert(p.fun_defs[0].stmts[0].var_decl.var_def.data_type.is_array == false)
    console.assert(p.fun_defs[0].stmts[0].var_decl.var_def.data_type.type_name.lexeme == "int")

    console.assert(p.fun_defs[0].stmts[0].condition.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].condition.first.rvalue.path[0].var_name.lexeme == "i")
    console.assert(p.fun_defs[0].stmts[0].condition.op.lexeme == "<")
    console.assert(p.fun_defs[0].stmts[0].condition.rest.first.rvalue.value.lexeme == "30")

    console.assert(p.fun_defs[0].stmts[0].assign_stmt.lvalue[0].var_name.lexeme == "i")
    console.assert(p.fun_defs[0].stmts[0].assign_stmt.expr.first.rvalue.path[0].var_name.lexeme == "i")
    console.assert(p.fun_defs[0].stmts[0].assign_stmt.expr.op.lexeme == "+")

    console.assert(p.fun_defs[0].stmts[0].assign_stmt.expr.rest.first.rvalue.value.lexeme == "1")


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

    console.assert(len(p.fun_defs[0].stmts) == 1)

    console.assert(p.fun_defs[0].stmts[0].var_decl.var_def.var_name.lexeme == "i")
    console.assert(p.fun_defs[0].stmts[0].var_decl.var_def.data_type.is_array == false)
    console.assert(p.fun_defs[0].stmts[0].var_decl.var_def.data_type.type_name.lexeme == "int")

    console.assert(p.fun_defs[0].stmts[0].var_decl.expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].var_decl.expr.first.expr.first.rvalue.path[0].var_name.lexeme == "a")
    console.assert(p.fun_defs[0].stmts[0].var_decl.expr.op.lexeme == '*')
    console.assert(p.fun_defs[0].stmts[0].var_decl.expr.rest.first.rvalue.value.lexeme == '200')

    console.assert(p.fun_defs[0].stmts[0].condition.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].condition.first.rvalue.path[0].var_name.lexeme == "i")
    console.assert(p.fun_defs[0].stmts[0].condition.op.lexeme == "<")
    console.assert(p.fun_defs[0].stmts[0].condition.rest.first.expr.first.rvalue.value.lexeme == "30")
    console.assert(p.fun_defs[0].stmts[0].condition.rest.first.expr.rest.first.rvalue.value.lexeme == "10")

    console.assert(assign_stmt.lvalue[0].var_name.lexeme == "a")
    console.assert(assign_stmt.lvalue[0].array_expr.first.rvalue.path[0].var_name.lexeme == "i")
    console.assert(assign_stmt.expr.first.rvalue.path[0].var_name.lexeme == "a")
    console.assert(assign_stmt.expr.first.rvalue.path[0].array_expr.first.rvalue.path[0].var_name.lexeme == "i")

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

    console.assert(p.fun_defs[0].stmts.at(-1).expr.not_op == false)
    console.assert(p.fun_defs[0].stmts.at(-1).expr.first.rvalue.value.lexeme == "20")
    console.assert(p.fun_defs[0].stmts.at(-1).expr.op == undefined)
    console.assert(p.fun_defs[0].stmts.at(-1).expr.rest == undefined)

});

// # Five expression tests
test("test_expr_with_function", () => {
    const in_stream = `
        function int main() {
            int y = f(2) * 3;
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.fun_name.lexeme == "f")
    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.args[0].first.rvalue.value.lexeme == "2")
    console.assert(p.fun_defs[0].stmts[0].expr.op.lexeme == "*")
    console.assert(p.fun_defs[0].stmts[0].expr.rest.first.rvalue.value.lexeme == "3")

});
test("test_expr_with_newVal", () => {
    const in_stream = `
        function int main() {
            int y = new int[2] * 3;
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    console.assert(p.fun_defs[0].stmts[0].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.type_name.lexeme == "int")
    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.array_expr.first.rvalue.value.lexeme == "2")
    console.assert(p.fun_defs[0].stmts[0].expr.op.lexeme == "*")
    console.assert(p.fun_defs[0].stmts[0].expr.rest.first.rvalue.value.lexeme == "3")

});
test("test_complex_expr", () => {
    const in_stream = `
        function int main() {
            int y = (2 + y) * 10;
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    console.assert(p.fun_defs[0].stmts[0].expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].expr.first.expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].expr.first.expr.first.rvalue.value.lexeme == "2")
    console.assert(p.fun_defs[0].stmts[0].expr.first.expr.op.lexeme == "+")
    console.assert(p.fun_defs[0].stmts[0].expr.first.expr.rest.first.rvalue.path[0].var_name.lexeme == "y")
    console.assert(p.fun_defs[0].stmts[0].expr.op.lexeme == "*")
    console.assert(p.fun_defs[0].stmts[0].expr.rest.first.rvalue.value.lexeme == "10")

});
test("test_complex_expr_with_not", () => {
    const in_stream = `
        function int main() {
            bool y = not (a > 10);
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    console.assert(p.fun_defs[0].stmts[0].expr.not_op == true)
    console.assert(p.fun_defs[0].stmts[0].expr.first.expr.not_op == false)
    console.assert(p.fun_defs[0].stmts[0].expr.first.expr.first.rvalue.path[0].var_name.lexeme == "a")
    console.assert(p.fun_defs[0].stmts[0].expr.first.expr.op.lexeme == ">")
    console.assert(p.fun_defs[0].stmts[0].expr.first.expr.rest.first.rvalue.value.lexeme == "10")
    console.assert(p.fun_defs[0].stmts[0].expr.op == undefined)
    console.assert(p.fun_defs[0].stmts[0].expr.rest == undefined)

});

test("test_complex_expr_with_multiple_paths", () => {
    const in_stream = `
        function int main() {
            bool y = a.b[2 + 3].c;
        }
    `

    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    const stmt = p.fun_defs[0].stmts[0]

    console.assert(stmt.expr.first.rvalue.path[0].var_name.lexeme == "a")
    console.assert(stmt.expr.first.rvalue.path[1].var_name.lexeme == "b")

    console.assert(stmt.expr.first.rvalue.path[1].array_expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.path[1].array_expr.first.rvalue.value.lexeme == "2")
    console.assert(stmt.expr.first.rvalue.path[1].array_expr.op.lexeme == "+")

    console.assert(stmt.expr.first.rvalue.path[1].array_expr.rest.not_op == false)
    console.assert(stmt.expr.first.rvalue.path[1].array_expr.rest.first.rvalue.value.lexeme == "3")
    console.assert(stmt.expr.first.rvalue.path[1].array_expr.rest.op == undefined)
    console.assert(stmt.expr.first.rvalue.path[1].array_expr.rest.rest == undefined)

    console.assert(stmt.expr.first.rvalue.path[2].var_name.lexeme == "c")

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

    console.assert(len(p.fun_defs[0].stmts) == 1)
    console.assert(len(whileStmt.stmts) == 1)

    console.assert(whileStmt.condition.not_op == true)
    console.assert(whileStmt.condition.first.rvalue.path[0].var_name.lexeme == "a")
    console.assert(whileStmt.condition.op.lexeme == ">")
    console.assert(whileStmt.condition.rest.first.rvalue.path[0].var_name.lexeme == "b")
    console.assert(whileStmt.condition.rest.first.rvalue.path[0].var_name.lexeme == "b")

    console.assert(stmt.var_def.data_type.is_array == false)
    console.assert(stmt.var_def.data_type.type_name.lexeme == "int")
    console.assert(stmt.var_def.var_name.lexeme == "c")

    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.type_name.lexeme == "bool")
    console.assert(stmt.expr.first.rvalue.array_expr.first.rvalue.value.lexeme == "2")
    console.assert(stmt.expr.op.lexeme == "*")
    console.assert(stmt.expr.rest.first.rvalue.value.lexeme == "3")

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

    console.assert(len(p.fun_defs[0].stmts) == 1)
    console.assert(len(ifStmt.stmts) == 1)

    console.assert(ifStmt.condition.not_op == true)
    console.assert(ifStmt.condition.first.rvalue.path[0].var_name.lexeme == "a")
    console.assert(ifStmt.condition.op.lexeme == ">")
    console.assert(ifStmt.condition.rest.first.rvalue.path[0].var_name.lexeme == "b")
    console.assert(ifStmt.condition.rest.first.rvalue.path[0].var_name.lexeme == "b")

    console.assert(elseIfStmt.condition.not_op == true)
    console.assert(elseIfStmt.condition.first.rvalue.path[0].var_name.lexeme == "a")
    console.assert(elseIfStmt.condition.op.lexeme == ">")
    console.assert(elseIfStmt.condition.rest.first.rvalue.path[0].var_name.lexeme == "b")
    console.assert(elseIfStmt.condition.rest.first.rvalue.path[0].var_name.lexeme == "b")

    console.assert(stmt.var_def.data_type.is_array == false)
    console.assert(stmt.var_def.data_type.type_name.lexeme == "int")
    console.assert(stmt.var_def.var_name.lexeme == "c")

    console.assert(stmt.expr.not_op == false)
    console.assert(stmt.expr.first.rvalue.type_name.lexeme == "bool")
    console.assert(stmt.expr.first.rvalue.array_expr.first.rvalue.value.lexeme == "2")
    console.assert(stmt.expr.op.lexeme == "*")
    console.assert(stmt.expr.rest.first.rvalue.value.lexeme == "3")

});
test("test_structs_and_funcs", () => {
    const in_stream = `
        struct S {int x;}
        function void main() { 
          array int a = 10;
        } 
    `
    const p = new ASTParser(new Lexer(new StringBuffer(in_stream)), undefined, false).parse();

    console.assert(len(p.fun_defs) == 1)
    console.assert(len(p.struct_defs) == 1)
    console.assert(len(p.struct_defs[0].fields) == 1)
    console.assert(len(p.fun_defs[0].stmts) == 1)

    console.assert(p.struct_defs[0].struct_name.lexeme == 'S')
    console.assert(p.struct_defs[0].fields[0].data_type.is_array == false)
    console.assert(p.struct_defs[0].fields[0].data_type.type_name.lexeme == 'int')
    console.assert(p.struct_defs[0].fields[0].var_name.lexeme == 'x')

    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.is_array == true)
    console.assert(p.fun_defs[0].stmts[0].var_def.data_type.type_name.lexeme == "int")
    console.assert(p.fun_defs[0].stmts[0].var_def.var_name.lexeme == "a")
    console.assert(p.fun_defs[0].stmts[0].expr.first.rvalue.value.lexeme == "10")
});