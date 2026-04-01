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
            <button style={btnStyle()} onClick={onFirst} title="Primeiro">{'\u23EE'}</button>
            <button style={btnStyle()} onClick={onPrev} title="Anterior">{'\u25C0'}</button>
            <button
              style={btnStyle(true)}
              onClick={isPlaying ? onPause : onPlay}
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? '\u23F8' : '\u25B6'}
            </button>
            <button style={btnStyle()} onClick={onNext} title="Próximo">{'\u25B6'}</button>
            <button style={btnStyle()} onClick={onLast} title="Último">{'\u23ED'}</button>
          </div>
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
