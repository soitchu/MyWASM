build:
	bun build index.ts --compile --outfile mywasm

build-extension:
	cp Compiler ./mypl-vscode-extension/server/src -r
	
install:
	bun install
	bun postinstall.ts