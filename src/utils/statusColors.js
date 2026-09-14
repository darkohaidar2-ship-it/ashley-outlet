// Helper functions and color palettes for Item Statuses (دۆخی کاڵا)

export const STATUS_COLOR_PALETTE = [
  { id: 'purple', label: 'مۆر', hex: '#9333ea' },
  { id: 'blue', label: 'شین', hex: '#2563eb' },
  { id: 'red', label: 'سوور', hex: '#dc2626' },
  { id: 'emerald', label: 'سەوز', hex: '#059669' },
  { id: 'amber', label: 'زەرد-پرتەقاڵی', hex: '#d97706' },
  { id: 'rose', label: 'پەمەیی', hex: '#e11d48' },
  { id: 'cyan', label: 'ئاسمانی', hex: '#0891b2' },
  { id: 'indigo', label: 'نیلی', hex: '#4f46e5' },
  { id: 'pink', label: 'پەمەیی گەش', hex: '#db2777' },
  { id: 'slate', label: 'ڕەساسی', hex: '#475569' }
];

export const DEFAULT_STATUS_COLORS = {
  'ستۆک': '#9333ea', // مۆر (Purple) - as explicitly requested
  'ئاوتلێت': '#dc2626', // سوور (Red)
  'یەدەگ': '#2563eb'   // شین (Blue)
};

export function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(147, 51, 234, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getStatusColor(statusName, customColors = {}) {
  if (!statusName) return '#64748b';
  if (customColors && customColors[statusName]) {
    return customColors[statusName];
  }
  if (DEFAULT_STATUS_COLORS[statusName]) {
    return DEFAULT_STATUS_COLORS[statusName];
  }
  // Deterministic fallback based on status name string hash
  let hash = 0;
  for (let i = 0; i < statusName.length; i++) {
    hash = statusName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % STATUS_COLOR_PALETTE.length;
  return STATUS_COLOR_PALETTE[index].hex;
}

export function getStatusBadgeStyle(statusName, customColors = {}, isDark = false) {
  if (!statusName) return {};
  const color = getStatusColor(statusName, customColors);

  if (isDark) {
    return {
      backgroundColor: hexToRgba(color, 0.25),
      color: '#ffffff',
      borderColor: hexToRgba(color, 0.6)
    };
  }

  return {
    backgroundColor: hexToRgba(color, 0.12),
    color: color,
    borderColor: hexToRgba(color, 0.3)
  };
}

export function getStatusDotStyle(statusName, customColors = {}) {
  const color = getStatusColor(statusName, customColors);
  return {
    backgroundColor: color
  };
}
