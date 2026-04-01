# B-Tree Viewer -- Design Spec

Single-page interactive B-tree visualizer built with React + TypeScript + Vite. Allows users to see B-tree operations executed step by step with animations, and interact by inserting, removing, and searching keys.

## Stack

- React 19 + TypeScript + Vite
- SVG for tree rendering (no external visualization libraries)
- CSS transitions for animations
- Zero external dependencies beyond React

## Core Decisions

- **B-tree order:** Configurable by the user (min 3, max 7), default 3
- **Operations:** Insert, Delete, Search, Bulk Insert
- **Playback:** Auto-play (configurable speed) + manual step-by-step. User can pause auto-play and advance manually at any time
- **Layout:** Canvas (left) + Sidebar with step list (right)
- **Visual style:** Dark Developer theme (GitHub/VS Code aesthetic — dark backgrounds, monospace accents, green for success, blue for highlights)
- **Rendering:** SVG with zoom/pan support
- **Architecture:** No external deps. B-tree engine in pure TypeScript, SVG rendering with React components, layout calculation as a pure function

## 1. B-Tree Engine

Pure TypeScript, fully decoupled from UI.

### Data Structures

```typescript
interface BTreeNode {
  id: string;            // stable ID for animation tracking
  keys: number[];
  children: BTreeNode[];
  isLeaf: boolean;
}

type StepType = 'compare' | 'insert' | 'split' | 'merge' | 'borrow' | 'found' | 'not-found' | 'descend' | 'delete' | 'promote';

interface Step {
  type: StepType;
  nodeId: string;        // node being acted upon
  key: number;           // key involved
  description: string;   // human-readable explanation in Portuguese
  treeSnapshot: BTreeNode; // deep clone of root at this point
}
```

### Class API

```typescript
class BTree {
  order: number;
  root: BTreeNode | null;

  constructor(order: number);
  insert(key: number): Step[];
  delete(key: number): Step[];
  search(key: number): Step[];
  bulkInsert(keys: number[]): Step[];  // returns steps for all insertions sequentially
}
```

- Each method returns the full list of intermediate steps
- Each step contains a deep-cloned snapshot of the entire tree at that point
- Nodes receive stable IDs so the UI can track them across snapshots for animations
- `bulkInsert` concatenates steps from individual inserts, with a `{ type: 'separator', description: 'Próxima inserção: X' }` step between each to let the UI visually distinguish where one insert ends and the next begins

## 2. Layout and Node Positioning

Pure function: receives a tree snapshot, returns coordinates for every node.

### Algorithm

- BFS traversal level by level
- `y = depth * verticalSpacing` (fixed per level)
- `x` calculated bottom-up: leaves distributed evenly, parents centered over their children
- Node width proportional to key count: `keys.length * keyWidth + padding`
- Returns `Map<nodeId, { x, y, width, height }>`

### Connections

- Lines from the bottom of each key separator in the parent to the top-center of the corresponding child
- SVG cubic bezier curves for smooth appearance

### Responsiveness

- SVG viewBox adjusts dynamically to tree size
- Zoom via mouse wheel (scales the root `<g>` transform)
- Pan via mouse drag (translates the root `<g>` transform)
- "Fit to screen" button resets view to show the entire tree

## 3. SVG Rendering and Animations

### Nodes

- Each node is a `<g>` containing: `<rect>` background, vertical separators between keys, `<text>` per key
- Default colors: background `#21262d`, border `#30363d`, text `#c9d1d9`
- Active/highlighted node changes border and background per step type:
  - Blue (`#1f6feb`) -- navigation/descend
  - Green (`#238636`) -- insertion
  - Red (`#da3633`) -- deletion
  - Yellow (`#d29922`) -- search found
  - Default -- search not found / neutral

### Animations Between Steps

- CSS `transition` on `transform` of each node `<g>` for smooth repositioning
- New nodes: `opacity: 0 → 1`, `scale(0.8) → scale(1)`
- Removed nodes: `opacity: 1 → 0`
- Splits: keys slide apart, promoted key moves up to parent
- Currently visited node gets a pulsing glow effect (CSS animation with `box-shadow`/`filter`)

### Zoom/Pan Implementation

- `onWheel` on SVG: adjusts `scale` state
- `onMouseDown/Move/Up` on SVG: adjusts `translateX/translateY` state
- All applied as `transform` on the root `<g>` element
- State: `{ scale: number, translateX: number, translateY: number }`

## 4. Sidebar and Playback Controls

### Sidebar (right panel)

- Vertical list of all steps in the current operation
- Each step shows: step number, icon by type, short description in Portuguese
- Current step is highlighted with the operation's color
- Future steps have reduced opacity
- Clicking any step jumps to it (renders that step's snapshot)
- Auto-scrolls to keep current step visible

### Playback Controls (sidebar footer)

- Buttons: `|◄` first, `◄` previous, `▶/⏸` play/pause, `►` next, `►|` last
- Speed slider: controls interval between steps in auto mode (range: 200ms to 2000ms, default 800ms)
- Auto-play advances one step per interval
- Pause freezes on current step, play resumes from current position

### Toolbar (page top)

- Title: "B-Tree Viewer"
- Numeric input for value
- Operation buttons: Inserir, Remover, Buscar
- Comma-separated input for bulk values + "Construir" button
- Order selector: numeric input or dropdown (min 3, max 7, default 3)
- "Limpar" button to reset the tree

### Behavior

- Starting an operation populates the sidebar with steps and begins auto-play
- Starting a new operation while one is in progress: previous operation finalizes instantly, new one begins
- Tree state persists across operations (insert 5, then insert 10 — tree accumulates)
- Changing the order resets the tree (with confirmation if tree is non-empty)

## 5. Component Architecture

### File Structure

```
src/
├── engine/
│   ├── BTreeNode.ts        -- node class
│   ├── BTree.ts            -- tree class + operations
│   └── types.ts            -- Step, Snapshot, StepType
├── layout/
│   └── calculateLayout.ts  -- node positioning
├── components/
│   ├── App.tsx             -- global state, orchestrates everything
│   ├── Toolbar.tsx         -- input, operation buttons, config
│   ├── TreeCanvas.tsx      -- SVG + zoom/pan + renders nodes/edges
│   ├── TreeNode.tsx        -- renders a single node (rect + keys)
│   ├── TreeEdge.tsx        -- renders a connection (bezier path)
│   ├── Sidebar.tsx         -- step list + playback controls
│   └── StepItem.tsx        -- individual step item in the list
├── hooks/
│   ├── usePlayback.ts      -- play/pause/next/prev/speed logic
│   └── useZoomPan.ts       -- zoom and pan logic for SVG
└── styles/
    └── theme.ts            -- color constants, shared style tokens
```

### Data Flow

- `App` holds: `BTree` instance, `steps: Step[]`, `currentStepIndex`, config (order, speed)
- `Toolbar` triggers operations → `App` runs on engine → receives steps → starts playback
- `usePlayback` manages the timer, exposes `play()`, `pause()`, `next()`, `prev()`, `goTo(index)`
- When `currentStepIndex` changes → `App` gets the `treeSnapshot` for that step → `calculateLayout()` → passes positions to `TreeCanvas`
- `TreeCanvas` renders `TreeNode` and `TreeEdge` with positions, CSS transitions handle animation
- `Sidebar` receives `steps` and `currentStepIndex`, renders the list, click on step calls `goTo()`
- No global state management library needed. All state flows down from App via props.
