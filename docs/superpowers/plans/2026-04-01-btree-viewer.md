# B-Tree Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **IMPORTANT:** When implementing UI/frontend components (Tasks 6-11), you MUST invoke the `/ui-ux-pro-max` skill before writing any component code or styling. The design theme is "Dark Developer" (GitHub/VS Code aesthetic).

**Goal:** Build a single-page interactive B-tree visualizer where users can insert, remove, search, and bulk-insert keys while watching each algorithmic step animate through the tree.

**Architecture:** Pure TypeScript B-tree engine produces step-by-step snapshots, a layout function computes SVG coordinates, React components render the tree with CSS transition animations. Sidebar shows navigable step list with play/pause controls.

**Tech Stack:** React 19 + TypeScript + Vite + Vitest. Zero external deps beyond React. SVG for rendering. CSS transitions for animation.

**Design spec:** `docs/superpowers/specs/2026-04-01-btree-viewer-design.md`

---

## File Map

```
src/
├── engine/
│   ├── types.ts            -- BTreeNode, Step, StepType interfaces
│   ├── BTreeNode.ts        -- node creation, cloning, ID generation
│   ├── BTree.ts            -- BTree class: insert, delete, search, bulkInsert
│   └── __tests__/
│       ├── BTree.insert.test.ts
│       ├── BTree.delete.test.ts
│       ├── BTree.search.test.ts
│       └── BTree.bulkInsert.test.ts
├── layout/
│   ├── calculateLayout.ts  -- pure function: snapshot → node positions
│   └── __tests__/
│       └── calculateLayout.test.ts
├── components/
│   ├── App.tsx             -- root component, state orchestration
│   ├── Toolbar.tsx         -- top bar: inputs, operation buttons, config
│   ├── TreeCanvas.tsx      -- SVG container + zoom/pan + renders nodes/edges
│   ├── TreeNode.tsx        -- single B-tree node (rect + keys)
│   ├── TreeEdge.tsx        -- bezier connection between parent and child
│   ├── Sidebar.tsx         -- step list + playback controls
│   └── StepItem.tsx        -- single step in the sidebar list
├── hooks/
│   ├── usePlayback.ts      -- play/pause/next/prev/goTo/speed timer logic
│   └── useZoomPan.ts       -- wheel zoom + mouse drag pan state
├── styles/
│   └── theme.ts            -- color constants, shared design tokens
├── index.css               -- global styles (will be replaced)
└── main.tsx                -- entry point (keep as-is)
```

---

## Task 0: Project Setup — Install Vitest, Clean Template

**Files:**
- Modify: `package.json`
- Delete: `src/App.css`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`
- Modify: `src/App.tsx` (gut template content)
- Modify: `src/index.css` (replace with dark theme base)
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

Run:
```bash
bun add -d vitest
```

- [ ] **Step 2: Create vitest.config.ts**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Gut the template**

Delete files:
```bash
rm src/App.css src/assets/hero.png src/assets/react.svg src/assets/vite.svg
```

Replace `src/App.tsx` with:
```tsx
export default function App() {
  return <div id="app">B-Tree Viewer</div>
}
```

- [ ] **Step 5: Replace src/index.css with dark base**

Replace `src/index.css` with:
```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-tertiary: #21262d;
  --border: #30363d;
  --text-primary: #c9d1d9;
  --text-secondary: #8b949e;
  --text-muted: #484f58;
  --accent-blue: #1f6feb;
  --accent-green: #238636;
  --accent-red: #da3633;
  --accent-yellow: #d29922;
  --font-mono: ui-monospace, 'SFMono-Regular', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-primary);
}
```

- [ ] **Step 6: Verify dev server starts**

Run:
```bash
bun run dev
```
Expected: Dev server starts, shows "B-Tree Viewer" text on dark background at localhost.

- [ ] **Step 7: Verify tests run**

Run:
```bash
bun run test
```
Expected: "No test files found" (clean exit, no errors).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: clean template, install vitest, set up dark theme base"
```

---

## Task 1: Engine — Types and Node Helpers

**Files:**
- Create: `src/engine/types.ts`
- Create: `src/engine/BTreeNode.ts`

- [ ] **Step 1: Create src/engine/types.ts**

```typescript
export interface BTreeNode {
  id: string;
  keys: number[];
  children: BTreeNode[];
  isLeaf: boolean;
}

export type StepType =
  | 'compare'
  | 'insert'
  | 'split'
  | 'merge'
  | 'borrow'
  | 'found'
  | 'not-found'
  | 'descend'
  | 'delete'
  | 'promote'
  | 'separator';

export interface Step {
  type: StepType;
  nodeId: string;
  key: number;
  description: string;
  treeSnapshot: BTreeNode;
}

export interface NodeLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

- [ ] **Step 2: Create src/engine/BTreeNode.ts**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/engine/types.ts src/engine/BTreeNode.ts
git commit -m "feat: add B-tree types and node helper functions"
```

---

## Task 2: Engine — Insert Operation (TDD)

**Files:**
- Create: `src/engine/BTree.ts`
- Create: `src/engine/__tests__/BTree.insert.test.ts`

- [ ] **Step 1: Write insert tests**

Create `src/engine/__tests__/BTree.insert.test.ts`:
```typescript
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

    // After split: root has [20], left has [10], right has [30]
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

    // Tree should have height 3 with 7 keys in order=3
    expect(tree.root!.isLeaf).toBe(false);
    expect(tree.root!.keys.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects duplicate keys', () => {
    const tree = new BTree(3);
    tree.insert(10);
    const steps = tree.insert(10);

    // Should still have just one 10
    expect(tree.root!.keys).toEqual([10]);
    // Last step should indicate duplicate
    const lastStep = steps[steps.length - 1];
    expect(lastStep.type).toBe('found');
  });

  it('works with order=5', () => {
    const tree = new BTree(5);
    for (const key of [10, 20, 30, 40, 50]) {
      tree.insert(key);
    }

    // order=5 means max 4 keys per node. 5th insert triggers split
    expect(tree.root!.keys).toEqual([30]);
    expect(tree.root!.children.length).toBe(2);
    expect(tree.root!.children[0].keys).toEqual([10, 20]);
    expect(tree.root!.children[1].keys).toEqual([40, 50]);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run:
```bash
bun run test
```
Expected: FAIL — `BTree` module not found.

- [ ] **Step 3: Implement BTree class with insert**

Create `src/engine/BTree.ts`:
```typescript
import type { BTreeNode, Step, StepType } from './types';
import { createNode, cloneTree } from './BTreeNode';

export class BTree {
  order: number;
  root: BTreeNode | null = null;

  constructor(order: number) {
    this.order = order;
  }

  private maxKeys(): number {
    return this.order - 1;
  }

  private step(type: StepType, nodeId: string, key: number, description: string): Step {
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
      steps.push(this.step('insert', this.root.id, key, `Árvore vazia. Criando raiz com chave ${key}.`));
      return steps;
    }

    // Check for duplicate via search path
    if (this.containsKey(this.root, key)) {
      steps.push(this.step('found', this.root.id, key, `Chave ${key} já existe na árvore.`));
      return steps;
    }

    // If root is full, split it first
    if (this.root.keys.length === this.maxKeys()) {
      const newRoot = createNode(false);
      newRoot.children.push(this.root);
      steps.push(this.step('split', this.root.id, key, `Raiz está cheia. Criando nova raiz e dividindo.`));
      this.splitChild(newRoot, 0, steps, key);
      this.root = newRoot;
      this.insertNonFull(this.root, key, steps);
    } else {
      this.insertNonFull(this.root, key, steps);
    }

    return steps;
  }

  private containsKey(node: BTreeNode, key: number): boolean {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) {
      i++;
    }
    if (i < node.keys.length && node.keys[i] === key) {
      return true;
    }
    if (node.isLeaf) {
      return false;
    }
    return this.containsKey(node.children[i], key);
  }

  private insertNonFull(node: BTreeNode, key: number, steps: Step[]): void {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
      // Find position and insert
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }
      node.keys.splice(i + 1, 0, key);
      steps.push(this.step('insert', node.id, key, `Inserindo ${key} no nó [${node.keys.join(', ')}].`));
    } else {
      // Find child to descend into
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }
      i++;

      steps.push(this.step('descend', node.id, key, `Comparando ${key} com [${node.keys.join(', ')}]. Descendo para filho ${i}.`));

      if (node.children[i].keys.length === this.maxKeys()) {
        this.splitChild(node, i, steps, key);
        if (key > node.keys[i]) {
          i++;
        }
      }

      this.insertNonFull(node.children[i], key, steps);
    }
  }

  private splitChild(parent: BTreeNode, index: number, steps: Step[], triggerKey: number): void {
    const fullNode = parent.children[index];
    const midIndex = Math.floor(this.maxKeys() / 2);
    const midKey = fullNode.keys[midIndex];

    const newNode = createNode(fullNode.isLeaf);
    newNode.keys = fullNode.keys.splice(midIndex + 1);
    fullNode.keys.splice(midIndex); // remove the mid key from fullNode

    if (!fullNode.isLeaf) {
      newNode.children = fullNode.children.splice(midIndex + 1);
    }

    parent.keys.splice(index, 0, midKey);
    parent.children.splice(index + 1, 0, newNode);

    steps.push(this.step('split', fullNode.id, triggerKey,
      `Dividindo nó [${fullNode.keys.join(', ')}, ${midKey}, ${newNode.keys.join(', ')}]. Promovendo ${midKey} para o pai.`));
    steps.push(this.step('promote', parent.id, midKey,
      `Chave ${midKey} promovida. Pai agora é [${parent.keys.join(', ')}].`));
  }

  search(_key: number): Step[] {
    return []; // Implemented in Task 4
  }

  delete(_key: number): Step[] {
    return []; // Implemented in Task 3
  }

  bulkInsert(_keys: number[]): Step[] {
    return []; // Implemented in Task 5
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run:
```bash
bun run test
```
Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/BTree.ts src/engine/__tests__/BTree.insert.test.ts
git commit -m "feat: implement B-tree insert with step tracking"
```

---

## Task 3: Engine — Delete Operation (TDD)

**Files:**
- Create: `src/engine/__tests__/BTree.delete.test.ts`
- Modify: `src/engine/BTree.ts` (implement `delete`)

- [ ] **Step 1: Write delete tests**

Create `src/engine/__tests__/BTree.delete.test.ts`:
```typescript
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
    const tree = buildTree([10, 20, 30]); // root=[20], left=[10], right=[30]
    tree.delete(20);

    const keys = getAllKeys(tree.root!);
    expect(keys).toEqual([10, 30]);
    expect(keys).not.toContain(20);
  });

  it('deletes causing merge (borrow from sibling)', () => {
    const tree = buildTree([10, 20, 30, 40, 50]);
    // Delete keys that force rebalancing
    tree.delete(10);

    const keys = getAllKeys(tree.root!);
    expect(keys).toEqual([20, 30, 40, 50]);
  });

  it('deletes all keys one by one', () => {
    const tree = buildTree([5, 10, 15, 20, 25]);
    for (const k of [5, 10, 15, 20, 25]) {
      tree.delete(k);
    }
    // Tree should be empty or root with no keys
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
```

- [ ] **Step 2: Run tests — verify delete tests fail**

Run:
```bash
bun run test
```
Expected: Insert tests PASS, delete tests FAIL (empty Step[] returned).

- [ ] **Step 3: Implement delete method**

In `src/engine/BTree.ts`, replace the `delete` method and add private helpers:

```typescript
delete(key: number): Step[] {
  const steps: Step[] = [];

  if (this.root === null) {
    steps.push(this.step('not-found', '', key, `Árvore vazia. Chave ${key} não encontrada.`));
    return steps;
  }

  this.deleteFromNode(this.root, key, steps);

  // If root has no keys but has children, shrink tree
  if (this.root.keys.length === 0 && !this.root.isLeaf) {
    this.root = this.root.children[0];
  }

  // If root has no keys and is a leaf, tree is empty
  if (this.root.keys.length === 0 && this.root.isLeaf) {
    this.root = null;
  }

  return steps;
}

private deleteFromNode(node: BTreeNode, key: number, steps: Step[]): void {
  const idx = node.keys.indexOf(key);

  if (idx !== -1 && node.isLeaf) {
    // Case 1: key is in a leaf node
    node.keys.splice(idx, 1);
    steps.push(this.step('delete', node.id, key, `Removendo ${key} do nó folha [${[...node.keys, key].sort((a,b) => a-b).join(', ')}].`));
    return;
  }

  if (idx !== -1 && !node.isLeaf) {
    // Case 2: key is in an internal node
    steps.push(this.step('compare', node.id, key, `Chave ${key} encontrada no nó interno [${node.keys.join(', ')}].`));
    this.deleteFromInternal(node, idx, key, steps);
    return;
  }

  // Case 3: key is not in this node, descend
  if (node.isLeaf) {
    steps.push(this.step('not-found', node.id, key, `Chave ${key} não encontrada na árvore.`));
    return;
  }

  let i = 0;
  while (i < node.keys.length && key > node.keys[i]) {
    i++;
  }

  steps.push(this.step('descend', node.id, key, `Chave ${key} não está em [${node.keys.join(', ')}]. Descendo para filho ${i}.`));

  const minKeys = Math.ceil(this.order / 2) - 1;

  if (node.children[i].keys.length <= minKeys) {
    this.fillChild(node, i, steps, key);
  }

  // After fill, the index may have changed
  if (i >= node.children.length) {
    i = node.children.length - 1;
  }

  this.deleteFromNode(node.children[i], key, steps);
}

private deleteFromInternal(node: BTreeNode, idx: number, key: number, steps: Step[]): void {
  const minKeys = Math.ceil(this.order / 2) - 1;

  if (node.children[idx].keys.length > minKeys) {
    // Replace with predecessor
    const pred = this.getPredecessor(node.children[idx]);
    node.keys[idx] = pred;
    steps.push(this.step('delete', node.id, key, `Substituindo ${key} pelo predecessor ${pred}.`));
    this.deleteFromNode(node.children[idx], pred, steps);
  } else if (node.children[idx + 1].keys.length > minKeys) {
    // Replace with successor
    const succ = this.getSuccessor(node.children[idx + 1]);
    node.keys[idx] = succ;
    steps.push(this.step('delete', node.id, key, `Substituindo ${key} pelo sucessor ${succ}.`));
    this.deleteFromNode(node.children[idx + 1], succ, steps);
  } else {
    // Merge children
    this.mergeChildren(node, idx, steps, key);
    this.deleteFromNode(node.children[idx], key, steps);
  }
}

private getPredecessor(node: BTreeNode): number {
  let current = node;
  while (!current.isLeaf) {
    current = current.children[current.children.length - 1];
  }
  return current.keys[current.keys.length - 1];
}

private getSuccessor(node: BTreeNode): number {
  let current = node;
  while (!current.isLeaf) {
    current = current.children[0];
  }
  return current.keys[0];
}

private fillChild(node: BTreeNode, idx: number, steps: Step[], triggerKey: number): void {
  const minKeys = Math.ceil(this.order / 2) - 1;

  if (idx > 0 && node.children[idx - 1].keys.length > minKeys) {
    this.borrowFromPrev(node, idx, steps, triggerKey);
  } else if (idx < node.children.length - 1 && node.children[idx + 1].keys.length > minKeys) {
    this.borrowFromNext(node, idx, steps, triggerKey);
  } else {
    // Merge with a sibling
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

  child.keys.unshift(node.keys[idx - 1]);
  node.keys[idx - 1] = sibling.keys.pop()!;

  if (!sibling.isLeaf) {
    child.children.unshift(sibling.children.pop()!);
  }

  steps.push(this.step('borrow', child.id, triggerKey,
    `Emprestando chave ${node.keys[idx - 1]} do irmão esquerdo.`));
}

private borrowFromNext(node: BTreeNode, idx: number, steps: Step[], triggerKey: number): void {
  const child = node.children[idx];
  const sibling = node.children[idx + 1];

  child.keys.push(node.keys[idx]);
  node.keys[idx] = sibling.keys.shift()!;

  if (!sibling.isLeaf) {
    child.children.push(sibling.children.shift()!);
  }

  steps.push(this.step('borrow', child.id, triggerKey,
    `Emprestando chave ${node.keys[idx]} do irmão direito.`));
}

private mergeChildren(node: BTreeNode, idx: number, steps: Step[], triggerKey: number): void {
  const left = node.children[idx];
  const right = node.children[idx + 1];
  const midKey = node.keys[idx];

  left.keys.push(midKey, ...right.keys);
  left.children.push(...right.children);

  node.keys.splice(idx, 1);
  node.children.splice(idx + 1, 1);

  steps.push(this.step('merge', left.id, triggerKey,
    `Fundindo nós com chave ${midKey}. Nó resultante: [${left.keys.join(', ')}].`));
}
```

- [ ] **Step 4: Run tests — verify all pass**

Run:
```bash
bun run test
```
Expected: All insert + delete tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/BTree.ts src/engine/__tests__/BTree.delete.test.ts
git commit -m "feat: implement B-tree delete with step tracking"
```

---

## Task 4: Engine — Search Operation (TDD)

**Files:**
- Create: `src/engine/__tests__/BTree.search.test.ts`
- Modify: `src/engine/BTree.ts` (implement `search`)

- [ ] **Step 1: Write search tests**

Create `src/engine/__tests__/BTree.search.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { BTree } from '../BTree';
import { resetIdCounter } from '../BTreeNode';

describe('BTree.search', () => {
  beforeEach(() => {
    resetIdCounter();
  });

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
    // Should have descend steps
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
```

- [ ] **Step 2: Run tests — verify search tests fail**

Run:
```bash
bun run test
```
Expected: Search tests FAIL (empty Step[] returned).

- [ ] **Step 3: Implement search method**

In `src/engine/BTree.ts`, replace the `search` method:

```typescript
search(key: number): Step[] {
  const steps: Step[] = [];

  if (this.root === null) {
    steps.push(this.step('not-found', '', key, `Árvore vazia. Chave ${key} não encontrada.`));
    return steps;
  }

  this.searchNode(this.root, key, steps);
  return steps;
}

private searchNode(node: BTreeNode, key: number, steps: Step[]): void {
  let i = 0;

  steps.push(this.step('compare', node.id, key, `Comparando ${key} com chaves [${node.keys.join(', ')}].`));

  while (i < node.keys.length && key > node.keys[i]) {
    i++;
  }

  if (i < node.keys.length && node.keys[i] === key) {
    steps.push(this.step('found', node.id, key, `Chave ${key} encontrada no nó [${node.keys.join(', ')}]!`));
    return;
  }

  if (node.isLeaf) {
    steps.push(this.step('not-found', node.id, key, `Chave ${key} não encontrada. Nó folha alcançado.`));
    return;
  }

  steps.push(this.step('descend', node.id, key, `${key} não está em [${node.keys.join(', ')}]. Descendo para filho ${i}.`));
  this.searchNode(node.children[i], key, steps);
}
```

- [ ] **Step 4: Run tests — verify all pass**

Run:
```bash
bun run test
```
Expected: All insert + delete + search tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/BTree.ts src/engine/__tests__/BTree.search.test.ts
git commit -m "feat: implement B-tree search with step tracking"
```

---

## Task 5: Engine — Bulk Insert (TDD)

**Files:**
- Create: `src/engine/__tests__/BTree.bulkInsert.test.ts`
- Modify: `src/engine/BTree.ts` (implement `bulkInsert`)

- [ ] **Step 1: Write bulkInsert tests**

Create `src/engine/__tests__/BTree.bulkInsert.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { BTree } from '../BTree';
import { resetIdCounter } from '../BTreeNode';

describe('BTree.bulkInsert', () => {
  beforeEach(() => {
    resetIdCounter();
  });

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
    // 3 insertions = 2 separators (between 1st-2nd and 2nd-3rd)
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
    // No separator for single key
    expect(steps.filter(s => s.type === 'separator').length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests — verify bulkInsert tests fail**

Run:
```bash
bun run test
```
Expected: bulkInsert tests FAIL.

- [ ] **Step 3: Implement bulkInsert**

In `src/engine/BTree.ts`, replace the `bulkInsert` method:

```typescript
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
```

- [ ] **Step 4: Run tests — verify all pass**

Run:
```bash
bun run test
```
Expected: All engine tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/BTree.ts src/engine/__tests__/BTree.bulkInsert.test.ts
git commit -m "feat: implement B-tree bulkInsert with separator steps"
```

---

## Task 6: Layout — calculateLayout (TDD)

**Files:**
- Create: `src/layout/calculateLayout.ts`
- Create: `src/layout/__tests__/calculateLayout.test.ts`

- [ ] **Step 1: Write layout tests**

Create `src/layout/__tests__/calculateLayout.test.ts`:
```typescript
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
    expect(layout.get('l')!.y).toBe(layout.get('r')!.y); // same level
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
    // Depth ordering
    expect(layout.get('root')!.y).toBeLessThan(layout.get('left')!.y);
    expect(layout.get('left')!.y).toBeLessThan(layout.get('ll')!.y);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run:
```bash
bun run test
```
Expected: Layout tests FAIL — module not found.

- [ ] **Step 3: Implement calculateLayout**

Create `src/layout/calculateLayout.ts`:
```typescript
import type { BTreeNode, NodeLayout } from '../engine/types';

const KEY_WIDTH = 40;
const KEY_PADDING = 16;
const NODE_HEIGHT = 36;
const VERTICAL_SPACING = 80;
const HORIZONTAL_GAP = 24;

export function calculateLayout(root: BTreeNode): Map<string, NodeLayout> {
  const positions = new Map<string, NodeLayout>();

  // First pass: calculate widths bottom-up and subtree widths
  const subtreeWidths = new Map<string, number>();
  calcSubtreeWidth(root, subtreeWidths);

  // Second pass: assign positions top-down
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
  node: BTreeNode,
  x: number,
  depth: number,
  subtreeWidths: Map<string, number>,
  positions: Map<string, NodeLayout>,
): void {
  const w = nodeWidth(node);
  const subtreeW = subtreeWidths.get(node.id)!;
  const y = depth * VERTICAL_SPACING;

  // Center node within its subtree space
  const nodeX = x + (subtreeW - w) / 2;
  positions.set(node.id, { x: nodeX, y, width: w, height: NODE_HEIGHT });

  if (node.isLeaf || node.children.length === 0) return;

  // Calculate total children width
  let childrenTotal = 0;
  for (let i = 0; i < node.children.length; i++) {
    if (i > 0) childrenTotal += HORIZONTAL_GAP;
    childrenTotal += subtreeWidths.get(node.children[i].id)!;
  }

  // Center children under this node's subtree space
  let childX = x + (subtreeW - childrenTotal) / 2;

  for (const child of node.children) {
    const childSubtreeW = subtreeWidths.get(child.id)!;
    assignPositions(child, childX, depth + 1, subtreeWidths, positions);
    childX += childSubtreeW + HORIZONTAL_GAP;
  }
}
```

- [ ] **Step 4: Run tests — verify all pass**

Run:
```bash
bun run test
```
Expected: All engine + layout tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layout/calculateLayout.ts src/layout/__tests__/calculateLayout.test.ts
git commit -m "feat: implement tree layout calculation"
```

---

## Task 7: Theme Constants + Styles File

**Files:**
- Create: `src/styles/theme.ts`

- [ ] **Step 1: Create src/styles/theme.ts**

> **NOTE:** Use `/ui-ux-pro-max` skill before writing this file to ensure design quality.

```typescript
export const colors = {
  bgPrimary: '#0d1117',
  bgSecondary: '#161b22',
  bgTertiary: '#21262d',
  border: '#30363d',
  borderLight: '#1a3a6e',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textMuted: '#484f58',

  accentBlue: '#1f6feb',
  accentGreen: '#238636',
  accentRed: '#da3633',
  accentYellow: '#d29922',

  // Step-type highlight colors
  highlight: {
    descend: '#1f6feb',
    compare: '#1f6feb',
    insert: '#238636',
    split: '#d29922',
    promote: '#d29922',
    delete: '#da3633',
    merge: '#da3633',
    borrow: '#d29922',
    found: '#238636',
    'not-found': '#da3633',
    separator: '#8b949e',
  } as Record<string, string>,

  node: {
    bg: '#21262d',
    border: '#30363d',
    text: '#c9d1d9',
    activeBg: '#1a3a6e',
  },
} as const;

export const layout = {
  sidebarWidth: 280,
  toolbarHeight: 52,
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/theme.ts
git commit -m "feat: add dark developer theme constants"
```

---

## Task 8: Hook — usePlayback

**Files:**
- Create: `src/hooks/usePlayback.ts`

- [ ] **Step 1: Create usePlayback hook**

Create `src/hooks/usePlayback.ts`:
```typescript
import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePlaybackOptions {
  totalSteps: number;
  defaultSpeed?: number;
}

interface UsePlaybackReturn {
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  goTo: (index: number) => void;
  setSpeed: (ms: number) => void;
}

export function usePlayback({ totalSteps, defaultSpeed = 800 }: UsePlaybackOptions): UsePlaybackReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
  }, [clearTimer]);

  const play = useCallback(() => {
    if (totalSteps === 0) return;
    setIsPlaying(true);
  }, [totalSteps]);

  const next = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const prev = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  const first = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const last = useCallback(() => {
    setCurrentIndex(totalSteps - 1);
  }, [totalSteps]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalSteps - 1)));
  }, [totalSteps]);

  // Auto-advance timer
  useEffect(() => {
    clearTimer();
    if (isPlaying && totalSteps > 0) {
      timerRef.current = setInterval(() => {
        setCurrentIndex(i => {
          if (i >= totalSteps - 1) {
            setIsPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, speed);
    }
    return clearTimer;
  }, [isPlaying, speed, totalSteps, clearTimer]);

  // Reset when totalSteps changes (new operation)
  useEffect(() => {
    setCurrentIndex(0);
    if (totalSteps > 0) {
      setIsPlaying(true);
    }
  }, [totalSteps]);

  return { currentIndex, isPlaying, speed, play, pause, next, prev, first, last, goTo, setSpeed };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePlayback.ts
git commit -m "feat: add usePlayback hook for step navigation"
```

---

## Task 9: Hook — useZoomPan

**Files:**
- Create: `src/hooks/useZoomPan.ts`

- [ ] **Step 1: Create useZoomPan hook**

Create `src/hooks/useZoomPan.ts`:
```typescript
import { useState, useCallback, useRef, type MouseEvent, type WheelEvent } from 'react';

interface ZoomPanState {
  scale: number;
  translateX: number;
  translateY: number;
}

interface UseZoomPanReturn {
  state: ZoomPanState;
  onWheel: (e: WheelEvent) => void;
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: () => void;
  resetView: () => void;
  transformStyle: string;
}

export function useZoomPan(): UseZoomPanReturn {
  const [state, setState] = useState<ZoomPanState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setState(s => ({
      ...s,
      scale: Math.max(0.1, Math.min(5, s.scale * delta)),
    }));
  }, []);

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return; // left click only
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setState(s => ({
      ...s,
      translateX: s.translateX + dx,
      translateY: s.translateY + dy,
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const resetView = useCallback(() => {
    setState({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  const transformStyle = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;

  return { state, onWheel, onMouseDown, onMouseMove, onMouseUp, resetView, transformStyle };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useZoomPan.ts
git commit -m "feat: add useZoomPan hook for SVG navigation"
```

---

## Task 10: UI Components — TreeNode + TreeEdge

> **IMPORTANT:** Invoke `/ui-ux-pro-max` skill before implementing this task.

**Files:**
- Create: `src/components/TreeNode.tsx`
- Create: `src/components/TreeEdge.tsx`

- [ ] **Step 1: Create TreeNode component**

Create `src/components/TreeNode.tsx`:
```tsx
import type { NodeLayout } from '../engine/types';
import { colors } from '../styles/theme';

interface TreeNodeProps {
  nodeId: string;
  keys: number[];
  layout: NodeLayout;
  highlightColor?: string;
  isActive: boolean;
}

export function TreeNode({ keys, layout, highlightColor, isActive }: TreeNodeProps) {
  const borderColor = highlightColor ?? colors.node.border;
  const bgColor = isActive ? (highlightColor ? `${highlightColor}33` : colors.node.activeBg) : colors.node.bg;

  return (
    <g
      style={{
        transform: `translate(${layout.x}px, ${layout.y}px)`,
        transition: 'transform 0.4s ease, opacity 0.4s ease',
      }}
    >
      {/* Background rect */}
      <rect
        width={layout.width}
        height={layout.height}
        rx={4}
        ry={4}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isActive ? 2 : 1}
        style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
      />

      {/* Pulsing glow for active node */}
      {isActive && highlightColor && (
        <rect
          width={layout.width}
          height={layout.height}
          rx={4}
          ry={4}
          fill="none"
          stroke={highlightColor}
          strokeWidth={2}
          opacity={0.5}
          style={{ filter: `drop-shadow(0 0 6px ${highlightColor})` }}
        >
          <animate
            attributeName="opacity"
            values="0.5;0.2;0.5"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </rect>
      )}

      {/* Keys */}
      {keys.map((key, i) => {
        const keyWidth = 40;
        const padding = 8;
        const x = padding + i * keyWidth;
        return (
          <g key={`${key}-${i}`}>
            {/* Separator line between keys */}
            {i > 0 && (
              <line
                x1={x}
                y1={4}
                x2={x}
                y2={layout.height - 4}
                stroke={borderColor}
                strokeWidth={1}
                opacity={0.5}
              />
            )}
            {/* Key text */}
            <text
              x={x + keyWidth / 2}
              y={layout.height / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isActive && highlightColor ? highlightColor : colors.node.text}
              fontSize={13}
              fontFamily={`var(--font-mono, ${colors.node.text})`}
              style={{ transition: 'fill 0.3s ease' }}
            >
              {key}
            </text>
          </g>
        );
      })}
    </g>
  );
}
```

- [ ] **Step 2: Create TreeEdge component**

Create `src/components/TreeEdge.tsx`:
```tsx
import { colors } from '../styles/theme';
import type { NodeLayout } from '../engine/types';

interface TreeEdgeProps {
  parentLayout: NodeLayout;
  childLayout: NodeLayout;
  childIndex: number;
  totalChildren: number;
  highlightColor?: string;
}

export function TreeEdge({ parentLayout, childLayout, childIndex, totalChildren, highlightColor }: TreeEdgeProps) {
  // Start point: bottom of parent, distributed across width
  const spacing = parentLayout.width / (totalChildren + 1);
  const startX = parentLayout.x + spacing * (childIndex + 1);
  const startY = parentLayout.y + parentLayout.height;

  // End point: top-center of child
  const endX = childLayout.x + childLayout.width / 2;
  const endY = childLayout.y;

  // Control points for cubic bezier
  const midY = (startY + endY) / 2;

  const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
  const strokeColor = highlightColor ?? colors.border;

  return (
    <path
      d={d}
      fill="none"
      stroke={strokeColor}
      strokeWidth={highlightColor ? 2 : 1}
      opacity={highlightColor ? 0.8 : 0.4}
      style={{ transition: 'stroke 0.3s ease, opacity 0.3s ease' }}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TreeNode.tsx src/components/TreeEdge.tsx
git commit -m "feat: add TreeNode and TreeEdge SVG components"
```

---

## Task 11: UI Components — TreeCanvas

> **IMPORTANT:** Invoke `/ui-ux-pro-max` skill before implementing this task.

**Files:**
- Create: `src/components/TreeCanvas.tsx`

- [ ] **Step 1: Create TreeCanvas component**

Create `src/components/TreeCanvas.tsx`:
```tsx
import { useMemo } from 'react';
import type { BTreeNode, Step, NodeLayout } from '../engine/types';
import { calculateLayout } from '../layout/calculateLayout';
import { TreeNode } from './TreeNode';
import { TreeEdge } from './TreeEdge';
import { useZoomPan } from '../hooks/useZoomPan';
import { colors } from '../styles/theme';

interface TreeCanvasProps {
  snapshot: BTreeNode | null;
  currentStep: Step | null;
}

export function TreeCanvas({ snapshot, currentStep }: TreeCanvasProps) {
  const { onWheel, onMouseDown, onMouseMove, onMouseUp, resetView, state } = useZoomPan();

  const layoutMap = useMemo(() => {
    if (!snapshot) return new Map<string, NodeLayout>();
    return calculateLayout(snapshot);
  }, [snapshot]);

  const highlightColor = currentStep
    ? colors.highlight[currentStep.type] ?? undefined
    : undefined;

  // Collect all nodes for rendering
  const nodes: { node: BTreeNode; layout: NodeLayout }[] = [];
  const edges: { parent: BTreeNode; parentLayout: NodeLayout; child: BTreeNode; childLayout: NodeLayout; childIndex: number }[] = [];

  function collectNodes(node: BTreeNode) {
    const layout = layoutMap.get(node.id);
    if (!layout) return;
    nodes.push({ node, layout });
    for (let i = 0; i < node.children.length; i++) {
      const childLayout = layoutMap.get(node.children[i].id);
      if (childLayout) {
        edges.push({
          parent: node,
          parentLayout: layout,
          child: node.children[i],
          childLayout,
          childIndex: i,
        });
      }
      collectNodes(node.children[i]);
    }
  }

  if (snapshot) collectNodes(snapshot);

  return (
    <div
      style={{
        flex: 1,
        background: colors.bgSecondary,
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'grab',
      }}
    >
      <svg
        width="100%"
        height="100%"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ display: 'block' }}
      >
        <g
          style={{
            transform: `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Center tree in viewport */}
          <g transform="translate(400, 40)">
            {/* Edges first (behind nodes) */}
            {edges.map((e, i) => (
              <TreeEdge
                key={`edge-${i}`}
                parentLayout={e.parentLayout}
                childLayout={e.childLayout}
                childIndex={e.childIndex}
                totalChildren={e.parent.children.length}
                highlightColor={
                  currentStep && (currentStep.nodeId === e.child.id || currentStep.nodeId === e.parent.id)
                    ? highlightColor
                    : undefined
                }
              />
            ))}

            {/* Nodes */}
            {nodes.map(({ node, layout }) => (
              <TreeNode
                key={node.id}
                nodeId={node.id}
                keys={node.keys}
                layout={layout}
                isActive={currentStep?.nodeId === node.id}
                highlightColor={
                  currentStep?.nodeId === node.id ? highlightColor : undefined
                }
              />
            ))}
          </g>
        </g>
      </svg>

      {/* Fit button */}
      <button
        onClick={resetView}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          background: colors.bgTertiary,
          border: `1px solid ${colors.border}`,
          borderRadius: 4,
          color: colors.textSecondary,
          padding: '4px 10px',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Fit
      </button>

      {/* Empty state */}
      {!snapshot && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.textMuted,
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
          }}
        >
          Insira valores para construir a árvore
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TreeCanvas.tsx
git commit -m "feat: add TreeCanvas SVG component with zoom/pan"
```

---

## Task 12: UI Components — StepItem + Sidebar

> **IMPORTANT:** Invoke `/ui-ux-pro-max` skill before implementing this task.

**Files:**
- Create: `src/components/StepItem.tsx`
- Create: `src/components/Sidebar.tsx`

- [ ] **Step 1: Create StepItem component**

Create `src/components/StepItem.tsx`:
```tsx
import type { Step } from '../engine/types';
import { colors } from '../styles/theme';

interface StepItemProps {
  step: Step;
  index: number;
  isCurrent: boolean;
  isFuture: boolean;
  onClick: () => void;
}

const stepIcons: Record<string, string> = {
  compare: '🔍',
  descend: '↓',
  insert: '+',
  split: '✂',
  promote: '↑',
  merge: '⊕',
  borrow: '↔',
  delete: '−',
  found: '✓',
  'not-found': '✗',
  separator: '―',
};

export function StepItem({ step, index, isCurrent, isFuture, onClick }: StepItemProps) {
  const highlightColor = colors.highlight[step.type] ?? colors.textSecondary;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        padding: '6px 10px',
        border: 'none',
        borderRadius: 4,
        background: isCurrent ? `${highlightColor}22` : 'transparent',
        borderLeft: isCurrent ? `2px solid ${highlightColor}` : '2px solid transparent',
        cursor: 'pointer',
        opacity: isFuture ? 0.4 : 1,
        textAlign: 'left',
        transition: 'background 0.2s ease, opacity 0.2s ease',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: isCurrent ? highlightColor : colors.textMuted,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {stepIcons[step.type] ?? '·'}
      </span>
      <span
        style={{
          fontSize: 12,
          color: isCurrent ? colors.textPrimary : colors.textSecondary,
          lineHeight: '18px',
        }}
      >
        <span style={{ color: colors.textMuted, marginRight: 4, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
          {index + 1}.
        </span>
        {step.description}
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Create Sidebar component**

Create `src/components/Sidebar.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import type { Step } from '../engine/types';
import { StepItem } from './StepItem';
import { colors } from '../styles/theme';

interface SidebarProps {
  steps: Step[];
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onFirst: () => void;
  onLast: () => void;
  onGoTo: (index: number) => void;
  onSpeedChange: (ms: number) => void;
}

export function Sidebar({
  steps, currentIndex, isPlaying, speed,
  onPlay, onPause, onNext, onPrev, onFirst, onLast, onGoTo, onSpeedChange,
}: SidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current step
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[currentIndex] as HTMLElement | undefined;
      activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex]);

  const btnStyle = (active = false): React.CSSProperties => ({
    background: active ? colors.accentBlue : colors.bgTertiary,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    color: active ? '#fff' : colors.textSecondary,
    padding: '4px 8px',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1,
  });

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: colors.bgSecondary,
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: `1px solid ${colors.border}`,
          fontSize: 12,
          color: colors.textSecondary,
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Passos</span>
        {steps.length > 0 && (
          <span style={{ color: colors.textMuted }}>
            {currentIndex + 1}/{steps.length}
          </span>
        )}
      </div>

      {/* Step list */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 4px',
        }}
      >
        {steps.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: colors.textMuted, fontSize: 12 }}>
            Execute uma operação para ver os passos
          </div>
        ) : (
          steps.map((step, i) => (
            <StepItem
              key={i}
              step={step}
              index={i}
              isCurrent={i === currentIndex}
              isFuture={i > currentIndex}
              onClick={() => onGoTo(i)}
            />
          ))
        )}
      </div>

      {/* Playback controls */}
      {steps.length > 0 && (
        <div
          style={{
            padding: '8px 10px',
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            <button style={btnStyle()} onClick={onFirst} title="Primeiro">|◀</button>
            <button style={btnStyle()} onClick={onPrev} title="Anterior">◀</button>
            <button
              style={btnStyle(true)}
              onClick={isPlaying ? onPause : onPlay}
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button style={btnStyle()} onClick={onNext} title="Próximo">▶</button>
            <button style={btnStyle()} onClick={onLast} title="Último">▶|</button>
          </div>

          {/* Speed slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>
              Rápido
            </span>
            <input
              type="range"
              min={200}
              max={2000}
              step={100}
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              style={{ flex: 1, accentColor: colors.accentBlue }}
            />
            <span style={{ fontSize: 10, color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>
              Lento
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StepItem.tsx src/components/Sidebar.tsx
git commit -m "feat: add Sidebar with step list and playback controls"
```

---

## Task 13: UI Components — Toolbar

> **IMPORTANT:** Invoke `/ui-ux-pro-max` skill before implementing this task.

**Files:**
- Create: `src/components/Toolbar.tsx`

- [ ] **Step 1: Create Toolbar component**

Create `src/components/Toolbar.tsx`:
```tsx
import { useState } from 'react';
import { colors } from '../styles/theme';

interface ToolbarProps {
  order: number;
  onInsert: (key: number) => void;
  onDelete: (key: number) => void;
  onSearch: (key: number) => void;
  onBulkInsert: (keys: number[]) => void;
  onOrderChange: (order: number) => void;
  onClear: () => void;
  hasTree: boolean;
}

export function Toolbar({ order, onInsert, onDelete, onSearch, onBulkInsert, onOrderChange, onClear, hasTree }: ToolbarProps) {
  const [singleValue, setSingleValue] = useState('');
  const [bulkValue, setBulkValue] = useState('');

  const parseSingle = (): number | null => {
    const n = parseInt(singleValue, 10);
    return isNaN(n) ? null : n;
  };

  const handleOperation = (op: (key: number) => void) => {
    const n = parseSingle();
    if (n !== null) {
      op(n);
      setSingleValue('');
    }
  };

  const handleBulk = () => {
    const keys = bulkValue
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
    if (keys.length > 0) {
      onBulkInsert(keys);
      setBulkValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action();
  };

  const handleOrderChange = (newOrder: number) => {
    if (newOrder < 3 || newOrder > 7) return;
    if (hasTree && !window.confirm('Mudar o grau vai resetar a árvore. Continuar?')) return;
    onOrderChange(newOrder);
  };

  const inputStyle: React.CSSProperties = {
    background: colors.bgTertiary,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    color: colors.textPrimary,
    padding: '4px 8px',
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    width: 70,
  };

  const btnStyle = (color = colors.bgTertiary, textColor = colors.textSecondary): React.CSSProperties => ({
    background: color,
    border: `1px solid ${color === colors.bgTertiary ? colors.border : color}`,
    borderRadius: 4,
    color: textColor,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    whiteSpace: 'nowrap',
  });

  return (
    <div
      style={{
        height: 52,
        flexShrink: 0,
        background: colors.bgSecondary,
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Title */}
      <span
        style={{
          color: colors.accentBlue,
          fontWeight: 700,
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
          marginRight: 6,
          whiteSpace: 'nowrap',
        }}
      >
        B-Tree Viewer
      </span>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: colors.border }} />

      {/* Single value input + operation buttons */}
      <input
        style={inputStyle}
        type="number"
        value={singleValue}
        onChange={(e) => setSingleValue(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, () => handleOperation(onInsert))}
        placeholder="Valor"
      />
      <button style={btnStyle(colors.accentGreen, '#fff')} onClick={() => handleOperation(onInsert)}>Inserir</button>
      <button style={btnStyle(colors.accentRed, '#fff')} onClick={() => handleOperation(onDelete)}>Remover</button>
      <button style={btnStyle(colors.accentBlue, '#fff')} onClick={() => handleOperation(onSearch)}>Buscar</button>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: colors.border }} />

      {/* Bulk insert */}
      <input
        style={{ ...inputStyle, width: 140 }}
        type="text"
        value={bulkValue}
        onChange={(e) => setBulkValue(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, handleBulk)}
        placeholder="1, 5, 10, 3..."
      />
      <button style={btnStyle()} onClick={handleBulk}>Construir</button>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: colors.border }} />

      {/* Order selector */}
      <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>Grau:</span>
      <select
        value={order}
        onChange={(e) => handleOrderChange(Number(e.target.value))}
        style={{
          ...inputStyle,
          width: 50,
          cursor: 'pointer',
        }}
      >
        {[3, 4, 5, 6, 7].map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Clear button */}
      <button
        style={btnStyle()}
        onClick={() => {
          if (!hasTree || window.confirm('Limpar toda a árvore?')) onClear();
        }}
      >
        Limpar
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Toolbar.tsx
git commit -m "feat: add Toolbar with operation buttons and config"
```

---

## Task 14: Assemble App — Wire Everything Together

> **IMPORTANT:** Invoke `/ui-ux-pro-max` skill before implementing this task.

**Files:**
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Implement App.tsx**

Replace `src/App.tsx` with:

```tsx
import { useState, useCallback, useRef, useMemo } from 'react';
import { BTree } from './engine/BTree';
import { resetIdCounter } from './engine/BTreeNode';
import type { Step } from './engine/types';
import { Toolbar } from './components/Toolbar';
import { TreeCanvas } from './components/TreeCanvas';
import { Sidebar } from './components/Sidebar';
import { usePlayback } from './hooks/usePlayback';
import { colors } from './styles/theme';

export default function App() {
  const [order, setOrder] = useState(3);
  const treeRef = useRef(new BTree(order));
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepsVersion, setStepsVersion] = useState(0);

  const playback = usePlayback({ totalSteps: steps.length });

  const currentStep = steps.length > 0 ? steps[playback.currentIndex] ?? null : null;

  const displaySnapshot = useMemo(() => {
    if (currentStep) return currentStep.treeSnapshot;
    return treeRef.current.root;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, stepsVersion]);

  const runOperation = useCallback((op: (tree: BTree) => Step[]) => {
    const newSteps = op(treeRef.current);
    setSteps(newSteps);
    setStepsVersion(v => v + 1);
  }, []);

  const handleInsert = useCallback((key: number) => {
    runOperation(tree => tree.insert(key));
  }, [runOperation]);

  const handleDelete = useCallback((key: number) => {
    runOperation(tree => tree.delete(key));
  }, [runOperation]);

  const handleSearch = useCallback((key: number) => {
    runOperation(tree => tree.search(key));
  }, [runOperation]);

  const handleBulkInsert = useCallback((keys: number[]) => {
    runOperation(tree => tree.bulkInsert(keys));
  }, [runOperation]);

  const handleOrderChange = useCallback((newOrder: number) => {
    resetIdCounter();
    treeRef.current = new BTree(newOrder);
    setOrder(newOrder);
    setSteps([]);
    setStepsVersion(v => v + 1);
  }, []);

  const handleClear = useCallback(() => {
    resetIdCounter();
    treeRef.current = new BTree(order);
    setSteps([]);
    setStepsVersion(v => v + 1);
  }, [order]);

  return (
    <div
      id="app"
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 8,
        background: colors.bgPrimary,
      }}
    >
      <Toolbar
        order={order}
        onInsert={handleInsert}
        onDelete={handleDelete}
        onSearch={handleSearch}
        onBulkInsert={handleBulkInsert}
        onOrderChange={handleOrderChange}
        onClear={handleClear}
        hasTree={treeRef.current.root !== null}
      />

      <div style={{ flex: 1, display: 'flex', gap: 8, minHeight: 0 }}>
        <TreeCanvas
          snapshot={displaySnapshot}
          currentStep={currentStep}
        />
        <Sidebar
          steps={steps}
          currentIndex={playback.currentIndex}
          isPlaying={playback.isPlaying}
          speed={playback.speed}
          onPlay={playback.play}
          onPause={playback.pause}
          onNext={playback.next}
          onPrev={playback.prev}
          onFirst={playback.first}
          onLast={playback.last}
          onGoTo={playback.goTo}
          onSpeedChange={playback.setSpeed}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
bun run build
```
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Manual smoke test**

Run:
```bash
bun run dev
```
Expected: Page loads with dark background, toolbar at top, empty canvas with "Insira valores para construir a árvore" message, empty sidebar. Typing a number and clicking "Inserir" should show a node appear and steps populate in the sidebar.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire App component — connect engine, layout, and UI"
```

---

## Task 15: Polish and Final Verification

- [ ] **Step 1: Run full test suite**

Run:
```bash
bun run test
```
Expected: All tests PASS.

- [ ] **Step 2: Run linter**

Run:
```bash
bun run lint
```
Expected: No errors. Fix any that appear.

- [ ] **Step 3: Run build**

Run:
```bash
bun run build
```
Expected: Clean build, no warnings.

- [ ] **Step 4: Full manual test**

Run `bun run dev` and verify:
1. Insert values 1 through 7 one at a time — tree builds with animations
2. Steps appear in sidebar, auto-play advances through them
3. Pause/play/next/prev/first/last buttons work
4. Speed slider changes animation speed
5. Search for existing key — highlights path in blue, ends with green "found"
6. Search for missing key — ends with red "not-found"
7. Delete a key — tree rebalances with merge/borrow animations
8. Bulk insert "10,20,30,40,50" — separator steps visible between insertions
9. Change order to 5 — tree resets, confirmation dialog appears
10. Zoom with scroll wheel, pan with mouse drag, fit button resets view
11. "Limpar" resets everything

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish and final adjustments"
```
