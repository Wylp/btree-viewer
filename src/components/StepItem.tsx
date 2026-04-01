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
  compare: '\u2022',
  descend: '\u2193',
  insert: '+',
  split: '\u2702',
  promote: '\u2191',
  merge: '\u2295',
  borrow: '\u2194',
  delete: '\u2212',
  found: '\u2713',
  'not-found': '\u2717',
  separator: '\u2014',
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
        {stepIcons[step.type] ?? '\u00B7'}
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
