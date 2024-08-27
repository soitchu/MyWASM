import { AVLNode, deleteAVLNode, findNodeWithValue, insertAVLNode, printTree } from './AVL';
import { LinkedList } from './LinkedList';

export class MemoryManager {
    availOffsets = new Map<number, number>();
    globalOffset = 4;
    DEBUG = false;
    trace = "";
    root: AVLNode | null = null;

    addNode(size: number, value: LinkedList) {
        this.root = insertAVLNode(this.root, size, value);
    }

    deleteNode(size: number) {
        this.root = deleteAVLNode(this.root, size);
    }

    increaseGlobalOffset(size: number) {
        if(this.DEBUG) this.trace += `avl.increaseGlobalOffset(${size})\n`;
        this.globalOffset += size;
    }

    error(message: string): never {
        // console.log(this.trace);
        throw new Error(message);
    }

    add(size: number, offset: number): void {
        if(this.DEBUG) this.trace += `avl.add(${size}, ${offset})\n`;

        let startOffset = offset;
        let endOffset = offset + size - 1;


        // console.log("hereee", this.availOffsets.has(startOffset - 1), this.availOffsets.has(endOffset + 1));
        // console.log("here2", startOffset, endOffset);
        // this.availOffsets.print();
        const availStart = this.availOffsets.get(startOffset - 1);
        const availEnd = this.availOffsets.get(endOffset + 1);

        if (availStart) {
            const availStartOffset = availStart as number;
            const availEndOffset = startOffset - 1;
            const availSize = availEndOffset - availStartOffset + 1;

            this.availOffsets.delete(availStartOffset);
            this.availOffsets.delete(availEndOffset);
            
            const availSizeNode = findNodeWithValue(this.root, availSize);

            if(!availSizeNode) this.error("(2) availOffsets and free_mem are out of sync");

            const sizeQueue: LinkedList = availSizeNode.value;
            
            sizeQueue.deleteElementWithValue(availStartOffset);

            if(sizeQueue.length === 0) {
                this.deleteNode(availSize);
            }

            startOffset = availStartOffset;

        } 
        
        if (availEnd) {
            const availEndOffset = availEnd as number;
            const availStartOffset = endOffset + 1;
            const availSize = availEndOffset - availStartOffset + 1;
            
            // console.log(.)
            // console.log("tree: ");
            // this.availOffsets.print();

            this.availOffsets.delete(availStartOffset);
            this.availOffsets.delete(availEndOffset);

            // this.availOffsets.print();
            // console.log(Array.from(this.availOffsets.keys()));
            // console.log(Array.from(this.availOffsets.values()));


            const availSizeNode = findNodeWithValue(this.root, availSize);

            // console.log("availSize", availStartOffset, availEndOffset, availSize);
            // console.log("current", startOffset, endOffset, size);
            // console.log(this.print())

            if(availSizeNode == null) this.error("(1) availOffsets and free_mem are out of sync");

            const sizeQueue: LinkedList = availSizeNode.value;
            
            sizeQueue.deleteElementWithValue(availStartOffset);

            if(sizeQueue.length === 0) {
                this.deleteNode(availSize);
            }

            // console.log(availStartOffset, availEndOffset, startOffset, endOffset, "=================-----==");

            endOffset = availEndOffset;
        } 

        size = endOffset - startOffset + 1;

        
        if ((endOffset + 1) === this.globalOffset) {
            // console.log("global")
            // If the freed memory is next to the global offset
            // then all we need to do is move the global
            // offset. We don't need to do anything with availOffsets
            // since we haven't added anything to it
            this.globalOffset = this.globalOffset - size;
            return;
            // startOffset = 4;
            // endOffset = 4 + size - 1;
        }


  
        this.availOffsets.set(startOffset, endOffset);
        this.availOffsets.set(endOffset, startOffset);

        // console.log("====");
        // this.availOffsets.print();
        // console.log(Array.from(this.availOffsets.keys()));
        // console.log(Array.from(this.availOffsets.values()));
        // console.log("====");

        const node = findNodeWithValue(this.root, size);

        if (node) {
            node.value.push(startOffset);
            return;
        } else {
            this.addNode(size, new LinkedList(startOffset));
            return;
            // return super.add(size, new Queue([startOffset]));
        }
    }

    deleteOffset(offset: number, size: number) {

    }

    getOffset(requestedSize: number): number | undefined {
        if(this.DEBUG) this.trace += `avl.getOffset(${requestedSize})\n`;

        const node = this.findClosestLargestValue(requestedSize);

        // TODO make it so the value isn't disproportionately
        // larger than the requested value
        if (node) {
            const valueQueue = node.value;
            const size = node.key;
            const offset = valueQueue.deleteHead() as number;

            if (valueQueue.length == 0) {
                this.deleteNode(size);
            }

            this.availOffsets.delete(offset);
            this.availOffsets.delete(offset + size - 1);

            if(size !== requestedSize) {
                const remainingBytes = size - requestedSize;
                // console.log(`Did not get the exact requested size. Splicing and adding the remaining ${remainingBytes} bits back at offset ${offset + requestedSize}`);
                this.add(remainingBytes, offset + requestedSize);
            }

            return offset;
        } else {
            return undefined;
        }
    }

    findClosestLargestValue(value: number): AVLNode | null {
        if (!this.root) return null;

        let current: AVLNode | null = this.root;
        let found = false;
        let lastNode: AVLNode | null = null;

        while (current && !found) {
            if (value < current.key) {
                lastNode = current;
                current = current.left;
            } else if (value > current.key) {
                current = current.right;
            } else {
                lastNode = current;
                found = true;
            }
        }

        if (!lastNode) return null;

        return lastNode;
    }
}

// let start = performance.now();
// for(let i = 0; i < 10000000; i++){
//     avl.add(i);
// }

// console.log(performance.now() - start);


// start = performance.now();
// let optimizedAVL: AVLNode | null = null;

// for(let i = 0; i < 10000000; i++){
//     optimizedAVL = insertAVLNode(optimizedAVL, i);
// }

// console.log(performance.now() - start);

// const avl = new MemoryManager();

// avl.add(4, 16);
// avl.add(20, 20);

// // avl.print();

// avl.getOffset(16)
// avl.increaseGlobalOffset(16)
// avl.getOffset(12)
// avl.increaseGlobalOffset(12)
// avl.getOffset(16)
// avl.increaseGlobalOffset(16)
// avl.getOffset(12)
// avl.increaseGlobalOffset(12)
// avl.getOffset(28)
// avl.increaseGlobalOffset(28)
// avl.getOffset(36)
// avl.increaseGlobalOffset(36)

// avl.add(28, 60)
// avl.getOffset(48)
// avl.increaseGlobalOffset(48)
// avl.add(16, 32)
// avl.add(36, 88)
// avl.getOffset(48)
// avl.add(44, 80)
// avl.getOffset(4)
// avl.add(40, 84)
// avl.getOffset(48)
// avl.increaseGlobalOffset(48)
// avl.add(48, 32)

// console.log(printTree(avl.root, "", false));