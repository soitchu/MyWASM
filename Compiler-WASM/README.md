# Native compiler

A port of the MyWASM compiler (`Compiler/`) to MyPL, so the compiler can compile itself. It produces the same WAT as the TS compiler, byte for byte, including for its own source.

## Usage

```sh
bun Compiler-WASM/native.ts <input.mypl> <output.wat> [--unsafe-array]
```

This builds the native compiler with the TS compiler, runs it on the input, and writes the WAT. Compile errors are printed in the same format as the TS compiler's.

## Layout

| File | Port of |
| --- | --- |
| `Text.mypl` | Growable buffer of character codes, used instead of strings |
| `Token.mypl`, `Lexer.mypl` | `Compiler/Lexer.ts` |
| `Ast.mypl`, `Parser.mypl` | `Compiler/types.ts`, `Compiler/AST.ts` |
| `Map.mypl` | Ordered maps and `Compiler/SymbolTable.ts` |
| `Path.mypl` | Node's `path.join`, for imports |
| `Checker.mypl` | `Compiler/SemanticChecker.ts` and `Compiler/WasmHelper.ts` |
| `CoreWat.mypl`, `Builtins.mypl` | Generated from the TS compiler by `generate.ts` |
| `AstDump.mypl` | Prints the AST, for testing the parser |
| `drivers/` | The `main` function for each stage |

Importing the same file through two paths gives two copies of its types, so the files can't share types through imports. Instead, `build.ts` concatenates a stage's files into one program:

```sh
bun Compiler-WASM/build.ts <lex|parse|compile> <output.mypl>
```

After changing `Compiler/WasmHelper.ts` or the built-in functions in `Compiler/SemanticChecker.ts`, run `bun Compiler-WASM/generate.ts`.

## Input

A WASM program can only read stdin, a line at a time, so the compiler (`drivers/compile.mypl`) reads:

```
<1 for --unsafe-array, otherwise 0>
<path of the main file>
<number of files>
<path>
<number of lines>
<lines>
...
```

The first file is `inbuilt.mypl`, the second is the main file, and the rest are the files it imports, by the path the import resolves to. `native.ts` builds this.

## Tests

`tests/NativeLexer`, `tests/NativeParser` and `tests/NativeChecker` run each stage on every `.mypl` file in the repo and on edge and error cases, and compare its output with the TS compiler's: tokens, the AST and the WAT. `tests/NativeChecker` also checks that the native compiler compiles its own source to the same WAT.

## Differences from the TS compiler

The port keeps the TS compiler's behavior, including its quirks, so the output can be compared. The ones worth knowing about:

- `"1."` is accepted as a double, since the TS lexer's check for it (`lexeme[-1]`) never matches in JS.
- The scope counter in renamed variables is always `0`, since the TS parser reads `prefix[-1]`.
- The TS checker prints "Can't use a string literal in an expression" as a warning for some expressions. The native compiler doesn't, since stdout is its output.
