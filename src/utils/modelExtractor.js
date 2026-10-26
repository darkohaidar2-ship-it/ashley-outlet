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
 * Specifically prioritizes price_usa, price_usd, outlet_price_usa, etc.
 */
export function detectExcelColumns(headers = [], sampleRows = []) {
  const cleanHeaders = headers.map(h => String(h || '').trim().toLowerCase());

  // 1. Price Column Priority:
  // Priority A: Exact USA / USD / Outlet prices (User's specific case: 'price_usa'!)
  const usaPriceKeywords = [
    'price_usa', 'price_usd', 'priceusa', 'priceusd', 
    'outlet_price_usa', 'outlet_price_usd', 'outlet_price',
    'sale_price_usa', 'sale_price_usd', 'sale_price', 
    'usd_price', 'usa_price', 'usd'
  ];

  let detectedPriceIdx = -1;

  // Check USA / USD keywords first
  for (const kw of usaPriceKeywords) {
    const idx = cleanHeaders.findIndex(h => h === kw || h.includes(kw));
    if (idx !== -1) {
      detectedPriceIdx = idx;
      break;
    }
  }

  // If not found by USA keywords, check candidates with non-zero numeric values
  if (detectedPriceIdx === -1) {
    const priceCandidates = [];
    cleanHeaders.forEach((h, idx) => {
      if (
        h.includes('price') || 
        h.includes('نرخ') || 
        h.includes('سعر') || 
        h.includes('outlet') || 
        h.includes('sale') || 
        h.includes('amount') || 
        h.includes('cost')
      ) {
        priceCandidates.push(idx);
      }
    });

    if (priceCandidates.length > 0) {
      // Pick the column that has the most non-zero values
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
        if (cleanHeaders[idx].includes('usa') || cleanHeaders[idx].includes('usd')) {
          nonZero += 50;
        }
        if (nonZero > maxNonZeroCount) {
          maxNonZeroCount = nonZero;
          bestIdx = idx;
        }
      });
      detectedPriceIdx = bestIdx;
    }
  }

  if (detectedPriceIdx === -1) {
    detectedPriceIdx = headers.length > 1 ? 1 : 0;
  }

  // 2. Model Name Column Priority:
  let detectedModelIdx = -1;
  const modelKeywords = ['model_name_en', 'model_name', 'model', 'مۆدێل', 'item_name'];
  for (const kw of modelKeywords) {
    const idx = cleanHeaders.findIndex(h => h === kw || h.includes(kw));
    if (idx !== -1) {
      detectedModelIdx = idx;
      break;
    }
  }

  // 3. Description Column Priority:
  let detectedDescIdx = -1;
  const descKeywords = ['name_en', 'description', 'desc', 'وەسف', 'name', 'item_desc'];
  for (const kw of descKeywords) {
    const idx = cleanHeaders.findIndex((h, colIdx) => (h === kw || h.includes(kw)) && colIdx !== detectedModelIdx);
    if (idx !== -1) {
      detectedDescIdx = idx;
      break;
    }
  }

  // 4. Code / Barcode Column Priority:
  let detectedCodeIdx = -1;
  const codeKeywords = ['barcode', 'code', 'sku', 'کۆد', 'بارکۆد', 'item_code', 'item_no'];
  for (const kw of codeKeywords) {
    const idx = cleanHeaders.findIndex((h, colIdx) => (h === kw || h.includes(kw)) && colIdx !== detectedModelIdx && colIdx !== detectedDescIdx);
    if (idx !== -1) {
      detectedCodeIdx = idx;
      break;
    }
  }

  // 5. Category Column Priority:
  let detectedCatIdx = -1;
  const catKeywords = [
    'category_name_en', 'category_name', 'major_category', 'sub_category',
    'category', 'cat_name', 'cat', 'department', 'dept', 'section', 'family',
    'class', 'پۆلێن', 'کەتەگۆری', 'بەش', 'قسم'
  ];
  for (const kw of catKeywords) {
    const idx = cleanHeaders.findIndex((h, colIdx) => (h === kw || h.includes(kw)) && colIdx !== detectedModelIdx && colIdx !== detectedDescIdx && colIdx !== detectedPriceIdx);
    if (idx !== -1) {
      detectedCatIdx = idx;
      break;
    }
  }

  if (detectedModelIdx === -1 && detectedDescIdx >= 0) detectedModelIdx = detectedDescIdx;
  if (detectedModelIdx === -1) detectedModelIdx = 0;

  return {
    priceCol: detectedPriceIdx,
    modelCol: detectedModelIdx,
    descCol: detectedDescIdx,
    codeCol: detectedCodeIdx,
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
 * Reverse Direction Matching: Find the matching row in an Excel Master Sheet for a Catalog Model.
 * This directly supports the user workflow: "ئەو ئایتمانەی کە هەمانە هەموو پارەکەی لەو شیتەوە دەر ئەکەین".
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

  // Normalize catalog model keys
  const normSku = normalizeKey(catalogModel.sku || '');
  const normName = normalizeKey(catalogModel.name || '');

  // Extract possible code/SKU from catalog model name if sku is generic
  const nameSkuMatch = String(catalogModel.name || '').match(/([A-Z]\d{2,4}-\d{1,4}[A-Za-z0-9-]*|\d{5,12})/i);
  const extractedSkuFromName = nameSkuMatch ? normalizeKey(nameSkuMatch[1]) : '';
  const effectiveSku = normSku || extractedSkuFromName;

  let bestMatch = null;
  let bestScore = -1;
  let isCategoryMatched = false;

  for (const item of excelItems) {
    let score = 0;
    const itemCodeNorm = normalizeKey(item.extractedCode || item.code || item.rawCode || '');
    const itemModelNorm = normalizeKey(item.predictedModel || item.model || '');
    const itemDescNorm = normalizeKey(item.rawDesc || item.desc || '');
    const itemCatGroup = getCategoryGroup(item.category || itemDescNorm);

    const isSameCat = catalogCatGroup !== 'unknown' && itemCatGroup !== 'unknown' && catalogCatGroup === itemCatGroup;
    const isConflictingCat = catalogCatGroup !== 'unknown' && itemCatGroup !== 'unknown' && catalogCatGroup !== itemCatGroup;

    // Strict Disqualification: e.g. Catalog item is a Sofa, but Excel item is an Accessory
    if (isConflictingCat && (catalogCatGroup === 'accessories' || itemCatGroup === 'accessories')) {
      continue;
    }

    // 1. Exact Full Variant SKU Match (e.g. effectiveSku is 'b71956w1' and itemCodeNorm is 'b71956w1')
    if (effectiveSku && (itemCodeNorm === effectiveSku || itemModelNorm === effectiveSku)) {
      score = 100;
    }
    // 2. Exact Full Variant SKU contained in Excel description (e.g. 'b71956w1' in 'b71956w1demarloskingbed')
    else if (effectiveSku && effectiveSku.length >= 4 && itemDescNorm.includes(effectiveSku)) {
      score = 95;
    }
    // 3. Exact Model Name match (e.g. "Clan" === "Clan")
    else if (normName && itemModelNorm && normName === itemModelNorm) {
      score = 90;
    }
    // 4. Substring Match for Clean Furniture Names (e.g. "Clan TV Stand" contains "Clan")
    // Disallow partial matching for alphanumeric series codes (like "b719")
    else if (
      normName && itemModelNorm &&
      !/^[a-z]\d{2,4}/i.test(itemModelNorm) &&
      !/^\d{4,8}/.test(itemModelNorm) &&
      (normName.includes(itemModelNorm) || itemModelNorm.includes(normName))
    ) {
      score = 80;
    }

    if (score >= 80) {
      if (isSameCat) score += 30;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
        isCategoryMatched = isSameCat;
      }
    }
  }

  // Strict Threshold: If score < 80, leave BLANK (white / spêtî)!
  if (bestScore < 80 || !bestMatch) {
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
 * Built-in Sample Data with Ashley Furniture and Retail Items (Including User Excel Cases)
 */
export const sampleDataRows = [
  ['model_name_en', 'name_en', 'price_usa', 'category_name_en'],
  ['Clan', 'Clan - Wall Unit - TV Stand', '3140', 'Living Room'],
  ['D8917', 'Accessories - D8917 - Accessories', '11', 'Accessories'],
  ['C5473', 'Accessories - C5473 - Accessories', '16', 'Accessories'],
  ['C6183', 'Accessories - C6183-IVOR - Accessories', '42', 'Accessories'],
  ['b719-', 'b719-56W1 Demarlos King Bed with Storage', '1250', 'Bedroom'],
  ['1202020', 'Accessories - 1202020 - Accessories Cushion', '45', 'Accessories'],
  ['1202020', '1202020 Bergere Chair Armchair', '780', 'SOFA SET'],
  ['76642- Black Set', 'Accessories - 76642- Black Set - Accessories', '150', 'Accessories'],
  ['73642-BLAC Set', 'Accessories - 73642-BLAC Set - Accessories', '120', 'Accessories'],
  ['Porter Dresser', 'B697-31 Porter Dresser Dark Brown - 6 Drawers', '850', 'Bedroom'],
  ['Realyn Dresser', '100-24425 B743-31 Realyn Dresser Chipped White Farmhouse', '920', 'Bedroom'],
  ['Darcy Sofa', 'A3000245 Darcy Sofa Cobblestone Fabric Living Room', '680', 'SOFA SET'],
  ['Centiar Dining', 'D372-25 Centiar Dining Room Counter Table', '410', 'Dining Room'],
  ['Barchuz Recliner', '6540225 Barchuz Power Lift Recliner Brown', '750', 'SOFA SET']
];
