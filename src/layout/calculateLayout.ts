import type { BTreeNode, NodeLayout } from '../engine/types';

const KEY_WIDTH = 40;
const KEY_PADDING = 16;
const NODE_HEIGHT = 36;
const VERTICAL_SPACING = 80;
const HORIZONTAL_GAP = 24;

export function calculateLayout(root: BTreeNode): Map<string, NodeLayout> {
  const positions = new Map<string, NodeLayout>();
  const subtreeWidths = new Map<string, number>();
  calcSubtreeWidth(root, subtreeWidths);
  const rootWidth = nodeWidth(root);
  const rootX = -(rootWidth / 2);
  assignPositions(root, rootX, 0, subtreeWidths, positions);
  return positions;
}

function nodeWidth(node: BTreeNode): number {
  return node.keys.length * KEY_WIDTH + KEY_PADDING;
}

function calcSubtreeWidth(node: BTreeNode, widths: Map<string, number>): number {
  if (node.isLeaf || node.children.length === 0) {
    const w = nodeWidth(node);
    widths.set(node.id, w);
    return w;
  }
  let childrenTotal = 0;
  for (let i = 0; i < node.children.length; i++) {
    if (i > 0) childrenTotal += HORIZONTAL_GAP;
    childrenTotal += calcSubtreeWidth(node.children[i], widths);
  }
  const w = Math.max(nodeWidth(node), childrenTotal);
  widths.set(node.id, w);
  return w;
}

function assignPositions(
  node: BTreeNode, x: number, depth: number,
  subtreeWidths: Map<string, number>, positions: Map<string, NodeLayout>,
): void {
  const w = nodeWidth(node);
  const subtreeW = subtreeWidths.get(node.id)!;
  const y = depth * VERTICAL_SPACING;
  const nodeX = x + (subtreeW - w) / 2;
  positions.set(node.id, { x: nodeX, y, width: w, height: NODE_HEIGHT });
  if (node.isLeaf || node.children.length === 0) return;
  let childrenTotal = 0;
  for (let i = 0; i < node.children.length; i++) {
    if (i > 0) childrenTotal += HORIZONTAL_GAP;
    childrenTotal += subtreeWidths.get(node.children[i].id)!;
  }
  let childX = x + (subtreeW - childrenTotal) / 2;
  for (const child of node.children) {
    const childSubtreeW = subtreeWidths.get(child.id)!;
    assignPositions(child, childX, depth + 1, subtreeWidths, positions);
    childX += childSubtreeW + HORIZONTAL_GAP;
  }
}
