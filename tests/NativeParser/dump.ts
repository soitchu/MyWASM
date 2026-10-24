// Prints the TS parser's AST in the same format as Compiler-WASM/AstDump.mypl
import * as ast from "../../Compiler/types";

function bool(value: boolean) {
  return value ? "1" : "0";
}

function token(t: ast.Token | undefined) {
  // EMPTY_TOKEN in the parser has every field undefined
  if (t === undefined || t.lexeme === undefined) {
    return "_";
  }

  return `"${t.lexeme}"@${t.line}:${t.column}`;
}

function dataType(d: ast.DataType) {
  return `(type ${bool(d.is_array)} ${token(d.namespace)} ${token(d.type_name)})`;
}

function varDef(v: ast.VarDef) {
  return `(vardef ${dataType(v.data_type)} ${token(v.var_name)})`;
}

function list<T>(items: T[], f: (item: T) => string) {
  return `(${items.map(f).join(" ")})`;
}

function exprOrNone(e: ast.Expr | undefined) {
  return e === undefined ? "_" : expr(e);
}

function expr(e: ast.Expr): string {
  return `(expr ${bool(e.not_op)} ${term(e.first)} ${token(e.op)} ${exprOrNone(e.rest)})`;
}

function term(t: ast.ExprTerm): string {
  if (t instanceof ast.SimpleTerm) {
    return `(simple ${rvalue(t.rvalue)})`;
  }

  return `(complex ${expr((t as ast.ComplexTerm).expr)})`;
}

function rvalue(r: ast.RValue): string {
  if (r instanceof ast.SimpleRValue) {
    return `(lit ${token(r.value)})`;
  }

  if (r instanceof ast.NewRValue) {
    const params = r.struct_params === undefined ? "_" : list(r.struct_params, expr);
    return `(new ${token(r.namespace)} ${token(r.type_name)} ${exprOrNone(r.array_expr)} ${params})`;
  }

  if (r instanceof ast.VarRValue) {
    return varRValue(r);
  }

  return callExpr(r as unknown as ast.CallExpr);
}

function varRefs(path: ast.VarRef[]) {
  return list(path, (ref) => `(ref ${token(ref.var_name)} ${exprOrNone(ref.array_expr)})`);
}

function varRValue(v: ast.VarRValue) {
  return `(var ${varRefs(v.path)})`;
}

function callExpr(c: ast.CallExpr) {
  return `(call ${bool(c.is_stmt)} ${token(c.namespace)} ${token(c.fun_name)} ${list(c.args, expr)})`;
}

function varDecl(v: ast.VarDecl) {
  return `(vardecl ${varDef(v.var_def)} ${exprOrNone(v.expr)})`;
}

function assignStmt(a: ast.AssignStmt) {
  return `(assign ${varRefs(a.lvalue)} ${expr(a.expr)})`;
}

function indent(depth: number) {
  return "  ".repeat(depth);
}

function stmts(list: ast.Stmt[], depth: number) {
  return list.map((s) => stmt(s, depth)).join("");
}

function basicIf(b: ast.BasicIf, depth: number) {
  return (
    `${indent(depth)}(branch ${expr(b.condition)}\n` +
    stmts(b.stmts, depth + 1) +
    `${indent(depth)})\n`
  );
}

function stmt(s: ast.Stmt, depth: number): string {
  const pad = indent(depth);

  if (s instanceof ast.VarDecl) {
    return `${pad}${varDecl(s)}\n`;
  }

  if (s instanceof ast.AssignStmt) {
    return `${pad}${assignStmt(s)}\n`;
  }

  if (s instanceof ast.ReturnStmt) {
    return `${pad}(return ${expr(s.expr)})\n`;
  }

  if (s instanceof ast.DeleteStmt) {
    return `${pad}(delete ${varRValue(s.var_rvalue)})\n`;
  }

  if (s instanceof ast.CallExpr) {
    return `${pad}${callExpr(s)}\n`;
  }

  if (s instanceof ast.WhileStmt) {
    return `${pad}(while ${expr(s.condition)}\n` + stmts(s.stmts, depth + 1) + `${pad})\n`;
  }

  if (s instanceof ast.ForStmt) {
    return (
      `${pad}(for ${varDecl(s.var_decl)} ${expr(s.condition)} ${assignStmt(s.assign_stmt)}\n` +
      stmts(s.stmts, depth + 1) +
      `${pad})\n`
    );
  }

  const i = s as ast.IfStmt;

  return (
    `${pad}(if\n` +
    basicIf(i.if_part, depth + 1) +
    i.else_ifs.map((b) => basicIf(b, depth + 1)).join("") +
    `${indent(depth + 1)}(else\n` +
    stmts(i.else_stmts, depth + 2) +
    `${indent(depth + 1)})\n` +
    `${pad})\n`
  );
}

export function dumpProgram(program: ast.Program) {
  let output = "";

  for (const imp of program.imports) {
    output += `(import "${imp.file_name}" "${imp.namespace}")\n`;
  }

  for (const s of program.struct_defs) {
    output += `(struct ${token(s.struct_name)} ${list(s.fields, varDef)})\n`;
  }

  for (const v of program.vdecl_stmts) {
    output += `(global ${varDecl(v)})\n`;
  }

  for (const f of program.fun_defs) {
    output +=
      `(fun ${bool(f.shouldExport)} "${f.original_name}" ${dataType(f.return_type)} ` +
      `${token(f.fun_name)} ${list(f.params, varDef)}\n` +
      stmts(f.stmts, 1) +
      ")\n";
  }

  return output;
}
