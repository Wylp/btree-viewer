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
