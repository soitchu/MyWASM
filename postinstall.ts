import { copyFileSync } from "fs";
import path from "path";

copyFileSync(
    path.join(__dirname, "./Compiler/patches/binaryen.js"),
    path.join(__dirname, "./node_modules/binaryen/index.js")
);


copyFileSync(
    path.join(__dirname, "./Compiler/patches/wabt.js"),
    path.join(__dirname, "./node_modules/wabt/index.js")
);