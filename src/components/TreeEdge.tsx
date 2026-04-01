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
  const spacing = parentLayout.width / (totalChildren + 1);
  const startX = parentLayout.x + spacing * (childIndex + 1);
  const startY = parentLayout.y + parentLayout.height;
  const endX = childLayout.x + childLayout.width / 2;
  const endY = childLayout.y;
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
