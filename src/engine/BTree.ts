import type { BTreeNode, Step, StepType } from './types';
import { createNode, cloneTree } from './BTreeNode';

interface SplitResult {
  left: BTreeNode;
  right: BTreeNode;
  promotedKey: number;
}

export class BTree {
  order: number;
  root: BTreeNode | null = null;

  constructor(order: number) {
    this.order = order;
  }

  maxKeys(): number {
    return this.order - 1;
  }

  minKeys(): number {
    return Math.ceil(this.order / 2) - 1;
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

  // --- INSERT (bottom-up split, snapshots only when tree is consistent) ---

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

    if (this.containsKey(this.root, key)) {
      steps.push(
        this.step('found', this.root.id, key, `Chave ${key} já existe na árvore. Inserção ignorada.`)
      );
      return steps;
    }

    const result = this.insertIntoSubtree(this.root, key, steps);

    if (result) {
      const newRoot = createNode(false);
      newRoot.keys.push(result.promotedKey);
      newRoot.children.push(result.left, result.right);
      this.root = newRoot;
      steps.push(
        this.step('promote', newRoot.id, result.promotedKey,
          `Nova raiz criada com chave ${result.promotedKey} após divisão.`)
      );
    }

    return steps;
  }

  private insertIntoSubtree(node: BTreeNode, key: number, steps: Step[]): SplitResult | null {
    if (node.isLeaf) {
      let pos = 0;
      while (pos < node.keys.length && node.keys[pos] < key) pos++;
      node.keys.splice(pos, 0, key);

      // Snapshot: leaf might be overfull but tree is fully connected
      steps.push(
        this.step('insert', node.id, key, `Inserindo ${key} na folha.`)
      );

      if (node.keys.length > this.maxKeys()) {
        // Split mechanically — no snapshot here (tree will be disconnected)
        return this.splitNode(node);
      }
      return null;
    }

    let childIdx = 0;
    while (childIdx < node.keys.length && key > node.keys[childIdx]) childIdx++;

    // Snapshot: tree is valid, showing descent
    steps.push(
      this.step('descend', node.id, key,
        `Descendo para o filho ${childIdx} em busca da posição de ${key}.`)
    );

    const result = this.insertIntoSubtree(node.children[childIdx], key, steps);

    if (result) {
      // Incorporate split result — reconnects the tree
      node.keys.splice(childIdx, 0, result.promotedKey);
      node.children[childIdx] = result.left;
      node.children.splice(childIdx + 1, 0, result.right);

      // Snapshot: tree is fully connected (this node might be overfull)
      steps.push(
        this.step('split', result.left.id, key,
          `Nó cheio dividido. Chave ${result.promotedKey} promovida ao pai.`)
      );

      if (node.keys.length > this.maxKeys()) {
        // Split mechanically — no snapshot (tree will be disconnected)
        return this.splitNode(node);
      }
    }

    return null;
  }

  /** Mechanically splits an overfull node. Does NOT generate steps. */
  private splitNode(node: BTreeNode): SplitResult {
    const midIndex = Math.floor(node.keys.length / 2);
    const midKey = node.keys[midIndex];

    const rightNode = createNode(node.isLeaf);
    rightNode.keys = node.keys.splice(midIndex + 1);
    node.keys.splice(midIndex, 1);

    if (!node.isLeaf) {
      rightNode.children = node.children.splice(midIndex + 1);
    }

    return { left: node, right: rightNode, promotedKey: midKey };
  }

  // --- SEARCH ---

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

  // --- DELETE (reactive bottom-up fixup) ---

  delete(key: number): Step[] {
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

    this.deleteFromSubtree(this.root, key, steps);

    if (this.root.keys.length === 0) {
      if (this.root.children.length > 0) {
        this.root = this.root.children[0];
        steps.push(
          this.step('promote', this.root.id, key,
            `Raiz vazia removida. Filho promovido a nova raiz.`)
        );
      } else {
        this.root = null;
      }
    }

    return steps;
  }

  private deleteFromSubtree(node: BTreeNode, key: number, steps: Step[]): boolean {
    const idx = node.keys.indexOf(key);

    if (idx !== -1) {
      if (node.isLeaf) {
        node.keys.splice(idx, 1);
        steps.push(
          this.step('delete', node.id, key, `Chave ${key} removida da folha.`)
        );
        return node.keys.length < this.minKeys();
      } else {
        return this.deleteFromInternal(node, idx, key, steps);
      }
    }

    if (node.isLeaf) {
      steps.push(
        this.step('not-found', node.id, key, `Chave ${key} não encontrada na árvore.`)
      );
      return false;
    }

    let childIdx = 0;
    while (childIdx < node.keys.length && key > node.keys[childIdx]) {
      childIdx++;
    }

    steps.push(
      this.step('descend', node.id, key, `Descendo para o filho ${childIdx} para remover ${key}.`)
    );

    const underflow = this.deleteFromSubtree(node.children[childIdx], key, steps);
    if (underflow) {
      this.fixChild(node, childIdx, steps, key);
    }

    return node.keys.length < this.minKeys();
  }

  private deleteFromInternal(node: BTreeNode, idx: number, key: number, steps: Step[]): boolean {
    const pred = this.getPredecessor(node.children[idx]);
    node.keys[idx] = pred;
    steps.push(
      this.step('delete', node.id, key,
        `Chave ${key} substituída pelo predecessor ${pred} no nó interno.`)
    );

    const underflow = this.deleteFromSubtree(node.children[idx], pred, steps);
    if (underflow) {
      this.fixChild(node, idx, steps, key);
    }

    return node.keys.length < this.minKeys();
  }

  private getPredecessor(node: BTreeNode): number {
    let cur = node;
    while (!cur.isLeaf) {
      cur = cur.children[cur.children.length - 1];
    }
    return cur.keys[cur.keys.length - 1];
  }

  private fixChild(parent: BTreeNode, childIdx: number, steps: Step[], triggerKey: number): void {
    if (childIdx > 0 && parent.children[childIdx - 1].keys.length > this.minKeys()) {
      this.borrowFromPrev(parent, childIdx, steps, triggerKey);
    } else if (childIdx < parent.children.length - 1 && parent.children[childIdx + 1].keys.length > this.minKeys()) {
      this.borrowFromNext(parent, childIdx, steps, triggerKey);
    } else {
      if (childIdx < parent.children.length - 1) {
        this.mergeChildren(parent, childIdx, steps, triggerKey);
      } else {
        this.mergeChildren(parent, childIdx - 1, steps, triggerKey);
      }
    }
  }

  private borrowFromPrev(parent: BTreeNode, idx: number, steps: Step[], triggerKey: number): void {
    const child = parent.children[idx];
    const sibling = parent.children[idx - 1];

    child.keys.unshift(parent.keys[idx - 1]);
    if (!sibling.isLeaf) {
      child.children.unshift(sibling.children.pop()!);
    }

    parent.keys[idx - 1] = sibling.keys.pop()!;

    steps.push(
      this.step('borrow', child.id, triggerKey, `Chave emprestada do irmão esquerdo para o nó filho (rotação direita).`)
    );
  }

  private borrowFromNext(parent: BTreeNode, idx: number, steps: Step[], triggerKey: number): void {
    const child = parent.children[idx];
    const sibling = parent.children[idx + 1];

    child.keys.push(parent.keys[idx]);
    if (!sibling.isLeaf) {
      child.children.push(sibling.children.shift()!);
    }

    parent.keys[idx] = sibling.keys.shift()!;

    steps.push(
      this.step('borrow', child.id, triggerKey, `Chave emprestada do irmão direito para o nó filho (rotação esquerda).`)
    );
  }

  private mergeChildren(parent: BTreeNode, idx: number, steps: Step[], triggerKey: number): void {
    const leftChild = parent.children[idx];
    const rightChild = parent.children[idx + 1];
    const separatorKey = parent.keys[idx];

    leftChild.keys.push(separatorKey, ...rightChild.keys);
    if (!leftChild.isLeaf) {
      leftChild.children.push(...rightChild.children);
    }

    parent.keys.splice(idx, 1);
    parent.children.splice(idx + 1, 1);

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
