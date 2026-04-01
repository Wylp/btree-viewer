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

  search(key: number): Step[] {
    const steps: Step[] = [];

    if (this.root === null) {
      steps.push({
        type: 'not-found',
        nodeId: 'empty',
        key,
        description: `Árvore vazia. Chave ${key} não encontrada.`,
        treeSnapshot: createNode(true),
      });
      return steps;
    }

    this.searchNode(this.root, key, steps);
    return steps;
  }

  private searchNode(node: BTreeNode, key: number, steps: Step[]): void {
    steps.push(
      this.step('compare', node.id, key, `Comparando chave ${key} com as chaves do nó [${node.keys.join(', ')}].`)
    );

    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) {
      i++;
    }

    if (i < node.keys.length && key === node.keys[i]) {
      steps.push(
        this.step('found', node.id, key, `Chave ${key} encontrada no nó.`)
      );
      return;
    }

    if (node.isLeaf) {
      steps.push(
        this.step('not-found', node.id, key, `Chave ${key} não encontrada na árvore.`)
      );
      return;
    }

    steps.push(
      this.step('descend', node.id, key, `Descendo para o filho ${i} em busca de ${key}.`)
    );
    this.searchNode(node.children[i], key, steps);
  }

  delete(key: number): Step[] {
    const steps: Step[] = [];

    if (this.root === null) {
      const emptyNode = createNode(true);
      steps.push({
        type: 'not-found',
        nodeId: 'empty',
        key,
        description: `Árvore vazia. Chave ${key} não encontrada.`,
        treeSnapshot: emptyNode,
      });
      return steps;
    }

    this.deleteFromNode(this.root, key, steps);

    // Shrink tree if root is empty
    if (this.root.keys.length === 0) {
      if (this.root.children.length > 0) {
        this.root = this.root.children[0];
      } else {
        this.root = null;
      }
    }

    return steps;
  }

  private minKeys(): number {
    return Math.ceil(this.order / 2) - 1;
  }

  private deleteFromNode(node: BTreeNode, key: number, steps: Step[]): void {
    const idx = node.keys.indexOf(key);

    if (idx !== -1) {
      if (node.isLeaf) {
        // Case 1: key is in a leaf — just remove it
        node.keys.splice(idx, 1);
        steps.push(
          this.step('delete', node.id, key, `Chave ${key} removida da folha.`)
        );
      } else {
        // Case 2: key is in an internal node
        this.deleteFromInternal(node, idx, key, steps);
      }
      return;
    }

    // Case 3: key not found in this node
    if (node.isLeaf) {
      steps.push(
        this.step('not-found', node.id, key, `Chave ${key} não encontrada na árvore.`)
      );
      return;
    }

    // Find child index to descend into
    let childIdx = 0;
    while (childIdx < node.keys.length && key > node.keys[childIdx]) {
      childIdx++;
    }

    steps.push(
      this.step('descend', node.id, key, `Descendo para o filho ${childIdx} para remover ${key}.`)
    );

    // Ensure child has enough keys before descending
    if (node.children[childIdx].keys.length <= this.minKeys()) {
      this.fillChild(node, childIdx, steps, key);
      // After fillChild, the tree may have changed — re-find child index
      // since a merge may have reduced key count in node
      if (childIdx > node.keys.length) {
        childIdx = node.keys.length;
      }
    }

    this.deleteFromNode(node.children[childIdx], key, steps);
  }

  private deleteFromInternal(node: BTreeNode, idx: number, key: number, steps: Step[]): void {
    const minK = this.minKeys();
    const leftChild = node.children[idx];
    const rightChild = node.children[idx + 1];

    if (leftChild.keys.length > minK) {
      // Replace with in-order predecessor
      const pred = this.getPredecessor(leftChild);
      node.keys[idx] = pred;
      steps.push(
        this.step('delete', node.id, key, `Chave ${key} substituída pelo predecessor ${pred} no nó interno.`)
      );
      this.deleteFromNode(leftChild, pred, steps);
    } else if (rightChild.keys.length > minK) {
      // Replace with in-order successor
      const succ = this.getSuccessor(rightChild);
      node.keys[idx] = succ;
      steps.push(
        this.step('delete', node.id, key, `Chave ${key} substituída pelo sucessor ${succ} no nó interno.`)
      );
      this.deleteFromNode(rightChild, succ, steps);
    } else {
      // Merge left, separator, and right
      this.mergeChildren(node, idx, steps, key);
      this.deleteFromNode(node.children[idx], key, steps);
    }
  }

  private getPredecessor(node: BTreeNode): number {
    let cur = node;
    while (!cur.isLeaf) {
      cur = cur.children[cur.children.length - 1];
    }
    return cur.keys[cur.keys.length - 1];
  }

  private getSuccessor(node: BTreeNode): number {
    let cur = node;
    while (!cur.isLeaf) {
      cur = cur.children[0];
    }
    return cur.keys[0];
  }

  private fillChild(node: BTreeNode, idx: number, steps: Step[], triggerKey: number): void {
    const minK = this.minKeys();

    if (idx > 0 && node.children[idx - 1].keys.length > minK) {
      this.borrowFromPrev(node, idx, steps, triggerKey);
    } else if (idx < node.children.length - 1 && node.children[idx + 1].keys.length > minK) {
      this.borrowFromNext(node, idx, steps, triggerKey);
    } else {
      // Merge
      if (idx < node.children.length - 1) {
        this.mergeChildren(node, idx, steps, triggerKey);
      } else {
        this.mergeChildren(node, idx - 1, steps, triggerKey);
      }
    }
  }

  private borrowFromPrev(node: BTreeNode, idx: number, steps: Step[], triggerKey: number): void {
    const child = node.children[idx];
    const sibling = node.children[idx - 1];

    // Shift child keys/children to the right
    child.keys.unshift(node.keys[idx - 1]);
    if (!sibling.isLeaf) {
      child.children.unshift(sibling.children.pop()!);
    }

    // Move last key of sibling up to parent
    node.keys[idx - 1] = sibling.keys.pop()!;

    steps.push(
      this.step('borrow', child.id, triggerKey, `Chave emprestada do irmão esquerdo para o nó filho (rotação direita).`)
    );
  }

  private borrowFromNext(node: BTreeNode, idx: number, steps: Step[], triggerKey: number): void {
    const child = node.children[idx];
    const sibling = node.children[idx + 1];

    // Append parent key to child
    child.keys.push(node.keys[idx]);
    if (!sibling.isLeaf) {
      child.children.push(sibling.children.shift()!);
    }

    // Move first key of sibling up to parent
    node.keys[idx] = sibling.keys.shift()!;

    steps.push(
      this.step('borrow', child.id, triggerKey, `Chave emprestada do irmão direito para o nó filho (rotação esquerda).`)
    );
  }

  private mergeChildren(node: BTreeNode, idx: number, steps: Step[], triggerKey: number): void {
    const leftChild = node.children[idx];
    const rightChild = node.children[idx + 1];
    const separatorKey = node.keys[idx];

    // Merge: left ++ separator ++ right
    leftChild.keys.push(separatorKey, ...rightChild.keys);
    if (!leftChild.isLeaf) {
      leftChild.children.push(...rightChild.children);
    }

    // Remove separator from parent and right child pointer
    node.keys.splice(idx, 1);
    node.children.splice(idx + 1, 1);

    steps.push(
      this.step('merge', leftChild.id, triggerKey, `Nós mesclados com a chave separadora ${separatorKey} do pai.`)
    );
  }

  bulkInsert(keys: number[]): Step[] {
    const allSteps: Step[] = [];
    for (let i = 0; i < keys.length; i++) {
      if (i > 0) {
        allSteps.push({
          type: 'separator',
          nodeId: this.root?.id ?? '',
          key: keys[i],
          description: `Próxima inserção: ${keys[i]}`,
          treeSnapshot: this.root ? cloneTree(this.root) : createNode(true),
        });
      }
      const steps = this.insert(keys[i]);
      allSteps.push(...steps);
    }
    return allSteps;
  }
}
