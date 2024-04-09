build:
	bun build index.ts --compile --outfile mywasm

build-extension:
	cp Compiler ./vscode-extension/server/src -r
	
install:
	bun install
	cp ./Compiler/patches/binaryen.js ./node_modules/binaryen/index.js
	cp ./Compiler/patches/wabt.js ./node_modules/wabt/index.js
