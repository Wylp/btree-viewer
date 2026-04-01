import type { BTreeNode } from './types';

let nextId = 0;

export function createNode(isLeaf: boolean): BTreeNode {
  return {
    id: `node-${nextId++}`,
    keys: [],
    children: [],
    isLeaf,
  };
}

export function cloneTree(node: BTreeNode): BTreeNode {
  return {
    id: node.id,
    keys: [...node.keys],
    children: node.children.map(cloneTree),
    isLeaf: node.isLeaf,
  };
}

export function resetIdCounter(): void {
  nextId = 0;
}
