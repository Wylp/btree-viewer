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
          <g transform="translate(400, 40)">
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
