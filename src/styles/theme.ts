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
