import { LinkedList } from "./LinkedList";

export class AVLNode {
    key: number;
    value: LinkedList;
    left: AVLNode | null;
    right: AVLNode | null;
    height: number;

    constructor(key: number, value: LinkedList, left: AVLNode | null = null, right: AVLNode | null = null, height: number = 1) {
        this.key = key;
        this.left = left;
        this.right = right;
        this.height = height;
        this.value = value;
    }
}

function height(N: AVLNode | null): number {
    if (N === null) {
        return 0;
    }

    return N.height;
}

function max(a: number, b: number): number {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}

// New node creation
// function newAVLNode(key: number): AVLNode {
//     return new AVLNode(key);
// }

// Rotate right
function rightRotate(y: AVLNode): AVLNode {
    const x = y.left!;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    y.height = max(height(y.left), height(y.right)) + 1;
    x.height = max(height(x.left), height(x.right)) + 1;
    return x;
}

// Rotate left
function leftRotate(x: AVLNode): AVLNode {
    const y = x.right!;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    x.height = max(height(x.left), height(x.right)) + 1;
    y.height = max(height(y.left), height(y.right)) + 1;
    return y;
}

// Get the balance factor of each node
function getBalanceFactor(N: AVLNode | null): number {
    if (N === null) {
        return 0;
    }

    return height(N.left) - height(N.right);
}

// Insert a node
export function insertAVLNode(node: AVLNode | null, key: number, value: LinkedList): AVLNode {
    // Find the correct postion and insert the node
    if (node === null) {
        return new AVLNode(key, value);
    }

    if (key < node.key) {
        node.left = insertAVLNode(node.left, key, value);
    } else if (key > node.key) {
        node.right = insertAVLNode(node.right, key, value);
    } else {
        return node;
    }

    // Update the balance factor of each node and
    // balance the tree
    node.height = 1 + max(height(node.left), height(node.right));
    const balanceFactor = getBalanceFactor(node);

    if (balanceFactor > 1) {
        if (key < node.left!.key) {
            return rightRotate(node);
        } else if (key > node.left!.key) {
            node.left = leftRotate(node.left!);
            return rightRotate(node);
        }
    }
    if (balanceFactor < -1) {
        if (key > node.right!.key) {
            return leftRotate(node);
        } else if (key < node.right!.key) {
            node.right = rightRotate(node.right!);
            return leftRotate(node);
        }
    }

    return node;
}

// AVLNode with minimum value
function nodeWithMimumValue(node: AVLNode): AVLNode {
    let current = node;

    while (current.left !== null) {
        current = current.left;
    }

    return current;
}


export function deleteAVLNode(root: AVLNode | null, key: number): AVLNode | null {
    if (!root) return root;

    if (key < root.key) {
        root.left = deleteAVLNode(root.left, key);
    } else if (key > root.key) {
        root.right = deleteAVLNode(root.right, key);
    } else {
        if (!root.left || !root.right) {
            const temp = root.left || root.right;

            if (!temp) {
                root = null;
            } else {
                root = temp;
            }

        } else {
            const temp = nodeWithMinimumValue(root.right);
            root.key = temp.key;
            root.right = deleteAVLNode(root.right, temp.key);
        }
    }

    if (!root) return root;

    root.height = 1 + Math.max(height(root.left), height(root.right));

    const balanceFactor = getBalanceFactor(root);

    if (balanceFactor > 1) {
        if (getBalanceFactor(root.left) >= 0) {
            return rightRotate(root);
        } else {
            root.left = leftRotate(root.left!);
            return rightRotate(root);
        }
    }

    if (balanceFactor < -1) {
        if (getBalanceFactor(root.right) <= 0) {
            return leftRotate(root);
        } else {
            root.right = rightRotate(root.right!);
            return leftRotate(root);
        }
    }

    return root;
}

function nodeWithMinimumValue(root: AVLNode): AVLNode {
    let current = root;
    while (current.left) {
        current = current.left;
    }
    return current;
}

export function printTree(root: AVLNode | null, indent: string, last: boolean): void {
    if (root) {
        process.stdout.write(indent);
        if (last) {
            process.stdout.write('R----');
            indent += '   ';
        } else {
            process.stdout.write('L----');
            indent += '|  ';
        }

        process.stdout.write(root.key.toString() + "\n");
        printTree(root.left, indent, false);
        printTree(root.right, indent, true);
    }
}

export function findNodeWithValue(root: AVLNode | null, value: number) {
    if (root === null) return null;

    let current: AVLNode | null = root;
    let lastNode: AVLNode | null = null;
    let found = false;
    
    while (current && !found) {
        if (value < current.key) {
            lastNode = current;
            current = current.left;
        } else if (value > current.key) {
            current = current.right;
        } else {
            return current;
        }
    }

    return null;
    
}


let root: AVLNode | null = null;
const start = performance.now();
for(let i = 0; i < 100000; i++) {
    root = insertAVLNode(root, i, new LinkedList(1));
}



// console.log(findNodeWithValue(root, -102));

// console.log(performance.now() - start);