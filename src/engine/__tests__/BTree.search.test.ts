import { describe, it, expect, beforeEach } from 'vitest';
import { BTree } from '../BTree';
import { resetIdCounter } from '../BTreeNode';

describe('BTree.search', () => {
  beforeEach(() => { resetIdCounter(); });

  it('finds key in root (single node)', () => {
    const tree = new BTree(3);
    tree.insert(10);
    const steps = tree.search(10);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.type).toBe('found');
  });

  it('returns not-found for missing key', () => {
    const tree = new BTree(3);
    tree.insert(10);
    const steps = tree.search(99);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.type).toBe('not-found');
  });

  it('finds key in deep tree', () => {
    const tree = new BTree(3);
    for (const k of [10, 20, 30, 40, 50]) tree.insert(k);
    const steps = tree.search(40);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.type).toBe('found');
    expect(steps.some(s => s.type === 'descend' || s.type === 'compare')).toBe(true);
  });

  it('generates compare and descend steps', () => {
    const tree = new BTree(3);
    for (const k of [10, 20, 30]) tree.insert(k);
    const steps = tree.search(30);
    expect(steps.length).toBeGreaterThan(1);
    for (const step of steps) {
      expect(step.treeSnapshot).toBeDefined();
      expect(step.description).toBeTruthy();
    }
  });

  it('search in empty tree', () => {
    const tree = new BTree(3);
    const steps = tree.search(10);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.type).toBe('not-found');
  });
});
