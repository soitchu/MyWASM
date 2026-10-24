build:
	bun build index.ts --compile --outfile mywasm

build-extension:
	cp Compiler ./mypl-vscode-extension/server/src -r
	
install:
	bun install
	bun postinstall.ts
# The C memory manager the runtime uses through bun:ffi
build-memory-manager:
	make -C Runtime-C memory