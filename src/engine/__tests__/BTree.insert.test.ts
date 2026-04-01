import { describe, it, expect, beforeEach } from 'vitest';
import { BTree } from '../BTree';
import { resetIdCounter } from '../BTreeNode';

describe('BTree.insert', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('inserts into empty tree', () => {
    const tree = new BTree(3);
    const steps = tree.insert(10);
    expect(steps.length).toBeGreaterThan(0);
    expect(tree.root).not.toBeNull();
    expect(tree.root!.keys).toEqual([10]);
    expect(tree.root!.isLeaf).toBe(true);
  });

  it('inserts multiple keys in order', () => {
    const tree = new BTree(3);
    tree.insert(10);
    tree.insert(20);
    expect(tree.root!.keys).toEqual([10, 20]);
  });

  it('inserts key in sorted position', () => {
    const tree = new BTree(3);
    tree.insert(20);
    tree.insert(10);
    expect(tree.root!.keys).toEqual([10, 20]);
  });

  it('splits root when full (order=3, max 2 keys)', () => {
    const tree = new BTree(3);
    tree.insert(10);
    tree.insert(20);
    tree.insert(30);
    expect(tree.root!.keys).toEqual([20]);
    expect(tree.root!.isLeaf).toBe(false);
    expect(tree.root!.children.length).toBe(2);
    expect(tree.root!.children[0].keys).toEqual([10]);
    expect(tree.root!.children[1].keys).toEqual([30]);
  });

  it('generates steps with snapshots for each phase', () => {
    const tree = new BTree(3);
    const steps = tree.insert(10);
    for (const step of steps) {
      expect(step.treeSnapshot).toBeDefined();
      expect(step.description).toBeTruthy();
      expect(step.type).toBeTruthy();
      expect(step.nodeId).toBeTruthy();
    }
  });

  it('handles deeper splits (order=3, insert 1-7)', () => {
    const tree = new BTree(3);
    for (const key of [1, 2, 3, 4, 5, 6, 7]) {
      tree.insert(key);
    }
    expect(tree.root!.isLeaf).toBe(false);
    expect(tree.root!.keys.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects duplicate keys', () => {
    const tree = new BTree(3);
    tree.insert(10);
    const steps = tree.insert(10);
    expect(tree.root!.keys).toEqual([10]);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.type).toBe('found');
  });

  it('works with order=5', () => {
    const tree = new BTree(5);
    for (const key of [10, 20, 30, 40, 50]) {
      tree.insert(key);
    }
    expect(tree.root!.keys).toEqual([30]);
    expect(tree.root!.children.length).toBe(2);
    expect(tree.root!.children[0].keys).toEqual([10, 20]);
    expect(tree.root!.children[1].keys).toEqual([40, 50]);
  });
});
