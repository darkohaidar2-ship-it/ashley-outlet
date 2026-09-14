// Helper functions and color palettes for Item Statuses (دۆخی کاڵا)

export const STATUS_COLOR_PALETTE = [
  '#9333ea', // مۆر (Purple)
  '#dc2626', // سوور (Red)
  '#2563eb', // شین (Blue)
  '#059669', // سەوز (Emerald)
  '#d97706', // زەرد-پرتەقاڵی (Amber)
  '#e11d48', // پەمەیی (Rose)
  '#0891b2', // ئاسمانی (Cyan)
  '#4f46e5', // نیلی (Indigo)
  '#db2777', // پەمەیی گەش (Pink)
  '#475569'  // ڕەساسی (Slate)
];

export const DEFAULT_STATUS_COLORS = {
  'ستۆک': '#9333ea', // مۆر (Purple) - as requested by user
  'ئاوتلێت': '#dc2626', // سوور (Red)
  'یەدەگ': '#2563eb'   // شین (Blue)
};

export function normalizeHex(color, fallback = '#9333ea') {
  if (!color) return fallback;
  if (typeof color === 'string') {
    return color.startsWith('#') ? color : `#${color}`;
  }
  if (typeof color === 'object') {
    if (color.hex) return String(color.hex);
    if (color.color) return String(color.color);
  }
  return fallback;
}

export function hexToRgba(hexInput, alpha = 1) {
  const hex = normalizeHex(hexInput);
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
    return normalizeHex(customColors[statusName]);
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
  return STATUS_COLOR_PALETTE[index];
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
    borderColor: hexToRgba(color, 0.35)
  };
}

export function getStatusDotStyle(statusName, customColors = {}) {
  const color = getStatusColor(statusName, customColors);
  return {
    backgroundColor: color
  };
}
