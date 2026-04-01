import { describe, it, expect, beforeEach } from 'vitest';
import { BTree } from '../BTree';
import { resetIdCounter } from '../BTreeNode';

describe('BTree.bulkInsert', () => {
  beforeEach(() => { resetIdCounter(); });

  it('inserts multiple keys', () => {
    const tree = new BTree(3);
    const steps = tree.bulkInsert([10, 20, 30]);
    expect(tree.root).not.toBeNull();
    expect(tree.root!.keys).toEqual([20]);
    expect(steps.length).toBeGreaterThan(3);
  });

  it('adds separator steps between each insertion', () => {
    const tree = new BTree(3);
    const steps = tree.bulkInsert([10, 20, 30]);
    const separators = steps.filter(s => s.type === 'separator');
    expect(separators.length).toBe(2);
  });

  it('separator description mentions next key', () => {
    const tree = new BTree(3);
    const steps = tree.bulkInsert([10, 20]);
    const sep = steps.find(s => s.type === 'separator');
    expect(sep).toBeDefined();
    expect(sep!.description).toContain('20');
  });

  it('handles empty array', () => {
    const tree = new BTree(3);
    const steps = tree.bulkInsert([]);
    expect(steps.length).toBe(0);
    expect(tree.root).toBeNull();
  });

  it('handles single key', () => {
    const tree = new BTree(3);
    const steps = tree.bulkInsert([42]);
    expect(tree.root!.keys).toEqual([42]);
    expect(steps.filter(s => s.type === 'separator').length).toBe(0);
  });
});
