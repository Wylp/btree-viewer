import { describe, it, expect } from 'vitest';
import { calculateLayout } from '../calculateLayout';
import type { BTreeNode } from '../../engine/types';

function makeNode(id: string, keys: number[], children: BTreeNode[] = []): BTreeNode {
  return { id, keys, children, isLeaf: children.length === 0 };
}

describe('calculateLayout', () => {
  it('positions single root node', () => {
    const root = makeNode('a', [10, 20]);
    const layout = calculateLayout(root);
    expect(layout.get('a')).toBeDefined();
    const pos = layout.get('a')!;
    expect(pos.y).toBe(0);
    expect(pos.width).toBeGreaterThan(0);
    expect(pos.height).toBeGreaterThan(0);
  });

  it('children are below parent', () => {
    const left = makeNode('l', [5]);
    const right = makeNode('r', [15]);
    const root = makeNode('root', [10], [left, right]);
    const layout = calculateLayout(root);
    expect(layout.get('l')!.y).toBeGreaterThan(layout.get('root')!.y);
    expect(layout.get('r')!.y).toBeGreaterThan(layout.get('root')!.y);
    expect(layout.get('l')!.y).toBe(layout.get('r')!.y);
  });

  it('parent is centered over children', () => {
    const left = makeNode('l', [5]);
    const right = makeNode('r', [15]);
    const root = makeNode('root', [10], [left, right]);
    const layout = calculateLayout(root);
    const rootPos = layout.get('root')!;
    const leftPos = layout.get('l')!;
    const rightPos = layout.get('r')!;
    const childrenCenter = (leftPos.x + leftPos.width / 2 + rightPos.x + rightPos.width / 2) / 2;
    const rootCenter = rootPos.x + rootPos.width / 2;
    expect(Math.abs(rootCenter - childrenCenter)).toBeLessThan(1);
  });

  it('node width scales with key count', () => {
    const small = makeNode('s', [5]);
    const big = makeNode('b', [5, 10, 15, 20]);
    const layoutSmall = calculateLayout(small);
    const layoutBig = calculateLayout(big);
    expect(layoutBig.get('b')!.width).toBeGreaterThan(layoutSmall.get('s')!.width);
  });

  it('positions all nodes in a 3-level tree', () => {
    const ll = makeNode('ll', [1]);
    const lr = makeNode('lr', [5]);
    const rl = makeNode('rl', [15]);
    const rr = makeNode('rr', [25]);
    const left = makeNode('left', [3], [ll, lr]);
    const right = makeNode('right', [20], [rl, rr]);
    const root = makeNode('root', [10], [left, right]);
    const layout = calculateLayout(root);
    expect(layout.size).toBe(7);
    expect(layout.get('root')!.y).toBeLessThan(layout.get('left')!.y);
    expect(layout.get('left')!.y).toBeLessThan(layout.get('ll')!.y);
  });
});
