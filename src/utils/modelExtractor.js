// ==============================================================
// SMART MODEL & CODE EXTRACTION ENGINE FOR EXCEL DESCRIPTIONS
// Ported & optimized from Ashley Liable Pro
// ==============================================================

export const DEPARTMENT_KEYWORDS = new Set([
  'accessories', 'accessory', 'furniture', 'furnishings', 'decor', 'home decor', 
  'wall art', 'art', 'lighting', 'lamps', 'rugs', 'bedding', 'mattress', 'outdoor',
  'living room', 'bedroom', 'dining room', 'home office', 'general', 'misc', 'item'
]);

/**
 * Clean any price string or number into a strict, clean numeric string (e.g. "$3,140.00" -> "3140" or "3140.50").
 */
export function cleanNumericPrice(val) {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') return isNaN(val) ? '' : String(val);
  const str = String(val).trim().replace(/,/g, '');
  const m = str.match(/-?\d+(\.\d+)?/);
  return m ? m[0] : '';
}

/**
 * Returns float number from any price representation safely.
 */
export function parsePriceToFloat(val) {
  const cleaned = cleanNumericPrice(val);
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Smart detection of columns in raw Excel rows.
 * Matches exact 4 columns (category_name_en, model_name_en, name_en, price_usd) first,
 * with strictly isolated fallbacks to prevent substring overlap (e.g. name_en inside category_name_en).
 */
export function detectExcelColumns(headers = [], sampleRows = []) {
  const cleanHeaders = headers.map(h => String(h || '').trim().toLowerCase().replace(/[\s-]+/g, '_'));

  // 1. EXACT 4-COLUMN MATCH (Highest Priority)
  let detectedCatIdx = cleanHeaders.findIndex(h => h === 'category_name_en' || h === 'category_name' || h === 'category' || h === 'cat_name');
  let detectedModelIdx = cleanHeaders.findIndex(h => h === 'model_name_en' || h === 'model_name' || h === 'model_no' || h === 'model');
  let detectedDescIdx = cleanHeaders.findIndex(h => h === 'name_en' || h === 'item_name_en' || h === 'description' || h === 'item_desc' || h === 'desc');
  let detectedPriceIdx = cleanHeaders.findIndex(h => h === 'price_usd' || h === 'price_usa' || h === 'price' || h === 'outlet_price_usd' || h === 'outlet_price_usa');

  // 2. FALLBACK FOR PRICE (if not found by exact match)
  if (detectedPriceIdx === -1) {
    const usaPriceKeywords = ['price_usd', 'price_usa', 'priceusd', 'priceusa', 'outlet_price', 'sale_price', 'usd', 'usa'];
    for (const kw of usaPriceKeywords) {
      const idx = cleanHeaders.findIndex((h, cIdx) => (h === kw || h.includes(kw)) && cIdx !== detectedCatIdx && cIdx !== detectedModelIdx && cIdx !== detectedDescIdx);
      if (idx !== -1) {
        detectedPriceIdx = idx;
        break;
      }
    }
  }

  if (detectedPriceIdx === -1) {
    const priceCandidates = [];
    cleanHeaders.forEach((h, idx) => {
      if (idx === detectedCatIdx || idx === detectedModelIdx || idx === detectedDescIdx) return;
      if (h.includes('price') || h.includes('نرخ') || h.includes('سعر') || h.includes('cost') || h.includes('amount')) {
        priceCandidates.push(idx);
      }
    });

    if (priceCandidates.length > 0) {
      let bestIdx = priceCandidates[0];
      let maxNonZeroCount = -1;
      priceCandidates.forEach(idx => {
        let nonZero = 0;
        const limit = Math.min(sampleRows.length, 50);
        for (let r = 0; r < limit; r++) {
          const val = sampleRows[r]?.[idx];
          const num = parsePriceToFloat(val);
          if (num > 0) nonZero++;
        }
        if (cleanHeaders[idx].includes('usa') || cleanHeaders[idx].includes('usd')) nonZero += 50;
        if (nonZero > maxNonZeroCount) {
          maxNonZeroCount = nonZero;
          bestIdx = idx;
        }
      });
      detectedPriceIdx = bestIdx;
    }
  }

  // 3. FALLBACK FOR MODEL (Exclude category & desc)
  if (detectedModelIdx === -1) {
    const modelKeywords = ['model_name', 'model', 'مۆدێل', 'item_name', 'product_name'];
    for (const kw of modelKeywords) {
      const idx = cleanHeaders.findIndex((h, cIdx) => (h === kw || h.includes(kw)) && cIdx !== detectedCatIdx && cIdx !== detectedDescIdx && cIdx !== detectedPriceIdx);
      if (idx !== -1) {
        detectedModelIdx = idx;
        break;
      }
    }
  }

  // 4. FALLBACK FOR DESCRIPTION (Strictly exclude category and model keywords!)
  if (detectedDescIdx === -1) {
    const descKeywords = ['description', 'desc', 'وەسف', 'item_desc'];
    for (const kw of descKeywords) {
      const idx = cleanHeaders.findIndex((h, cIdx) => (h === kw || h.includes(kw)) && !h.includes('category') && !h.includes('model') && cIdx !== detectedCatIdx && cIdx !== detectedModelIdx && cIdx !== detectedPriceIdx);
      if (idx !== -1) {
        detectedDescIdx = idx;
        break;
      }
    }
  }

  // 5. FALLBACK FOR CATEGORY
  if (detectedCatIdx === -1) {
    const catKeywords = ['category', 'cat', 'department', 'dept', 'section', 'family', 'class', 'پۆلێن', 'کەتەگۆری', 'بەش', 'قسم'];
    for (const kw of catKeywords) {
      const idx = cleanHeaders.findIndex((h, cIdx) => (h === kw || h.includes(kw)) && cIdx !== detectedModelIdx && cIdx !== detectedDescIdx && cIdx !== detectedPriceIdx);
      if (idx !== -1) {
        detectedCatIdx = idx;
        break;
      }
    }
  }

  // Final sanity assignments
  if (detectedPriceIdx === -1 && headers.length > 3) detectedPriceIdx = 3;
  if (detectedDescIdx === -1 && headers.length > 2) detectedDescIdx = 2;
  if (detectedModelIdx === -1 && headers.length > 1) detectedModelIdx = 1;
  if (detectedCatIdx === -1 && headers.length > 0) detectedCatIdx = 0;

  return {
    priceCol: detectedPriceIdx,
    modelCol: detectedModelIdx,
    descCol: detectedDescIdx,
    codeCol: -1,
    catCol: detectedCatIdx
  };
}

/**
 * Infer category name from description or explicit category column.
 */
export function inferCategoryFromText(text = '', explicitCategory = '') {
  if (explicitCategory && String(explicitCategory).trim()) {
    return String(explicitCategory).trim();
  }
  const str = String(text).toLowerCase().trim();
  if (str.startsWith('accessories') || str.includes(' - accessories') || str.includes('accessories -')) {
    return 'Accessories';
  }
  if (str.includes('sofa') || str.includes('living') || str.includes('دانیشتن') || str.includes('جلوس') || str.includes('bergere') || str.includes('بێرجەر') || str.includes('recliner') || str.includes('chair')) {
    return 'Living Room (Sofa)';
  }
  if (str.includes('bedroom') || str.includes('نووستن') || str.includes('bed') || str.includes('dresser') || str.includes('nightstand')) {
    return 'Bedroom';
  }
  if (str.includes('corner') || str.includes('کۆرنەر') || str.includes('sectional')) {
    return 'Corner';
  }
  if (str.includes('dining') || str.includes('نانخواردن') || str.includes('طعام')) {
    return 'Dining';
  }
  if (str.includes('office') || str.includes('ئۆفیس')) {
    return 'Office';
  }
  return '';
}

/**
 * Normalizes any category string into a standardized group key.
 * Used for strict category matching and eliminating conflicts (e.g. Accessories vs Sofa).
 */
export function getCategoryGroup(categoryNameOrId = '') {
  if (!categoryNameOrId) return 'unknown';
  const str = String(categoryNameOrId).toLowerCase().trim();

  // Accessories
  if (
    str.includes('accessori') || 
    str.includes('accessory') || 
    str.includes('ئێکسسوار') || 
    str.includes('إكسسوار') || 
    str.includes('decor') || 
    str.includes('lamp') || 
    str.includes('rug') || 
    str.includes('art') ||
    str.includes('lighting') ||
    str.includes('pillow') ||
    str.includes('cushion')
  ) {
    return 'accessories';
  }

  // Sofa / Living Room / Chair / Bergere
  if (
    str.includes('sofa') || 
    str.includes('living') || 
    str.includes('دانیشتن') || 
    str.includes('جلوس') || 
    str.includes('chair') || 
    str.includes('reclin') || 
    str.includes('بێرجەر') || 
    str.includes('bergere') ||
    str.includes('loveseat') ||
    str.includes('ottoman')
  ) {
    return 'sofa';
  }

  // Bedroom
  if (
    str.includes('bed') || 
    str.includes('sleep') || 
    str.includes('نووستن') || 
    str.includes('نوستن') || 
    str.includes('نوم') || 
    str.includes('dresser') || 
    str.includes('nightstand') ||
    str.includes('mattress')
  ) {
    return 'bedroom';
  }

  // Corner / Sectional
  if (
    str.includes('corner') || 
    str.includes('sectional') || 
    str.includes('کۆرنەر') || 
    str.includes('زاویة') || 
    str.includes('l-shape')
  ) {
    return 'corner';
  }

  // Dining
  if (
    str.includes('dining') || 
    str.includes('طعام') || 
    str.includes('نانخواردن') || 
    str.includes('table') || 
    str.includes('مێز')
  ) {
    return 'dining';
  }

  // Office
  if (
    str.includes('office') || 
    str.includes('ئۆفیس') || 
    str.includes('مكتب') || 
    str.includes('desk')
  ) {
    return 'office';
  }

  return 'other';
}

/**
 * Smart extraction of model name, code, price, and category from messy Excel descriptions.
 */
export function extractSmartModel(rawDesc, rawModel = '', rawCode = '', rawPrice = '', rawCategory = '') {
  let desc = String(rawDesc || '').trim();
  let model = String(rawModel || '').trim();
  let code = String(rawCode || '').trim();
  const safePrice = cleanNumericPrice(rawPrice) || (rawPrice !== undefined && rawPrice !== null ? String(rawPrice).trim() : '');
  const category = inferCategoryFromText(desc, rawCategory);

  // 1. Identify codes / SKUs from description or inputs
  // Pattern A: Alphanumeric code like C6183-IVOR, B697-31, A4000123
  const skuRegexLetter = /\b([A-Z]\d{2,4}-\d{1,4}[A-Z0-9-]*|[A-Z]\d{3,8}(?:-[A-Z0-9]+)?)\b/i;
  // Pattern B: Numeric code with variant suffix like 76642- Black Set or 73642-BLAC Set
  const skuRegexVariant = /\b(\d{4,7}\s*-\s*[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)\b/i;
  // Pattern C: Pure numeric barcode/SKU
  const skuRegexNumeric = /\b(\d{5,13})\b/;

  let detectedCode = '';
  const mVariant = desc.match(skuRegexVariant);
  const mLetter = desc.match(skuRegexLetter);
  if (mVariant) detectedCode = mVariant[1];
  else if (mLetter) detectedCode = mLetter[1].toUpperCase();
  else {
    const mNum = desc.match(skuRegexNumeric);
    if (mNum) detectedCode = mNum[1];
  }

  if (!code && detectedCode) code = detectedCode;

  // 2. If model was explicitly provided in an Excel column
  if (model) {
    const hasTrailingDash = model.endsWith('-');
    const cleanBaseModel = model.replace(/[-_\s]+$/, '').trim();
    const isSeriesPrefix = hasTrailingDash || /^[A-Z]\d{2,4}$/i.test(cleanBaseModel) || /^\d{4,7}$/.test(cleanBaseModel);

    // If description contains the exact full variant starting with cleanBaseModel (e.g. 'B719-56W1' when model is 'b719-')
    if (desc && isSeriesPrefix) {
      const escBase = cleanBaseModel.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Look for full variant code in desc: e.g. B719-56W1, B719-31, 76642- Black Set
      const fullVariantRegex = new RegExp('\\b(' + escBase + '-\\d{1,4}[A-Za-z0-9-]*|' + escBase + '\\s*-\\s*[A-Za-z0-9]+(?:\\s+[A-Za-z0-9]+)?)\\b', 'i');
      const fvMatch = desc.match(fullVariantRegex);
      if (fvMatch) {
        const rawMatched = fvMatch[1].trim();
        const parts = rawMatched.split(/\s*-\s*/);
        const lastPart = parts.length > 1 ? parts[parts.length - 1].toLowerCase().trim() : '';
        // Make sure the suffix is not a generic department word like "accessories"
        if (!DEPARTMENT_KEYWORDS.has(lastPart)) {
          const fullVariant = rawMatched.toUpperCase();
          return {
            code: fullVariant,
            model: fullVariant,
            rawDesc: desc,
            price: safePrice,
            category
          };
        }
      }
    }

    if (detectedCode && isSeriesPrefix && normalizeKey(detectedCode).startsWith(normalizeKey(cleanBaseModel)) && detectedCode.length > cleanBaseModel.length) {
      return {
        code: detectedCode,
        model: detectedCode,
        rawDesc: desc,
        price: safePrice,
        category
      };
    }

    // Default when model is already a clean full name (e.g. "Clan", "Porter Dresser")
    const displayModel = model.endsWith('-') ? cleanBaseModel : model;
    return {
      code: code || (displayModel.match(/^[A-Z0-9\s-]+$/i) ? displayModel : ''),
      model: displayModel,
      rawDesc: desc,
      price: safePrice,
      category
    };
  }

  // 3. Extract model when only description is present
  // Split into segments by " - " or "|" or "/"
  const rawSegments = desc.split(/\s+[-–—|/]\s+/).map(s => s.trim()).filter(Boolean);
  let chosenSegment = '';

  if (rawSegments.length > 1) {
    const seg0Lower = rawSegments[0].toLowerCase();
    if (DEPARTMENT_KEYWORDS.has(seg0Lower)) {
      // Segment 0 is a department keyword like "Accessories" -> inspect segment 1
      chosenSegment = rawSegments[1];
    } else {
      chosenSegment = rawSegments[0];
    }
  } else if (rawSegments.length === 1) {
    chosenSegment = rawSegments[0];
  } else {
    chosenSegment = desc;
  }

  // Check if chosenSegment is code with variant like "76642- Black Set" or "73642-BLAC Set"
  if (/^\d{4,7}\s*-\s*[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*$/i.test(chosenSegment)) {
    return {
      code: code || chosenSegment,
      model: chosenSegment,
      rawDesc: desc,
      price: safePrice,
      category
    };
  }

  // If chosenSegment is pure code/model (like "D8917", "C5473", "C6183-IVOR", "B697-31", "A4000123")
  if (/^[A-Z]\d{2,4}-\d{1,4}[A-Z0-9-]*$/i.test(chosenSegment) || /^[A-Z]\d{3,8}(?:-[A-Z0-9]+)?$/i.test(chosenSegment)) {
    return {
      code: code || chosenSegment.toUpperCase(),
      model: chosenSegment.toUpperCase(),
      rawDesc: desc,
      price: safePrice,
      category
    };
  }

  // Check if description has an embedded code-variant
  if (mVariant && (DEPARTMENT_KEYWORDS.has(chosenSegment.toLowerCase()) || chosenSegment === desc || chosenSegment.length > 30)) {
    chosenSegment = mVariant[1];
    return {
      code: code || chosenSegment,
      model: chosenSegment,
      rawDesc: desc,
      price: safePrice,
      category
    };
  }

  // Otherwise, clean candidate text
  let candidate = chosenSegment;

  // Strip leading inventory codes like 100-24425
  candidate = candidate.replace(/^\d{3,5}-\d{2,7}\s+/g, '');

  // If candidate starts with a code like "B697-31 Porter Dresser"
  const leadCodeMatch = candidate.match(/^([A-Z]\d{2,4}-\d{1,4}|[A-Z]\d{3,8}(?:-[A-Z0-9]+)?)\s+(.*)$/i);
  if (leadCodeMatch) {
    if (!code) code = leadCodeMatch[1].toUpperCase();
    candidate = leadCodeMatch[2];
  }

  // Strip generic prefixes (e.g. 'SKU:', 'Code:', 'Item #', 'Item:', 'کۆد:')
  candidate = candidate.replace(/^(sku|code|item\s*#?|item|کۆد\s*[:\-])\s*[:\-]?\s*/gi, '').trim();

  // Strip dimensions and measurements
  candidate = candidate.replace(/\b\d+(\.\d+)?\s*["'xX*×]\s*\d+(\.\d+)?(\s*["'xX*×]\s*\d+(\.\d+)?)?(\s*(cm|mm|inch|in|m|ft))?\b/gi, ' ');
  candidate = candidate.replace(/\b\d+(\.\d+)?\s*(cm|mm|inch|in|ft|meter|ملم|سم)\b/gi, ' ');

  // Strip filler specs like 'w/ ...', 'with ...'
  candidate = candidate.replace(/\b(w\/|with)\s+[^,;\-|/]+/gi, ' ');

  // Strip fluff words ONLY if candidate is longer than 2 words
  const words = candidate.split(/\s+/).filter(Boolean);
  if (words.length > 2) {
    const fluffEndRegex = /\s*\b(dark brown|rustic brown|rustic finish|chipped white|antique white|distressed white|weathered grey|warm brown|espresso|cobblestone|charcoal|fabric|leather|faux leather|velvet|linen|wood|set of \d+|pack of \d+|\d+\s*drawers?|\d+\s*pcs?|boxed|farmhouse)\b.*$/i;
    candidate = candidate.replace(fluffEndRegex, '').trim();
  }

  candidate = candidate.replace(/[()[\]{}*#_]/g, ' ').replace(/\s+/g, ' ').trim();

  if (/^[a-zA-Z\s]+$/.test(candidate)) {
    candidate = candidate.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  return {
    code: code || '',
    model: candidate || desc.slice(0, 35),
    rawDesc: desc,
    price: safePrice,
    category
  };
}

/**
 * Normalize string for resilient comparisons: removes spaces, dashes, underscores, lowercases.
 */
export function normalizeKey(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

// ==============================================================
// name_en STRUCTURE PARSER  -  fixes the "two-part model number" problem
// ==============================================================
// In the master sheet the real model number is split over two columns:
//   model_name_en = "12000"                                     <- first part (series)
//   name_en       = "Corner - 1200067 - Right-Arm Facing Sofa"  <- series + variant ("67") + details
// name_en comes in these shapes:
//   1) "<Category> - <FULL CODE> - <Description>"   Corner - 1200067 - Right-Arm Facing Sofa
//   2) "<Model> - <Category> - <Description>"       Milano - Corner - Armless Module 150 cm
//   3) free text, sometimes starting with a code    b719-56W1 Demarlos King Bed with Storage
const KNOWN_CATEGORY_KEYS = new Set([
  '1seatersoft', 'accessories', 'accessory', 'armchair', 'babybeds', 'bed', 'bedcover', 'bedroom', 'bench',
  'berger', 'blanket', 'bookcase', 'carpet', 'chair', 'chairleather', 'chairwitharm', 'clock', 'console',
  'corner', 'curtain', 'cushion', 'deskset', 'diningroom', 'door', 'dressingroom', 'dressior', 'fabric',
  'flower', 'gardenset', 'homeoffice', 'lamp', 'lighting', 'livingroom', 'mattress', 'meetingtable', 'mirror',
  'officeset', 'ofissetchair', 'ofissetsofas', 'pillow', 'pouf', 'receptiondesks', 'sehpa', 'singleswing',
  'sofaset', 'sofa', 'tvstand', 'table', 'tree', 'wallart', 'wallunit', 'workinggroups', 'youngroom'
]);

// A separator is a dash/pipe with a space on (at least) one side, so "C6183-IVOR" and "Right-Arm" stay whole.
const NAME_SEPARATOR = /\s+[-–—|]\s*|\s*[-–—|]\s+/;
const CODE_SHAPE = /^[A-Za-z0-9][A-Za-z0-9._/#-]*$/;
const LEADING_CODE = /^([A-Za-z]{0,3}\d{3,}[A-Za-z0-9._/]*(?:-[A-Za-z0-9._/]+)*)\s+(.+)$/;

function isCategoryWord(part, category, knownCats) {
  const k = normalizeKey(part);
  if (!k) return false;
  if (category && k === normalizeKey(category)) return true;
  if (knownCats && knownCats.has(k)) return true;
  return KNOWN_CATEGORY_KEYS.has(k);
}

function looksLikeCode(s) {
  return !!s && CODE_SHAPE.test(s) && /\d/.test(s);
}

/**
 * Splits a full code into [series part | variant part] using model_name_en.
 * e.g. code "1200067" + model "12000" -> { head: "12000", tail: "67" }
 */
export function splitCodeByModel(code = '', modelName = '') {
  const c = String(code || '');
  const m = cleanModelNumber(modelName || '');
  if (c && m && c.length > m.length && c.toLowerCase().startsWith(m.toLowerCase())) {
    return { head: c.slice(0, m.length), tail: c.slice(m.length) };
  }
  return { head: c, tail: '' };
}

/**
 * Understands name_en. Returns:
 * { layout: 'category-code' | 'model-category' | 'free',
 *   prefix, code (the FULL model number), modelFromName, desc (human description), head, tail }
 */
export function parseNameEn(nameEn = '', category = '', modelName = '', knownCats = null) {
  const text = String(nameEn || '').replace(/\s+/g, ' ').trim();
  const empty = { layout: 'free', prefix: '', code: '', modelFromName: '', desc: text, head: '', tail: '' };
  if (!text) return empty;

  const parts = text.split(NAME_SEPARATOR).map(p => p.trim()).filter(Boolean);

  if (parts.length >= 2 && isCategoryWord(parts[0], category, knownCats)) {
    if (looksLikeCode(parts[1])) {
      const { head, tail } = splitCodeByModel(parts[1], modelName);
      return { layout: 'category-code', prefix: parts[0], code: parts[1], modelFromName: '', desc: parts.slice(2).join(' - '), head, tail };
    }
    return { layout: 'category-code', prefix: parts[0], code: '', modelFromName: '', desc: parts.slice(1).join(' - '), head: '', tail: '' };
  }

  if (parts.length >= 2 && isCategoryWord(parts[1], category, knownCats)) {
    return { layout: 'model-category', prefix: parts[1], code: '', modelFromName: parts[0], desc: parts.slice(2).join(' - '), head: '', tail: '' };
  }

  const lead = text.match(LEADING_CODE);
  if (lead) {
    const { head, tail } = splitCodeByModel(lead[1], modelName);
    return { layout: 'free', prefix: '', code: lead[1], modelFromName: '', desc: lead[2].trim(), head, tail };
  }
  return empty;
}

// Normalised search keys per Excel row (cached, so searching 19k rows stays instant)
const rowKeyCache = new WeakMap();
const EMPTY_KEYS = { parsed: null, code: '', codeN: '', modelN: '', nameModelN: '', catN: '', descN: '', hayN: '' };

export function getRowKeys(row) {
  if (!row || typeof row !== 'object') return EMPTY_KEYS;
  let k = rowKeyCache.get(row);
  if (k) return k;
  const rawDesc = String(row.rawDesc || '');
  const rawModel = cleanModelNumber(row.rawModel || '');
  const parsed = parseNameEn(rawDesc, row.category || '', rawModel, row.knownCats);
  const code = row.fullCode !== undefined ? row.fullCode : parsed.code;
  k = {
    parsed,
    code,
    codeN: normalizeKey(code) || normalizeKey(row.extractedCode),
    modelN: normalizeKey(rawModel),
    nameModelN: normalizeKey(parsed.modelFromName),
    catN: normalizeKey(row.category),
    descN: normalizeKey(parsed.desc),
    hayN: normalizeKey(`${row.category || ''} ${rawModel} ${rawDesc} ${row.suggestedModel || ''}`)
  };
  rowKeyCache.set(row, k);
  return k;
}

/**
 * Compares an extracted staging item with the current catalog of models.
 * Returns match object:
 * {
 *   matchedModel: model || null,
 *   matchType: 'exact_code' | 'exact_name' | 'partial' | 'none',
 *   confidence: 100 | 90 | 70 | 0,
 *   priceDifference: number | null,
 *   isPriceEqual: boolean
 * }
 */
export function matchStagingItemWithCatalog(stagingItem, catalogModels = [], categories = []) {
  if (!catalogModels || catalogModels.length === 0) {
    return {
      matchedModel: null,
      matchType: 'none',
      confidence: 0,
      priceDifference: null,
      isPriceEqual: false,
      isCategoryMatched: false
    };
  }

  const normExtractedCode = normalizeKey(stagingItem.extractedCode || stagingItem.rawCode);
  const normPredictedModel = normalizeKey(stagingItem.predictedModel);
  const normRawDesc = normalizeKey(stagingItem.rawDesc);

  // Group of the Excel staging item
  const stagingCatStr = `${stagingItem.category || ''} ${stagingItem.rawDesc || ''}`;
  const stagingGroup = getCategoryGroup(stagingCatStr);

  let bestMatch = null;
  let matchType = 'none';
  let bestScore = -9999;
  let isCategoryMatched = false;

  for (const model of catalogModels) {
    const normModelName = normalizeKey(model.name);
    const normModelSku = normalizeKey(model.sku);

    // Get catalog model's category string and group
    const cat = categories.find(c => c.id === model.categoryId);
    const modelCatStr = cat ? `${cat.name_en || ''} ${cat.name_ku || ''} ${cat.name_ar || ''} ${cat.name || ''}` : (model.categoryId || '');
    const modelGroup = getCategoryGroup(modelCatStr);

    // Category conflict check:
    // If one is accessories and the other is sofa/bedroom/dining/corner -> CONFLICT!
    const isConflict = (
      (stagingGroup === 'accessories' && modelGroup !== 'accessories' && modelGroup !== 'unknown' && modelGroup !== 'other') ||
      (stagingGroup !== 'accessories' && stagingGroup !== 'unknown' && stagingGroup !== 'other' && modelGroup === 'accessories') ||
      (stagingGroup === 'sofa' && modelGroup === 'bedroom') ||
      (stagingGroup === 'bedroom' && modelGroup === 'sofa') ||
      (stagingGroup === 'dining' && (modelGroup === 'bedroom' || modelGroup === 'sofa'))
    );

    if (isConflict) {
      // Disqualify this candidate because categories oppose (e.g. Accessories vs Sofa Set)!
      continue;
    }

    const isSameCat = (stagingGroup !== 'unknown' && modelGroup !== 'unknown' && stagingGroup === modelGroup);

    let score = 0;
    let currentMatchType = 'none';

    // 1. Exact SKU / Code match (Highest base score)
    if (normExtractedCode && normModelSku && normExtractedCode === normModelSku) {
      score = 100;
      currentMatchType = 'exact_code';
    } else if (normExtractedCode && normModelName && normExtractedCode === normModelName) {
      score = 98;
      currentMatchType = 'exact_code';
    }
    // 2. Exact Model Name match
    else if (normPredictedModel && normModelName && normPredictedModel === normModelName) {
      score = 95;
      currentMatchType = 'exact_name';
    } else if (normPredictedModel && normModelSku && normPredictedModel === normModelSku) {
      score = 92;
      currentMatchType = 'exact_name';
    }
    // 3. Exact full variant code contained inside model name
    // (e.g. normExtractedCode is 'b71956w1' and normModelName is 'b71956w1demarloskingbed')
    // NOTE: Must have at least 4 characters and contain digits to avoid single letter matches
    else if (normExtractedCode && normExtractedCode.length >= 4 && normModelName.includes(normExtractedCode)) {
      score = 90;
      currentMatchType = 'exact_code';
    } else if (normModelSku && normModelSku.length >= 4 && normRawDesc.includes(normModelSku)) {
      score = 88;
      currentMatchType = 'exact_code';
    }
    // 4. Clean named furniture match ONLY (e.g. "Clan" or "Darcy Sofa")
    // STRICT RULE: If normPredictedModel is an alphanumeric SKU series (e.g. "b719", "b697"),
    // NEVER match partially against "b719-31"! The variant must be exact!
    else if (
      normPredictedModel && 
      normModelName && 
      !/^[a-z]\d{2,4}/i.test(normPredictedModel) && 
      !/^\d{4,8}/.test(normPredictedModel) &&
      (normModelName.includes(normPredictedModel) || normPredictedModel.includes(normModelName))
    ) {
      score = 80;
      currentMatchType = 'partial';
    }

    if (score >= 80) {
      // Category affinity weighting
      if (isSameCat) {
        score += 40; // Heavy bonus for matching the exact same category!
      } else if (stagingGroup !== 'unknown' && modelGroup !== 'unknown' && stagingGroup !== modelGroup) {
        score -= 30; // Penalty if both categories are known but different
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = model;
        matchType = currentMatchType;
        isCategoryMatched = isSameCat;
      }
    }
  }

  // Strict Threshold: If score did not meet high-confidence threshold, leave blank!
  if (bestScore < 80) {
    bestMatch = null;
    matchType = 'none';
  }

  const cat = bestMatch ? categories.find(c => c.id === bestMatch.categoryId) : null;
  const catalogCategoryName = cat ? (cat.name_en || cat.name_ku || cat.name || '') : '';

  const rawStagingPrice = parsePriceToFloat(stagingItem.price);
  const currentCatalogPrice = bestMatch ? parsePriceToFloat(bestMatch.originalPrice || bestMatch.salePrice) : null;
  const currentSalePrice = bestMatch ? parsePriceToFloat(bestMatch.salePrice) : 0;
  const hasValidPrices = rawStagingPrice > 0 && currentCatalogPrice !== null && !isNaN(currentCatalogPrice);
  const priceDifference = hasValidPrices ? (rawStagingPrice - currentCatalogPrice) : null;
  const isPriceEqual = hasValidPrices ? Math.abs(rawStagingPrice - currentCatalogPrice) < 0.001 : false;

  return {
    matchedModel: bestMatch,
    matchType,
    confidence: bestMatch ? Math.min(100, Math.max(1, bestScore)) : 0,
    priceDifference,
    isPriceEqual,
    isCategoryMatched,
    currentCatalogPrice,
    currentSalePrice,
    catalogCategoryName
  };
}

/**
 * Cleans status words (ئاوت لێت, ئاوتلێت, ستۆک, یەدەگ, outlet, stock) from a model name or SKU,
 * ensuring matching is strictly based on the real model number.
 */
export function cleanModelNumber(val) {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  // Strip out status words: outlet, stock, item, used, new
  str = str.replace(/\b(outlet|stock|item|used|new)\b/gi, '');
  // Strip Kurdish/Arabic status words: ئاوت لێت, ئاوتلێت, ئاوت لیت, ستۆک, ستۆك, ستوك, یەدەگ, کاڵا, نوێ
  str = str.replace(/(ئاوت\s*لێت|ئاوت\s*لیت|ستۆک|ستۆك|ستوك|یەدەگ|کاڵا|نوێ)/gi, '');
  // Clean surrounding slashes, dashes, colons, or whitespace left over
  return str.replace(/^[\s/:|#-]+|[\s/:|#-]+$/g, '').trim();
}

/**
 * Reverse Direction Matching: Find the matching row in an Excel Master Sheet for a Catalog Model.
 * Strictly matches via Model Number (model_name_en / suggestedModel / name_en), ignoring any status like "ئاوتلێت".
 */
export function findExcelMatchForCatalogModel(catalogModel, excelItems = [], categories = []) {
  if (!catalogModel || !excelItems || excelItems.length === 0) {
    return {
      matchedExcelRow: null,
      excelPrice: null,
      isCategoryMatched: false,
      confidence: 0
    };
  }

  const cat = categories.find(c => c.id === catalogModel.categoryId);
  const catalogCatName = cat ? (cat.name_en || cat.name_ku || cat.name || '') : '';
  const catalogCatGroup = getCategoryGroup(catalogCatName || catalogModel.name);

  // Clean catalog model keys strictly by stripping status words like "ئاوتلێت"
  const cleanSku = cleanModelNumber(catalogModel.sku || '');
  const cleanName = cleanModelNumber(catalogModel.name || '');
  const normSku = normalizeKey(cleanSku);
  const normName = normalizeKey(cleanName);

  // Extract possible code/SKU from catalog model name if sku is generic
  const nameSkuMatch = String(cleanName || catalogModel.name || '').match(/([A-Z]\d{2,4}-\d{1,4}[A-Za-z0-9-]*|[A-Z]\d{3,8}(?:-[A-Z0-9]+)?|\d{3,6}-\d{2,6}|\d{4,12})/i);
  const extractedSkuFromName = nameSkuMatch ? normalizeKey(nameSkuMatch[1]) : '';
  const effectiveSku = normSku || extractedSkuFromName;

  let bestMatch = null;
  let bestScore = -1;
  let isCategoryMatched = false;

  for (const item of excelItems) {
    let score = 0;
    // item.rawModel comes directly from model_name_en in Excel!
    const excelModelRaw = cleanModelNumber(item.rawModel || item.predictedModel || item.model || '');
    const excelDescRaw = cleanModelNumber(item.rawDesc || item.desc || '');
    const excelSuggestedRaw = cleanModelNumber(item.suggestedModel || '');
    const itemModelNorm = normalizeKey(excelModelRaw);
    const itemDescNorm = normalizeKey(excelDescRaw);
    const itemSuggestedNorm = normalizeKey(excelSuggestedRaw);
    const itemCatGroup = getCategoryGroup(item.category || excelDescRaw);

    const isSameCat = catalogCatGroup !== 'unknown' && itemCatGroup !== 'unknown' && catalogCatGroup === itemCatGroup;
    const isConflictingCat = catalogCatGroup !== 'unknown' && itemCatGroup !== 'unknown' && catalogCatGroup !== itemCatGroup;

    // Strict Disqualification: e.g. Catalog item is a Sofa, but Excel item is an Accessory
    if (isConflictingCat && (catalogCatGroup === 'accessories' || itemCatGroup === 'accessories')) {
      continue;
    }

    // 0. Exact FULL model number (series + variant, read from name_en) - strongest evidence of all
    const rowKeys = getRowKeys(item);

    // Variant guard: catalog "B771-36" must NEVER take the price of "B771-31" just because the series (B771) is equal.
    // Only the dash may differ ("B771-36" == "B77136"); different numbers after it = different model -> skip the row.
    if (rowKeys.codeN && itemModelNorm) {
      const catalogIds = [effectiveSku, normSku, normName].filter(Boolean);
      const variantOk = catalogIds.some(id => id === rowKeys.codeN || (rowKeys.codeN.length >= 4 && id.includes(rowKeys.codeN)));
      const catalogHasVariant = catalogIds.some(id => /\d/.test(id) && id.length > itemModelNorm.length && id.startsWith(itemModelNorm));
      if (!variantOk && catalogHasVariant) continue;
    }

    if (rowKeys.codeN && rowKeys.codeN.length >= 3 &&
        (rowKeys.codeN === effectiveSku || rowKeys.codeN === normSku || rowKeys.codeN === normName)) {
      score = 110;
    }

    // 1. Exact Model Number Match with suggestedModel or model_name_en (Highest Priority = 100)
    if (score < 100 && itemSuggestedNorm) {
      if (effectiveSku && itemSuggestedNorm === effectiveSku) {
        score = 100;
      } else if (normSku && itemSuggestedNorm === normSku) {
        score = 100;
      } else if (normName && itemSuggestedNorm === normName) {
        score = 100;
      }
    }

    if (score < 100 && itemModelNorm) {
      if (effectiveSku && itemModelNorm === effectiveSku) {
        score = 100;
      } else if (normName && itemModelNorm === normName) {
        score = 100;
      } else if (normSku && itemModelNorm === normSku) {
        score = 100;
      }
    }

    // 2. Exact Model Number found in name_en (Excel Description)
    if (score < 95) {
      if (effectiveSku && effectiveSku.length >= 3 && itemDescNorm.includes(effectiveSku)) {
        score = 95;
      } else if (normSku && normSku.length >= 3 && itemDescNorm.includes(normSku)) {
        score = 95;
      } else if (normName && normName.length >= 4 && itemDescNorm.includes(normName)) {
        score = 95;
      }
    }

    // 3. Substring match for furniture names (e.g. "Clan" in "Clan TV Stand")
    if (score < 90 && itemModelNorm && itemModelNorm.length >= 3) {
      if (normName && (normName.includes(itemModelNorm) || itemModelNorm.includes(normName))) {
        score = 90;
      } else if (normSku && (normSku.includes(itemModelNorm) || itemModelNorm.includes(normSku))) {
        score = 90;
      }
    }

    if (score >= 85) {
      if (isSameCat) score += 20;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
        isCategoryMatched = isSameCat;
      }
    }
  }

  // Strict Threshold: If score < 85, leave BLANK (white / spêtî)!
  if (bestScore < 85 || !bestMatch) {
    return {
      matchedExcelRow: null,
      excelPrice: null,
      isCategoryMatched: false,
      confidence: 0
    };
  }

  const cleanPrice = parsePriceToFloat(bestMatch.price);

  return {
    matchedExcelRow: bestMatch,
    excelPrice: cleanPrice > 0 ? cleanPrice : null,
    isCategoryMatched,
    confidence: Math.min(100, bestScore)
  };
}

/**
 * Generates an intelligent suggestion for the item's exact model/code
 * based on category_name_en, model_name_en, and name_en.
 * 
 * Returns {
 *   suggestedModel: string,  // e.g. "1200067" or "U7160458" or "Clan" or "b719-56W1"
 *   reason: string           // explanation in Kurdish Sorani
 * }
 */
export function suggestModelFromRow(category = '', modelName = '', nameEn = '', knownCats = null) {
  const cat = String(category || '').trim();
  const rawModel = cleanModelNumber(String(modelName || '').trim());
  const desc = String(nameEn || '').trim();
  const reasonFor = (v) => `پێشنیاری من ئەوەیە ئەم مۆدێلە بەپێی کۆڵۆمی کەتەگۆری و مۆدێل و name_en بریتییە لە: ${v}`;

  // 1. Structured name_en:  "[Category] - [FULL CODE] - [Description]"  or  "[Model] - [Category] - [Description]"
  //    "Corner - 1200067 - Right-Arm Facing Sofa" -> 1200067   |   "Accessories - C6183-IVOR - Accessories" -> C6183-IVOR
  //    "Clan - Wall Unit - TV Stand" -> Clan
  const parsed = parseNameEn(desc, cat, rawModel, knownCats);
  if (parsed.code) {
    return { suggestedModel: parsed.code, reason: reasonFor(parsed.code) };
  }
  if (parsed.layout === 'model-category' && parsed.modelFromName) {
    return { suggestedModel: parsed.modelFromName, reason: reasonFor(parsed.modelFromName) };
  }

  const parts = desc.split(/\s*[-–—|/]\s*/).map(p => p.trim()).filter(Boolean);

  // 2. Specific variant code in name_en when model_name_en is a prefix
  // e.g. model is "b719-" and name_en has "b719-56W1"
  // e.g. model is "12000" and name_en has "1200067"
  if (rawModel) {
    const cleanPrefix = rawModel.replace(/[-_/\s]+$/, '').trim();
    if (cleanPrefix) {
      const tokenRegex = new RegExp(`\\b(${cleanPrefix}[A-Za-z0-9_-]+)\\b`, 'i');
      const m = desc.match(tokenRegex);
      if (m && m[1] && m[1].length > cleanPrefix.length) {
        return {
          suggestedModel: m[1],
          reason: `پێشنیاری من ئەوەیە ئەم مۆدێلە بەپێی کۆڵۆمی کەتەگۆری و مۆدێل و name_en بریتییە لە: ${m[1]}`
        };
      }
    }
  }

  // 3. Look for alphanumeric code pattern in name_en
  const codeMatch = desc.match(/\b([A-Z]\d{2,4}-\d{1,4}[A-Za-z0-9-]*|[A-Z]\d{3,8}(?:-[A-Z0-9]+)?|\d{5,12})\b/i);
  if (codeMatch && codeMatch[1]) {
    return {
      suggestedModel: codeMatch[1],
      reason: `پێشنیاری من ئەوەیە ئەم مۆدێلە بەپێی کۆڵۆمی کەتەگۆری و مۆدێل و name_en بریتییە لە: ${codeMatch[1]}`
    };
  }

  // 4. Fall back to model_name_en if clean
  if (rawModel && rawModel !== '-') {
    return {
      suggestedModel: rawModel,
      reason: `پێشنیاری من ئەوەیە ئەم مۆدێلە بەپێی کۆڵۆمی کەتەگۆری و مۆدێل و name_en بریتییە لە: ${rawModel}`
    };
  }

  // 5. First part of name_en
  if (parts.length > 0) {
    return {
      suggestedModel: parts[0],
      reason: `پێشنیاری من ئەوەیە ئەم مۆدێلە بەپێی کۆڵۆمی کەتەگۆری و مۆدێل و name_en بریتییە لە: ${parts[0]}`
    };
  }

  return {
    suggestedModel: '-',
    reason: 'پێشنیاری مۆدێل بەردەست نییە'
  };
}

function commonPrefixLen(a, b) {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
}

/**
 * Ranks Excel rows and returns [{ item, score, reason }] - the closest matches first (default top 15).
 *
 * The query is compared in NORMALISED form (letters+digits only), so all of these find the same row:
 *   "1200067"   "12000-67"   "12000 67"   "12000/67"   "corner 1200067"
 * i.e. the model number may be typed whole OR in the two parts the sheet keeps it in
 * (model_name_en + the tail that lives inside name_en).
 *
 * reason: 'code-exact' | 'code-prefix' | 'model-exact' | 'model-prefix' | 'code-part' | 'words' | 'close'
 */
export function rankExcelRowsDetailed(rows = [], query = '', targetCol = 'all', targetCat = 'all', limit = 15) {
  if (!rows || rows.length === 0) return [];
  const q = String(query || '').trim().toLowerCase();

  const inCategory = (item) => targetCat === 'all' || getCategoryGroup(item.category || item.rawDesc) === targetCat;

  // No query -> just the first rows (optionally filtered by category)
  if (!q) {
    const out = [];
    for (const item of rows) {
      if (!inCategory(item)) continue;
      out.push({ item, score: 0, reason: '' });
      if (out.length >= limit) break;
    }
    return out;
  }

  const cleanQ = cleanModelNumber(q).toLowerCase() || q;
  const qN = normalizeKey(cleanQ) || normalizeKey(q);
  const tokens = q.split(/[\s,;|]+/).map(normalizeKey).filter(t => t.length >= 2);
  // "12000 67" typed as two words -> also try them glued together
  const joins = [];
  const rawTokens = q.split(/[\s,;|]+/).map(normalizeKey).filter(Boolean);
  for (let i = 0; i < rawTokens.length - 1; i++) joins.push(rawTokens[i] + rawTokens[i + 1]);

  const scored = [];

  for (const item of rows) {
    if (!inCategory(item)) continue;
    const kx = getRowKeys(item);
    const priceStr = String(item.price || '').toLowerCase();
    const suggestedN = normalizeKey(cleanModelNumber(item.suggestedModel || ''));
    const descLower = String(item.rawDesc || item.desc || '').toLowerCase();

    let score = 0;
    let reason = '';
    const bump = (s, r) => { if (s > score) { score = s; reason = r; } };

    if (targetCol === 'cat') {
      if (!qN || !kx.catN.includes(qN)) continue;
      bump(kx.catN === qN ? 500 : 200, 'words');
    } else if (targetCol === 'model') {
      const hit = qN && (kx.modelN.includes(qN) || kx.codeN.includes(qN) || kx.nameModelN.includes(qN));
      if (!hit) continue;
      bump((kx.modelN === qN || kx.codeN === qN || kx.nameModelN === qN) ? 500 : 250, 'model-exact');
    } else if (targetCol === 'desc') {
      if (!descLower.includes(q) && !(qN.length >= 3 && kx.hayN.includes(qN))) continue;
      bump(descLower.startsWith(q) ? 400 : 200, 'words');
    } else if (targetCol === 'price') {
      if (!priceStr.includes(q)) continue;
      bump(priceStr === q ? 500 : 200, 'words');
    } else if (targetCol === 'suggested') {
      if (!qN || (!suggestedN.includes(qN) && !kx.codeN.includes(qN))) continue;
      bump((suggestedN === qN || kx.codeN === qN) ? 500 : 250, 'code-exact');
    } else {
      // ALL columns, closeness weighted
      if (qN.length >= 2) {
        if (kx.codeN) {
          if (kx.codeN === qN) bump(1000, 'code-exact');
          else if (qN.length >= 3 && kx.codeN.startsWith(qN)) bump(700, 'code-prefix');
          else if (qN.length >= 4 && kx.codeN.includes(qN)) bump(450, 'code-part');
        }
        if (kx.modelN) {
          if (kx.modelN === qN) bump(850, 'model-exact');
          else if (qN.length >= 3 && kx.modelN.startsWith(qN)) bump(500, 'model-prefix');
        }
        if (kx.nameModelN) {
          if (kx.nameModelN === qN) bump(850, 'model-exact');
          else if (qN.length >= 3 && kx.nameModelN.startsWith(qN)) bump(500, 'model-prefix');
        }
        if (suggestedN && suggestedN === qN) bump(950, 'code-exact');
      }
      for (const j of joins) {
        if (j.length < 4 || !kx.codeN) continue;
        if (kx.codeN === j) bump(950, 'code-exact');
        else if (kx.codeN.startsWith(j)) bump(650, 'code-prefix');
      }

      // word coverage (all words found -> big bonus)
      if (tokens.length > 0) {
        let hit = 0;
        for (const t of tokens) if (kx.hayN.includes(t)) hit++;
        if (hit > 0) {
          score += Math.round((hit / tokens.length) * 140) + (hit === tokens.length && tokens.length > 1 ? 120 : 0);
          if (!reason) reason = 'words';
        }
      } else if (qN.length >= 3 && kx.hayN.includes(qN)) {
        score += 150;
        if (!reason) reason = 'words';
      }
    }

    // Keep "closest" siblings when nothing matched exactly (e.g. other variants of the same series)
    if (score === 0 && targetCol === 'all' && kx.codeN && qN.length >= 4) {
      const lcp = commonPrefixLen(kx.codeN, qN);
      if (lcp >= 3) { score = lcp * 10; reason = 'close'; }
    }

    if (score > 0) {
      // shorter code difference wins ties
      const tie = kx.codeN && qN ? Math.abs(kx.codeN.length - qN.length) * 0.01 : 0;
      scored.push({ item, score: score - tie, reason });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/** Same as rankExcelRowsDetailed but returns only the rows. */
export function rankExcelRows(rows = [], query = '', targetCol = 'all', targetCat = 'all', limit = 15) {
  return rankExcelRowsDetailed(rows, query, targetCol, targetCat, limit).map(r => r.item);
}

/**
 * Built-in Sample Data with Ashley Furniture and Retail Items (Exact match with user Excel sheet)
 */
export const sampleDataRows = [
  ['category_name_en', 'model_name_en', 'name_en', 'price_usd'],
  ['Corner', '12000', 'Corner - 1200067 - Right-Arm Facing Sofa', '550'],
  ['Corner', '12000', 'Corner - 1200046 - Coffee Armless Chair', '1425'],
  ['Corner', 'U7160', 'Corner - U7160458 - Laf Zero Wall Power Recliner', '850'],
  ['Corner', 'U7160', 'Corner - U7160457 - Dunleith Console With Storage', '630'],
  ['Corner', 'U7160', 'Corner - U7160446 - Dunleith Armless Chair', '420'],
  ['Home Office', 'H200', 'Home Office - H200-07 - Desk', '310'],
  ['Wall Unit', 'Clan', 'Clan - Wall Unit - TV Stand', '3140'],
  ['Accessories', 'D8917', 'Accessories - D8917 - Accessories', '11'],
  ['Accessories', 'C5473', 'Accessories - C5473 - Accessories', '16'],
  ['Accessories', 'D8916', 'Accessories - D8916 - Accessories', '11'],
  ['Accessories', 'C5474', 'Accessories - C5474 - Accessories', '30'],
  ['Accessories', 'D8706', 'Accessories - D8706 - Accessories', '614'],
  ['Accessories', 'D8705', 'Accessories - D8705 - Accessories', '1005'],
  ['Accessories', 'C5475', 'Accessories - C5475 - Accessories', '16'],
  ['Accessories', 'D8700', 'Accessories - D8700 - Accessories', '55'],
  ['Accessories', 'C5476', 'Accessories - C5476 - Accessories', '50'],
  ['Accessories', 'D8699', 'Accessories - D8699 - Accessories', '58'],
  ['Accessories', 'C5478', 'Accessories - C5478 - Accessories', '15'],
  ['Accessories', 'D8691', 'Accessories - D8691 - Accessories', '160'],
  ['Accessories', 'C5479', 'Accessories - C5479 - Accessories', '27'],
  ['Accessories', 'D8636', 'Accessories - D8636 - Accessories', '29'],
  ['Accessories', 'C5482', 'Accessories - C5482 - Accessories', '22'],
  ['Accessories', 'D8634', 'Accessories - D8634 - Accessories', '107'],
  ['Accessories', 'C5483', 'Accessories - C5483 - Accessories', '37'],
  ['Accessories', 'D8633', 'Accessories - D8633 - Accessories', '53'],
  ['Accessories', 'C5546', 'Accessories - C5546 - Accessories', '76'],
  ['Accessories', 'C5548', 'Accessories - C5548 - Accessories', '71'],
  ['Bedroom', 'b719-', 'b719-56W1 Demarlos King Bed with Storage', '1250'],
  ['SOFA SET', '1202020', '1202020 Bergere Chair Armchair', '780']
];
