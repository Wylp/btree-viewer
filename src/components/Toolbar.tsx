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

  const btnStyle = (color: string = colors.bgTertiary, textColor: string = colors.textSecondary): React.CSSProperties => ({
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
      <div style={{ width: 1, height: 24, background: colors.border }} />
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
      <div style={{ width: 1, height: 24, background: colors.border }} />
      <input
        style={{ ...inputStyle, width: 140 }}
        type="text"
        value={bulkValue}
        onChange={(e) => setBulkValue(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, handleBulk)}
        placeholder="1, 5, 10, 3..."
      />
      <button style={btnStyle()} onClick={handleBulk}>Construir</button>
      <div style={{ width: 1, height: 24, background: colors.border }} />
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
      <div style={{ flex: 1 }} />
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
