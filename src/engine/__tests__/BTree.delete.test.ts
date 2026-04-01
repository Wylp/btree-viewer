import { describe, it, expect, beforeEach } from 'vitest';
import { BTree } from '../BTree';
import { resetIdCounter } from '../BTreeNode';

describe('BTree.delete', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  function buildTree(keys: number[], order = 3): BTree {
    const tree = new BTree(order);
    for (const k of keys) tree.insert(k);
    return tree;
  }

  function getAllKeys(node: import('../types').BTreeNode): number[] {
    const result = [...node.keys];
    for (const child of node.children) {
      result.push(...getAllKeys(child));
    }
    return result.sort((a, b) => a - b);
  }

  it('deletes key from leaf (simple case)', () => {
    const tree = buildTree([10, 20]);
    tree.delete(10);
    expect(tree.root!.keys).toEqual([20]);
  });

  it('deletes key that does not exist', () => {
    const tree = buildTree([10, 20]);
    const steps = tree.delete(99);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.type).toBe('not-found');
    expect(tree.root!.keys).toEqual([10, 20]);
  });

  it('deletes from internal node (replace with predecessor)', () => {
    const tree = buildTree([10, 20, 30]);
    tree.delete(20);
    const keys = getAllKeys(tree.root!);
    expect(keys).toEqual([10, 30]);
    expect(keys).not.toContain(20);
  });

  it('deletes causing merge (borrow from sibling)', () => {
    const tree = buildTree([10, 20, 30, 40, 50]);
    tree.delete(10);
    const keys = getAllKeys(tree.root!);
    expect(keys).toEqual([20, 30, 40, 50]);
  });

  it('deletes all keys one by one', () => {
    const tree = buildTree([5, 10, 15, 20, 25]);
    for (const k of [5, 10, 15, 20, 25]) {
      tree.delete(k);
    }
    expect(tree.root === null || tree.root.keys.length === 0).toBe(true);
  });

  it('generates steps with descriptions for each phase', () => {
    const tree = buildTree([10, 20, 30]);
    const steps = tree.delete(20);
    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) {
      expect(step.description).toBeTruthy();
      expect(step.treeSnapshot).toBeDefined();
    }
  });

  it('handles delete in order=5 tree', () => {
    const tree = buildTree([10, 20, 30, 40, 50, 60, 70], 5);
    tree.delete(40);
    const keys = getAllKeys(tree.root!);
    expect(keys).toEqual([10, 20, 30, 50, 60, 70]);
  });
});
