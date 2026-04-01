import type { BTreeNode, Step, StepType } from './types';
import { createNode, cloneTree } from './BTreeNode';

export class BTree {
  order: number;
  root: BTreeNode | null = null;

  constructor(order: number) {
    this.order = order;
  }

  maxKeys(): number {
    return this.order - 1;
  }

  private step(
    type: StepType,
    nodeId: string,
    key: number,
    description: string
  ): Step {
    return {
      type,
      nodeId,
      key,
      description,
      treeSnapshot: this.root ? cloneTree(this.root) : createNode(true),
    };
  }

  insert(key: number): Step[] {
    const steps: Step[] = [];

    if (this.root === null) {
      this.root = createNode(true);
      this.root.keys.push(key);
      steps.push(
        this.step('insert', this.root.id, key, `Árvore vazia. Inserindo ${key} na raiz.`)
      );
      return steps;
    }

    // Check for duplicate
    if (this.containsKey(this.root, key)) {
      steps.push(
        this.step('found', this.root.id, key, `Chave ${key} já existe na árvore. Inserção ignorada.`)
      );
      return steps;
    }

    // If root is full, split it
    if (this.root.keys.length === this.maxKeys()) {
      const oldRoot = this.root;
      const newRoot = createNode(false);
      newRoot.children.push(oldRoot);
      this.root = newRoot;
      this.splitChild(newRoot, 0, steps, key);
    }

    this.insertNonFull(this.root, key, steps);
    return steps;
  }

  containsKey(node: BTreeNode, key: number): boolean {
    for (const k of node.keys) {
      if (k === key) return true;
    }
    if (node.isLeaf) return false;
    for (const child of node.children) {
      if (this.containsKey(child, key)) return true;
    }
    return false;
  }

  insertNonFull(node: BTreeNode, key: number, steps: Step[]): void {
    if (node.isLeaf) {
      // Insert in sorted position
      let i = node.keys.length - 1;
      while (i >= 0 && node.keys[i] > key) {
        i--;
      }
      node.keys.splice(i + 1, 0, key);
      steps.push(
        this.step('insert', node.id, key, `Inserindo ${key} na folha.`)
      );
      return;
    }

    // Find correct child index
    let i = node.keys.length - 1;
    while (i >= 0 && node.keys[i] > key) {
      i--;
    }
    i++; // child index

    steps.push(
      this.step('descend', node.id, key, `Descendo para o filho ${i} em busca da posição de ${key}.`)
    );

    const child = node.children[i];

    if (child.keys.length === this.maxKeys()) {
      this.splitChild(node, i, steps, key);
      // After split, determine which of the two children to descend into
      if (node.keys[i] < key) {
        this.insertNonFull(node.children[i + 1], key, steps);
      } else {
        this.insertNonFull(node.children[i], key, steps);
      }
    } else {
      this.insertNonFull(child, key, steps);
    }
  }

  splitChild(parent: BTreeNode, index: number, steps: Step[], triggerKey: number): void {
    const fullChild = parent.children[index];
    const midIndex = Math.floor(this.maxKeys() / 2);
    const midKey = fullChild.keys[midIndex];

    const rightNode = createNode(fullChild.isLeaf);
    rightNode.keys = fullChild.keys.splice(midIndex + 1);
    fullChild.keys.splice(midIndex, 1); // remove midKey from child

    if (!fullChild.isLeaf) {
      rightNode.children = fullChild.children.splice(midIndex + 1);
    }

    // Insert midKey into parent at position index
    parent.keys.splice(index, 0, midKey);
    // Insert rightNode into parent's children at position index + 1
    parent.children.splice(index + 1, 0, rightNode);

    steps.push(
      this.step(
        'split',
        fullChild.id,
        triggerKey,
        `Nó cheio dividido. Chave ${midKey} promovida ao nó pai.`
      )
    );
    steps.push(
      this.step(
        'promote',
        parent.id,
        midKey,
        `Chave ${midKey} promovida ao pai após divisão.`
      )
    );
  }

  search(_key: number): Step[] {
    return [];
  }

  delete(_key: number): Step[] {
    return [];
  }

  bulkInsert(_keys: number[]): Step[] {
    return [];
  }
}
