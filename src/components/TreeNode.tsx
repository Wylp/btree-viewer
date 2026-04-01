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
      {keys.map((key, i) => {
        const keyWidth = 40;
        const padding = 8;
        const x = padding + i * keyWidth;
        return (
          <g key={`${key}-${i}`}>
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
            <text
              x={x + keyWidth / 2}
              y={layout.height / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isActive && highlightColor ? highlightColor : colors.node.text}
              fontSize={13}
              fontFamily="ui-monospace, 'SFMono-Regular', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
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
