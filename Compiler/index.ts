import { readFileSync } from "node:fs";
import { StringBuffer } from "./StringBuffer.ts";
import { Lexer } from "./Lexer.ts";
import { TokenType } from "./types.ts";
import { ASTParser } from "./AST.ts";
import { PrintVisitor } from "./Printer.ts";
import { SemanticChecker } from "./SemanticChecker.ts";

let start = performance.now();
const buffer = readFileSync("test.mypl", "utf-8");
const a = new StringBuffer(buffer);

const l = new Lexer(a);

const ast = new ASTParser(l);



const b = ast.parse();
const d = new SemanticChecker();
d.visit_program(b);



// console.log(b.fun_defs[0].stmts)
// console.log(JSON.stringify(b.fun_defs, null, 4));

