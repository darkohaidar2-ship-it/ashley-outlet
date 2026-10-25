// Color utilities and default luxury palettes for Product Categories (کەتەگۆری)
import { normalizeHex, hexToRgba } from './statusColors';

export const CATEGORY_COLOR_PALETTE = [
  '#059669', // Emerald / دارستانی سەوز (نووستن - Bedroom)
  '#1d4ed8', // Sapphire / شینی شاھانە (دانیشتن - Sofa set / Living Room)
  '#d97706', // Warm Amber / زەرد-پرتەقاڵی برۆنز (کۆرنەر - Corner)
  '#b91c1c', // Crimson / سووری تۆخی شاھانە (نانخواردن - Dining)
  '#7c3aed', // Royal Purple / مۆری شاھانە
  '#0891b2', // Deep Cyan / شینی دەریا
  '#be185d', // Deep Rose / پەمەیی تۆخ
  '#4338ca', // Indigo / نیلی
  '#334155'  // Slate / ڕەساسی تۆخ
];

// Smart keyword matching for luxury defaults
export const CATEGORY_DEFAULTS_BY_KEYWORD = [
  { match: ['نووستن', 'نوستن', 'bed', 'sleep', 'room'], color: '#059669' }, // Emerald / Green
  { match: ['دانیشتن', 'sofa', 'جلوس', 'living', 'sit'], color: '#1d4ed8' }, // Sapphire Blue
  { match: ['کۆرنەر', 'corner', 'زاویة'], color: '#d97706' }, // Warm Amber / Bronze
  { match: ['نانخواردن', 'dining', 'طعام', 'مێز'], color: '#b91c1c' }, // Deep Crimson
  { match: ['ئۆفیس', 'office', 'مكتب'], color: '#4338ca' } // Indigo
];

/**
 * Resolves the color for a category (custom user color > keyword default > fallback hash)
 */
export function getCategoryColor(category, customCategoryColors = {}) {
  if (!category) return '#059669';

  const catId = typeof category === 'object' ? (category.id || '') : String(category);
  const catName = typeof category === 'object'
    ? `${category.name_ku || ''} ${category.name_en || ''} ${category.name_ar || ''} ${category.name || ''}`.toLowerCase()
    : String(category).toLowerCase();

  // 1. Check custom user color saved in settings
  if (customCategoryColors && customCategoryColors[catId]) {
    return normalizeHex(customCategoryColors[catId]);
  }

  // 2. Check smart keyword matching
  for (const item of CATEGORY_DEFAULTS_BY_KEYWORD) {
    if (item.match.some(kw => catName.includes(kw) || catId.toLowerCase().includes(kw))) {
      return item.color;
    }
  }

  // 3. Deterministic fallback hash
  let hash = 0;
  const str = catId || catName;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CATEGORY_COLOR_PALETTE.length;
  return CATEGORY_COLOR_PALETTE[index];
}

export function getCategoryBadgeStyle(category, customCategoryColors = {}) {
  const color = getCategoryColor(category, customCategoryColors);
  return {
    backgroundColor: hexToRgba(color, 0.1),
    color: color,
    borderColor: hexToRgba(color, 0.35)
  };
}
