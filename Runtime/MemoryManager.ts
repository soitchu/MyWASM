import {
    AVLTree, AVLTreeNode, Queue
} from 'data-structure-typed';

export class MemoryManager extends AVLTree {
    availOffsets = new AVLTree();
    globalOffset = 4;
    DEBUG = false;
    trace = "";
    
    increaseGlobalOffset(size: number) {
        if(this.DEBUG) this.trace += `avl.increaseGlobalOffset(${size})\n`;
        this.globalOffset += size;
    }

    error(message: string) {
        // console.log(this.trace);
        throw new Error(message);
    }

    add(size: number, offset: number): boolean {
        if(this.DEBUG) this.trace += `avl.add(${size}, ${offset})\n`;

        let startOffset = offset;
        let endOffset = offset + size - 1;


        // console.log("hereee", this.availOffsets.has(startOffset - 1), this.availOffsets.has(endOffset + 1));
        // console.log("here2", startOffset, endOffset);
        // this.availOffsets.print();

        if (this.availOffsets.has(startOffset - 1)) {
            const availStartOffset = this.availOffsets.get(startOffset - 1);
            const availEndOffset = startOffset - 1;
            const availSize = availEndOffset - availStartOffset + 1;

            this.availOffsets.delete(availStartOffset);
            this.availOffsets.delete(availEndOffset);
            
            const availSizeNode = this.getNode(availSize);

            if(!availSizeNode) this.error("(2) availOffsets and free_mem are out of sync");

            const sizeQueue: Queue = availSizeNode?.value;
            
            sizeQueue.delete(availStartOffset);

            if(sizeQueue.size === 0) {
                super.delete(availSize);
            }

            startOffset = availStartOffset;

        } 
        
        if (this.availOffsets.has(endOffset + 1)) {
            const availEndOffset = this.availOffsets.get(endOffset + 1);
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


            const availSizeNode = this.getNode(availSize);

            // console.log("availSize", availStartOffset, availEndOffset, availSize);
            // console.log("current", startOffset, endOffset, size);
            // console.log(this.print())

            if(!availSizeNode) this.error("(1) availOffsets and free_mem are out of sync");

            const sizeQueue: Queue = availSizeNode?.value;
            
            sizeQueue.delete(availStartOffset);

            if(sizeQueue.size === 0) {
                super.delete(availSize);
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
            return true;
            // startOffset = 4;
            // endOffset = 4 + size - 1;
        }


  
        this.availOffsets.add(startOffset, endOffset);
        this.availOffsets.add(endOffset, startOffset);

        // console.log("====");
        // this.availOffsets.print();
        // console.log(Array.from(this.availOffsets.keys()));
        // console.log(Array.from(this.availOffsets.values()));
        // console.log("====");

        const node = super.getNode(size);

        if (node) {
            (node.value as Queue).push(startOffset);
            return true;
        } else {
            return super.add(size, new Queue([startOffset]));
        }
    }

    deleteOffset(offset: number, size: number) {

    }

    getOffset(requestedSize: number): [number, number] | undefined {
        if(this.DEBUG) this.trace += `avl.getOffset(${requestedSize})\n`;

        const node = this.findClosestLargestValue(requestedSize);

        // TODO make it so the value isn't disproportionately
        // larger than the requested value
        if (node) {
            const valueQueue = node.value as Queue;
            const size = node.key;
            const offset = valueQueue.shift();

            if (valueQueue.size == 0) {
                super.delete(size);
            }

            this.availOffsets.delete(offset);
            this.availOffsets.delete(offset + size - 1);

            if(size !== requestedSize) {
                const remainingBytes = size - requestedSize;
                // console.log(`Did not get the exact requested size. Splicing and adding the remaining ${remainingBytes} bits back at offset ${offset + requestedSize}`);
                this.add(remainingBytes, offset + requestedSize);
            }

            return [offset, requestedSize];
        } else {
            return undefined;
        }
    }

    findClosestLargestValue(value: number): AVLTreeNode | undefined {
        if (!this.root) return undefined;

        let current: AVLTreeNode | undefined = this.root;
        let found = false;
        let lastNode: AVLTreeNode | undefined = undefined;

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

        if (!lastNode) return undefined;

        return lastNode;
    }
}

// const avl = new ModifiedAVLTree();
// avl.add(4, 16);
// avl.add(20, 20);

// avl.print();

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