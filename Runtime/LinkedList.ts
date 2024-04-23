interface LinkedNode {
    next: LinkedNode | null;
    prev: LinkedNode | null;
    value: number;
}

export class LinkedList{
    length = 0;
    head: LinkedNode | null = null;
    tail: LinkedNode | null = null;
    
    constructor(iniValue: number) {
        this.head = null;
        this.tail = null;

        this.push(iniValue);
    }

    shift(value: number){
        let node = this.newNode(value);
        if(this.head == null){
            this.head = node;
            this.tail = node;
        }else{
            this.head.prev = node;
            node.next = this.head;
            this.head = node;
            
        }
        this.length++;
    }
    
    push(value: number){
        let node = this.newNode(value);
        if(this.head == null){
            this.head = node;
            this.tail = node;
        }else{
            // @ts-expect-error
            this.tail.next = node;
            node.prev = this.tail;
            this.tail = node;
        }

        this.length++;
        
        return node;
    }
    newNode(value: number, next = null, tail = null){
        return {
            value,
            next,
            prev: tail
        } as LinkedNode;
    }

    deleteHead(){

        if(this.length == 1){
            // @ts-expect-error
            const value = this.head.value;
            this.head = null;
            this.tail = null;
            this.length--;
            return value;
        }else if(this.head == null || this.head.next == null){
            return null;
        }else{
            const value = this.head.value;
            this.head = this.head.next;
            this.head.prev = null;
            this.length--;
            return value;
        }
    }

    deleteElementWithValue(value: number) {
        let current = this.head;

        while(current != null) {
            if(current.value === value) {
                this.removeElement(current);
                return;
            }

            current = current.next;
        }
    }

    removeElement(node: LinkedNode){
        if(node == this.head){
            this.deleteHead();
        }else if(node == this.tail){
            this.deleteTail();
        }else if(this.length >= 3){
            // @ts-expect-error
            node.prev.next = node.next;
            // @ts-expect-error
            node.next.prev = node.prev;
            this.length--;
        } 
    }

    // nodeAtIndex(index){
    //     let i = 0;
    //     let currentNode = this.head;
    //     while(i < index){
    //         currentNode = currentNode.next;
    //         i++;
    //     }
    //     return currentNode;
    // }
    // value(index){
    //     if(index >= this.length){
    //         return null;
    //     }
    //     return this.nodeAtIndex(index).value;
    // }
    // removeElementAtIndex(index){
    //     if(index >= this.length){
    //         return null;
    //     }
    //     let currentNode = this.nodeAtIndex(index);        
    //     this.removeElement(currentNode);
    // }


    deleteTail(){
        if(this.length == 1){
            this.tail = null;
            this.head = null;
            this.length--;

        }else if(this.tail == null || this.tail.prev == null){
            return;
        }else{
            this.tail = this.tail.prev;
            this.tail.next = null;
            this.length--;
        }
    }
}