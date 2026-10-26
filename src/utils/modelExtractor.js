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
 * Smart extraction of model name and code from messy Excel descriptions.
 * Handles cases like:
 * - Clan - Wall Unit - TV Stand -> Clan
 * - Accessories - D8917 - Accessories -> D8917
 * - Accessories - C5473 - Accessories -> C5473
 * - Accessories - C6183-IVOR - Accessories -> C6183-IVOR
 * - Accessories - 76642- Black Set - Accessories -> 76642- Black Set
 * - B697-31 Porter Dresser Dark Brown -> Porter Dresser (Code: B697-31)
 */
export function extractSmartModel(rawDesc, rawModel = '', rawCode = '', rawPrice = '') {
  let desc = String(rawDesc || '').trim();
  let model = String(rawModel || '').trim();
  let code = String(rawCode || '').trim();

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
    if (desc) {
      const escModel = model.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Check if description has variant suffix like 76642- Black Set or C6183-IVOR
      const variantRegex = new RegExp('\\b(' + escModel + '\\s*-\\s*[A-Za-z0-9]+(?:\\s+[A-Za-z0-9]+)?)\\b', 'i');
      const vMatch = desc.match(variantRegex);
      if (vMatch) {
        return {
          code: code || vMatch[1],
          model: vMatch[1],
          rawDesc: desc,
          price: rawPrice !== undefined && rawPrice !== null ? String(rawPrice).trim() : ''
        };
      }
    }
    return {
      code: code || (model.match(/^[A-Z0-9\s-]+$/i) ? model : ''),
      model: model,
      rawDesc: desc,
      price: rawPrice !== undefined && rawPrice !== null ? String(rawPrice).trim() : ''
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
      price: rawPrice !== undefined && rawPrice !== null ? String(rawPrice).trim() : ''
    };
  }

  // If chosenSegment is pure code/model (like "D8917", "C5473", "C6183-IVOR", "B697-31", "A4000123")
  if (/^[A-Z]\d{2,4}-\d{1,4}[A-Z0-9-]*$/i.test(chosenSegment) || /^[A-Z]\d{3,8}(?:-[A-Z0-9]+)?$/i.test(chosenSegment)) {
    return {
      code: code || chosenSegment.toUpperCase(),
      model: chosenSegment.toUpperCase(),
      rawDesc: desc,
      price: rawPrice !== undefined && rawPrice !== null ? String(rawPrice).trim() : ''
    };
  }

  // Check if description has an embedded code-variant
  if (mVariant && (DEPARTMENT_KEYWORDS.has(chosenSegment.toLowerCase()) || chosenSegment === desc || chosenSegment.length > 30)) {
    chosenSegment = mVariant[1];
    return {
      code: code || chosenSegment,
      model: chosenSegment,
      rawDesc: desc,
      price: rawPrice !== undefined && rawPrice !== null ? String(rawPrice).trim() : ''
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
    price: rawPrice !== undefined && rawPrice !== null ? String(rawPrice).trim() : ''
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
export function matchStagingItemWithCatalog(stagingItem, catalogModels = []) {
  if (!catalogModels || catalogModels.length === 0) {
    return {
      matchedModel: null,
      matchType: 'none',
      confidence: 0,
      priceDifference: null,
      isPriceEqual: false
    };
  }

  const normExtractedCode = normalizeKey(stagingItem.extractedCode || stagingItem.rawCode);
  const normPredictedModel = normalizeKey(stagingItem.predictedModel);
  const normRawDesc = normalizeKey(stagingItem.rawDesc);

  let bestMatch = null;
  let matchType = 'none';
  let confidence = 0;

  for (const model of catalogModels) {
    const normModelName = normalizeKey(model.name);
    const normModelSku = normalizeKey(model.sku);

    // 1. Exact SKU / Code match (Highest priority)
    if (normExtractedCode && normModelSku && normExtractedCode === normModelSku) {
      bestMatch = model;
      matchType = 'exact_code';
      confidence = 100;
      break;
    }
    if (normExtractedCode && normModelName && normExtractedCode === normModelName) {
      bestMatch = model;
      matchType = 'exact_code';
      confidence = 100;
      break;
    }

    // 2. Exact Model Name match
    if (normPredictedModel && normModelName && normPredictedModel === normModelName) {
      bestMatch = model;
      matchType = 'exact_name';
      confidence = 95;
      break;
    }
    if (normPredictedModel && normModelSku && normPredictedModel === normModelSku) {
      bestMatch = model;
      matchType = 'exact_name';
      confidence = 95;
      break;
    }

    // 3. One contains the other
    if (confidence < 80) {
      if (normPredictedModel && normModelName && (normModelName.includes(normPredictedModel) || normPredictedModel.includes(normModelName))) {
        bestMatch = model;
        matchType = 'partial';
        confidence = 80;
      } else if (normExtractedCode && normModelName && normModelName.includes(normExtractedCode)) {
        bestMatch = model;
        matchType = 'partial';
        confidence = 75;
      } else if (normRawDesc && normModelName && normRawDesc.includes(normModelName)) {
        bestMatch = model;
        matchType = 'partial';
        confidence = 70;
      }
    }
  }

  const rawStagingPrice = parseFloat(stagingItem.price);
  const currentCatalogPrice = bestMatch ? parseFloat(bestMatch.salePrice || bestMatch.originalPrice || 0) : null;
  const hasValidPrices = !isNaN(rawStagingPrice) && currentCatalogPrice !== null && !isNaN(currentCatalogPrice);
  const priceDifference = hasValidPrices ? (rawStagingPrice - currentCatalogPrice) : null;
  const isPriceEqual = hasValidPrices ? Math.abs(rawStagingPrice - currentCatalogPrice) < 0.001 : false;

  return {
    matchedModel: bestMatch,
    matchType,
    confidence,
    priceDifference,
    isPriceEqual,
    currentCatalogPrice
  };
}

/**
 * Built-in Sample Data with Ashley Furniture and Retail Items (Including User Excel Cases)
 */
export const sampleDataRows = [
  ['model_name_en', 'name_en', 'price'],
  ['Clan', 'Clan - Wall Unit - TV Stand', '3140'],
  ['D8917', 'Accessories - D8917 - Accessories', '11'],
  ['C5473', 'Accessories - C5473 - Accessories', '16'],
  ['C6183', 'Accessories - C6183-IVOR - Accessories', '42'],
  ['76642- Black Set', 'Accessories - 76642- Black Set - Accessories', '150'],
  ['73642-BLAC Set', 'Accessories - 73642-BLAC Set - Accessories', '120'],
  ['Porter Dresser', 'B697-31 Porter Dresser Dark Brown - 6 Drawers', '850'],
  ['Realyn Dresser', '100-24425 B743-31 Realyn Dresser Chipped White Farmhouse', '920'],
  ['Darcy Sofa', 'A3000245 Darcy Sofa Cobblestone Fabric Living Room', '680'],
  ['Centiar Dining', 'D372-25 Centiar Dining Room Counter Table', '410'],
  ['Barchuz Recliner', '6540225 Barchuz Power Lift Recliner Brown', '750']
];
