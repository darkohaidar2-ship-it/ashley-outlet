import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  RefreshCw,
  Plus,
  Trash2,
  FileSpreadsheet,
  Check,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  DollarSign,
  HelpCircle,
  FileCheck2,
  FolderTree
} from 'lucide-react';
import {
  extractSmartModel,
  matchStagingItemWithCatalog,
  sampleDataRows,
  cleanNumericPrice,
  parsePriceToFloat,
  detectExcelColumns,
  getCategoryGroup
} from '../utils/modelExtractor';

export default function PriceMatcherModal({
  isOpen,
  onClose,
  models = [],
  categories = [],
  collections = [],
  onApplyPriceUpdates,
  onImportNewModels,
  t,
  lang = 'ku'
}) {
  const [activeTab, setActiveTab] = useState('staging'); // 'upload' | 'staging'
  
  // Staging processed items
  const [stagingData, setStagingData] = useState(() => {
    try {
      const saved = localStorage.getItem('ashley_price_matcher_staging');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Raw rows from imported Excel to allow real-time column re-mapping
  const [rawExcelRows, setRawExcelRows] = useState(() => {
    try {
      const saved = localStorage.getItem('ashley_price_matcher_raw_rows');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Excel header names
  const [rawHeaders, setRawHeaders] = useState(() => {
    try {
      const saved = localStorage.getItem('ashley_price_matcher_headers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Column mapping (Model, Desc, Price, Code, Cat)
  const [columnMapping, setColumnMapping] = useState(() => {
    try {
      const saved = localStorage.getItem('ashley_price_matcher_col_map');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      modelCol: -1,
      descCol: -1,
      priceCol: -1,
      codeCol: -1,
      catCol: -1,
      noteCol: -1
    };
  });

  // Search, filter, category filter, pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'matched' | 'unmatched' | 'diff'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'sofa' | 'bedroom' | 'accessories' | 'corner' | 'dining' | 'office'
  const [visibleLimit, setVisibleLimit] = useState(50);
  const [isApplying, setIsApplying] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Persistence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ashley_price_matcher_staging', JSON.stringify(stagingData));
    } catch (e) {}
  }, [stagingData]);

  useEffect(() => {
    try {
      if (rawExcelRows && rawExcelRows.length > 0) {
        localStorage.setItem('ashley_price_matcher_raw_rows', JSON.stringify(rawExcelRows));
      }
    } catch (e) {}
  }, [rawExcelRows]);

  useEffect(() => {
    try {
      if (rawHeaders && rawHeaders.length > 0) {
        localStorage.setItem('ashley_price_matcher_headers', JSON.stringify(rawHeaders));
      }
    } catch (e) {}
  }, [rawHeaders]);

  useEffect(() => {
    try {
      localStorage.setItem('ashley_price_matcher_col_map', JSON.stringify(columnMapping));
    } catch (e) {}
  }, [columnMapping]);

  // Toast auto-hide
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // If no data initially, go to upload tab
  useEffect(() => {
    if (isOpen && stagingData.length === 0) {
      setActiveTab('upload');
    }
  }, [isOpen]);

  /**
   * Parse rows using a specific column mapping and populate staging items.
   */
  const parseRowsWithMapping = (rows, mapping) => {
    if (!rows || rows.length < 2) return [];

    const dataRows = rows.slice(1);
    const mIdx = mapping.modelCol;
    const dIdx = mapping.descCol;
    const pIdx = mapping.priceCol;
    const cIdx = mapping.codeCol;
    const catIdx = mapping.catCol;
    const nIdx = mapping.noteCol;

    const parsed = [];
    dataRows.forEach((r, idx) => {
      const rawModel = (mIdx >= 0 && r[mIdx] !== undefined) ? String(r[mIdx]).trim() : '';
      const rawDesc = (dIdx >= 0 && r[dIdx] !== undefined) ? String(r[dIdx]).trim() : (mIdx >= 0 && r[mIdx] !== undefined ? String(r[mIdx]).trim() : '');
      const rawPrice = (pIdx >= 0 && r[pIdx] !== undefined && r[pIdx] !== null) ? String(r[pIdx]).trim() : '';
      const rawCode = (cIdx >= 0 && r[cIdx] !== undefined && r[cIdx] !== null) ? String(r[cIdx]).trim() : '';
      const rawCat = (catIdx >= 0 && r[catIdx] !== undefined && r[catIdx] !== null) ? String(r[catIdx]).trim() : '';
      const rawNote = (nIdx >= 0 && r[nIdx] !== undefined && r[nIdx] !== null) ? String(r[nIdx]).trim() : '';

      if (!rawDesc && !rawModel && !rawPrice && !rawCode && !rawCat) return;

      const extracted = extractSmartModel(rawDesc, rawModel, rawCode, rawPrice, rawCat);
      const cleanPrice = cleanNumericPrice(rawPrice) || extracted.price;

      parsed.push({
        id: 'stg_' + idx + '_' + Math.random().toString(36).substring(2, 7),
        rawCode,
        extractedCode: extracted.code,
        rawDesc: rawDesc || rawModel,
        predictedModel: extracted.model,
        category: extracted.category || rawCat,
        price: cleanPrice,
        rawNote,
        selected: false
      });
    });

    return parsed;
  };

  /**
   * Process raw rows (from Excel or Sample)
   */
  const processRawData = (rows) => {
    if (!rows || rows.length < 2) return;

    const headers = rows[0].map(h => String(h || '').trim());
    setRawHeaders(headers);
    setRawExcelRows(rows);

    // Smart Column Detection specifically targeting price_usa and category columns
    const detected = detectExcelColumns(headers, rows.slice(1));
    const newMapping = {
      modelCol: detected.modelCol,
      descCol: detected.descCol,
      priceCol: detected.priceCol,
      codeCol: detected.codeCol,
      catCol: detected.catCol,
      noteCol: -1
    };
    setColumnMapping(newMapping);

    const parsedItems = parseRowsWithMapping(rows, newMapping);
    setStagingData(parsedItems);
    setActiveTab('staging');
    setVisibleLimit(50);
    const chosenPriceHeader = headers[detected.priceCol] || `ستوونی ${detected.priceCol + 1}`;
    const chosenCatHeader = detected.catCol >= 0 ? headers[detected.catCol] : null;
    setSuccessToast(
      `${parsedItems.length} کاڵا دەرهێنران! ستوونی نرخ: "${chosenPriceHeader}"${chosenCatHeader ? ` | ستوونی کەتەگۆری: "${chosenCatHeader}"` : ''}`
    );
  };

  /**
   * Handle changing the Price Column from dropdown
   */
  const handlePriceColChange = (newPriceIdx) => {
    const newMapping = {
      ...columnMapping,
      priceCol: newPriceIdx
    };
    setColumnMapping(newMapping);

    if (rawExcelRows && rawExcelRows.length > 1) {
      const reParsed = parseRowsWithMapping(rawExcelRows, newMapping);
      setStagingData(reParsed);
      const chosenHeader = rawHeaders[newPriceIdx] || `ستوونی ${newPriceIdx + 1}`;
      setSuccessToast(`ستوونی نرخ گۆڕدرا بۆ: "${chosenHeader}" - نرخەکان نوێکرانەوە!`);
    } else {
      setSuccessToast(`ستوونی نرخ گۆڕدرا بۆ: ${rawHeaders[newPriceIdx]}`);
    }
  };

  /**
   * Handle changing the Category Column from dropdown
   */
  const handleCatColChange = (newCatIdx) => {
    const newMapping = { ...columnMapping, catCol: newCatIdx };
    setColumnMapping(newMapping);
    if (rawExcelRows && rawExcelRows.length > 1) {
      const reParsed = parseRowsWithMapping(rawExcelRows, newMapping);
      setStagingData(reParsed);
      const chosenHeader = newCatIdx >= 0 ? (rawHeaders[newCatIdx] || `ستوونی ${newCatIdx + 1}`) : 'بێ کەتەگۆری';
      setSuccessToast(`ستوونی کەتەگۆری گۆڕدرا بۆ: "${chosenHeader}" - کەتەگۆرییەکان نوێکرانەوە!`);
    }
  };

  /**
   * Handle changing the Model Column from dropdown
   */
  const handleModelColChange = (newModelIdx) => {
    const newMapping = { ...columnMapping, modelCol: newModelIdx };
    setColumnMapping(newMapping);
    if (rawExcelRows && rawExcelRows.length > 1) {
      const reParsed = parseRowsWithMapping(rawExcelRows, newMapping);
      setStagingData(reParsed);
      setSuccessToast(`ستوونی مۆدێل گۆڕدرا بۆ: "${rawHeaders[newModelIdx]}"`);
    }
  };

  /**
   * Handle changing the Description Column from dropdown
   */
  const handleDescColChange = (newDescIdx) => {
    const newMapping = { ...columnMapping, descCol: newDescIdx };
    setColumnMapping(newMapping);
    if (rawExcelRows && rawExcelRows.length > 1) {
      const reParsed = parseRowsWithMapping(rawExcelRows, newMapping);
      setStagingData(reParsed);
      setSuccessToast(`ستوونی وەسف گۆڕدرا بۆ: "${rawHeaders[newDescIdx]}"`);
    }
  };

  // Handle Excel file upload
  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { header: 1 });
        if (json && json.length > 1) {
          processRawData(json);
        } else {
          alert('فایلەکە بەتاڵە یان داتای پێویستی تێدا نییە.');
        }
      } catch (err) {
        alert('هەڵە لە خوێندنەوەی ئێکسڵ: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Load Built-in Sample Data (Clan, D8917, C5473, C6183, etc.)
  const handleLoadSample = () => {
    processRawData(sampleDataRows);
  };

  // Re-run matching against current catalog models for every staging row
  const matchedStagingItems = useMemo(() => {
    return stagingData.map((item) => {
      const match = matchStagingItemWithCatalog(item, models, categories);
      return {
        ...item,
        ...match
      };
    });
  }, [stagingData, models, categories]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = matchedStagingItems.length;
    const matched = matchedStagingItems.filter(i => i.matchedModel !== null);
    const unmatched = matchedStagingItems.filter(i => i.matchedModel === null);
    const diffPrices = matched.filter(i => !i.isPriceEqual && i.priceDifference !== null);
    const categoryMatchedCount = matched.filter(i => i.isCategoryMatched).length;

    return {
      total,
      matchedCount: matched.length,
      unmatchedCount: unmatched.length,
      diffCount: diffPrices.length,
      categoryMatchedCount,
      matchPercentage: total > 0 ? Math.round((matched.length / total) * 100) : 0
    };
  }, [matchedStagingItems]);

  // Filtered & Searched items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return matchedStagingItems.filter((item) => {
      // 1. Status Filter mode
      if (filterMode === 'matched' && !item.matchedModel) return false;
      if (filterMode === 'unmatched' && item.matchedModel) return false;
      if (filterMode === 'diff' && (item.isPriceEqual || !item.matchedModel)) return false;

      // 2. Category Filter (Sofa, Bedroom, Accessories, Dining, Corner, Office)
      if (categoryFilter !== 'all') {
        const itemCatStr = `${item.category || ''} ${item.rawDesc || ''}`;
        const itemCatGroup = getCategoryGroup(itemCatStr);
        if (itemCatGroup !== categoryFilter) return false;
      }

      // 3. Real-time Multi-field search
      if (!q) return true;
      const code = (item.extractedCode || item.rawCode || '').toLowerCase();
      const model = (item.predictedModel || '').toLowerCase();
      const desc = (item.rawDesc || '').toLowerCase();
      const price = String(item.price || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const matchedName = (item.matchedModel?.name || '').toLowerCase();

      return (
        code.includes(q) ||
        model.includes(q) ||
        desc.includes(q) ||
        price.includes(q) ||
        cat.includes(q) ||
        matchedName.includes(q)
      );
    });
  }, [matchedStagingItems, filterMode, categoryFilter, searchQuery]);

  // Visible windowed slice
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleLimit);
  }, [filteredItems, visibleLimit]);

  // Select all checkbox state for current view
  const isAllVisibleSelected = useMemo(() => {
    if (visibleItems.length === 0) return false;
    return visibleItems.every(i => i.selected);
  }, [visibleItems]);

  const selectedCount = useMemo(() => {
    return stagingData.filter(i => i.selected).length;
  }, [stagingData]);

  // Toggle selection for all visible items
  const handleToggleSelectAll = (checked) => {
    const visibleIds = new Set(visibleItems.map(i => i.id));
    setStagingData(prev =>
      prev.map(item => {
        if (visibleIds.has(item.id)) {
          return { ...item, selected: checked };
        }
        return item;
      })
    );
  };

  // Toggle single row selection
  const handleToggleRowSelect = (id) => {
    setStagingData(prev =>
      prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item)
    );
  };

  // Live edit of predicted model
  const handleModelNameChange = (id, newName) => {
    setStagingData(prev =>
      prev.map(item => item.id === id ? { ...item, predictedModel: newName } : item)
    );
  };

  // Apply single model price update
  const handleApplySinglePrice = (item) => {
    if (!item.matchedModel) return;
    const cleanPrice = parsePriceToFloat(item.price);
    if (cleanPrice <= 0) {
      alert('نرخەکە نادروستە یان سفڕە ($0)');
      return;
    }

    const updated = models.map(m => {
      if (m.id === item.matchedModel.id) {
        return {
          ...m,
          originalPrice: cleanPrice,
          salePrice: (m.salePrice !== undefined && m.salePrice !== null && m.salePrice !== '') ? Number(m.salePrice) : 0
        };
      }
      return m;
    });

    onApplyPriceUpdates(updated);
    setSuccessToast(`نرخی پێش داشکاندنی مۆدێلی "${item.matchedModel.name}" نوێکرایەوە بۆ $${cleanPrice}!`);
  };

  // Batch sync ALL matched prices to catalog
  const handleSyncAllMatchedPrices = async () => {
    const matchedWithValidPrices = matchedStagingItems.filter(
      i => i.matchedModel && parsePriceToFloat(i.price) > 0
    );

    if (matchedWithValidPrices.length === 0) {
      alert('هیچ مۆدێلێکی هاوتاکراو بە نرخی دروست نەدۆزرایەوە (نرخەکان هەموویان 0 یاخود بەتاڵن). تکایە سەیری ستوونی نرخ بکە.');
      return;
    }

    setIsApplying(true);

    // Disambiguate when multiple staging rows match the same catalog model
    // e.g. Excel has both Accessory 1202020 ($45) and Sofa 1202020 ($780).
    // The Sofa model in catalog MUST get the Sofa row ($780) because isCategoryMatched is true!
    const bestMatchByModelId = new Map();
    matchedWithValidPrices.forEach(item => {
      const modelId = item.matchedModel.id;
      const existing = bestMatchByModelId.get(modelId);
      if (!existing) {
        bestMatchByModelId.set(modelId, item);
      } else {
        // Disambiguation hierarchy:
        // 1. isCategoryMatched: true wins over false
        const existingCatMatch = existing.isCategoryMatched ? 1 : 0;
        const itemCatMatch = item.isCategoryMatched ? 1 : 0;
        if (itemCatMatch > existingCatMatch) {
          bestMatchByModelId.set(modelId, item);
        } else if (itemCatMatch === existingCatMatch) {
          // 2. Highest confidence score wins
          const itemConf = item.confidence || 0;
          const existConf = existing.confidence || 0;
          if (itemConf > existConf) {
            bestMatchByModelId.set(modelId, item);
          }
        }
      }
    });

    const priceMap = new Map();
    bestMatchByModelId.forEach((item, modelId) => {
      priceMap.set(modelId, parsePriceToFloat(item.price));
    });

    const updatedCatalog = models.map(m => {
      if (priceMap.has(m.id)) {
        return {
          ...m,
          originalPrice: priceMap.get(m.id),
          salePrice: (m.salePrice !== undefined && m.salePrice !== null && m.salePrice !== '') ? Number(m.salePrice) : 0
        };
      }
      return m;
    });

    try {
      await onApplyPriceUpdates(updatedCatalog);
      setSuccessToast(`⚡ ${priceMap.size} مۆدێل بە نرخی نوێی پێش داشکاندن ($) نوێکرانەوە بەپێی کەتەگۆری گونجاو!`);
    } catch (err) {
      alert('هەڵە لە نوێکردنەوەی نرخەکان: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Batch sync SELECTED items
  const handleSyncSelectedPrices = async () => {
    const selectedItems = matchedStagingItems.filter(
      i => i.selected && i.matchedModel && parsePriceToFloat(i.price) > 0
    );

    if (selectedItems.length === 0) {
      alert('تکایە سەرەتا چەند مۆدێلێکی هاوتاکراو بە نرخی دروست بە چێکبۆکس هەڵبژێرە.');
      return;
    }

    setIsApplying(true);

    const bestMatchByModelId = new Map();
    selectedItems.forEach(item => {
      const modelId = item.matchedModel.id;
      const existing = bestMatchByModelId.get(modelId);
      if (!existing) {
        bestMatchByModelId.set(modelId, item);
      } else {
        const existingCatMatch = existing.isCategoryMatched ? 1 : 0;
        const itemCatMatch = item.isCategoryMatched ? 1 : 0;
        if (itemCatMatch > existingCatMatch) {
          bestMatchByModelId.set(modelId, item);
        } else if (itemCatMatch === existingCatMatch) {
          const itemConf = item.confidence || 0;
          const existConf = existing.confidence || 0;
          if (itemConf > existConf) {
            bestMatchByModelId.set(modelId, item);
          }
        }
      }
    });

    const priceMap = new Map();
    bestMatchByModelId.forEach((item, modelId) => {
      priceMap.set(modelId, parsePriceToFloat(item.price));
    });

    const updatedCatalog = models.map(m => {
      if (priceMap.has(m.id)) {
        return {
          ...m,
          originalPrice: priceMap.get(m.id),
          salePrice: (m.salePrice !== undefined && m.salePrice !== null && m.salePrice !== '') ? Number(m.salePrice) : 0
        };
      }
      return m;
    });

    try {
      await onApplyPriceUpdates(updatedCatalog);
      setSuccessToast(`✅ ${priceMap.size} مۆدێلی دیاریکراو بە نرخی پێش داشکاندن ($) نوێکرانەوە!`);
    } catch (err) {
      alert('هەڵە: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Import Unmatched items as New Models into catalog
  const handleImportUnmatchedAsNew = async () => {
    const unmatched = matchedStagingItems.filter(i => !i.matchedModel);
    if (unmatched.length === 0) {
      alert('هیچ کاڵایەکی نەدۆزراوە نییە بۆ زیادکردن.');
      return;
    }

    const defaultCatId = categories[0]?.id || '';
    const newModelsList = unmatched.map((item, idx) => ({
      id: 'mod-' + Date.now() + '-' + idx,
      name: item.predictedModel || item.rawDesc || 'Model ' + (idx + 1),
      sku: item.extractedCode || item.rawCode || item.predictedModel || '',
      itemType: 'ئاوتلێت',
      categoryId: defaultCatId,
      collectionId: '',
      stock: 1,
      originalPrice: parsePriceToFloat(item.price) || 0,
      salePrice: 0,
      notes: item.rawDesc !== item.predictedModel ? item.rawDesc : '',
      image: ''
    }));

    if (onImportNewModels) {
      setIsApplying(true);
      try {
        await onImportNewModels(newModelsList);
        setSuccessToast(`➕ ${newModelsList.length} مۆدێلی نوێ زیادکرانە ناو کەتەلۆگ!`);
      } catch (e) {
        alert('هەڵە لە زیادکردن: ' + e.message);
      } finally {
        setIsApplying(false);
      }
    }
  };

  // Clear Staging Table
  const handleClearStaging = () => {
    if (window.confirm('ئایا دڵنیایت لە پاککردنەوەی تەواوی ئەم خشتەی ئێکسڵە؟')) {
      setStagingData([]);
      setRawExcelRows([]);
      setRawHeaders([]);
      localStorage.removeItem('ashley_price_matcher_staging');
      localStorage.removeItem('ashley_price_matcher_raw_rows');
      localStorage.removeItem('ashley_price_matcher_headers');
      setActiveTab('upload');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-6xl max-h-[94vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Toast Notification Banner */}
        {successToast && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md transition-all">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setSuccessToast('')}
              className="p-1 hover:bg-emerald-700 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                  هاوتاکردنی نرخ لەگەڵ ئێکسڵ (Excel Price Matcher)
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                  USD ($)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                دەرهێنانی زیرەکی مۆدێل، دەستنیشانکردنی ستوونی نرخ (price_usa)، و نوێکردنەوەی کەتەلۆگ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-2 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 overflow-x-auto select-none">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                activeTab === 'upload'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>📁 فایلی ئێکسڵ (Upload & Column Setup)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staging')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                activeTab === 'staging'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>🔍 پشکنین و هاوتاکردن (Staging Explorer)</span>
              {stagingData.length > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.2 rounded-full font-mono font-bold">
                  {stagingData.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Load Sample Data Button */}
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="بارکردنی کاڵاکانی وەک (Clan, D8917, C5473, C6183-IVOR, Darcy Sofa)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>⚡ نموونەی ئامادەکراو</span>
          </button>
        </div>

        {/* Tab 1: Upload & Column Setup */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h4 className="font-black text-slate-800 text-base sm:text-lg">
                فایلی ئێکسڵ یان CSV ڕابکێشە ئێرە، یان کلیک بکە
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                پشتیوانی فایلی <span className="font-mono font-bold text-slate-700">.xlsx</span>, <span className="font-mono font-bold text-slate-700">.xls</span>, و <span className="font-mono font-bold text-slate-700">.csv</span> دەکات.
              </p>
              
              <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all">
                <Upload className="w-4 h-4" />
                <span>هەڵبژاردنی فایلی نوێ</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files.length) handleFileUpload(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>

            {/* Column Mapping Selectors (When file was previously loaded) */}
            {rawHeaders.length > 0 && (
              <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
                    <h5 className="font-black text-slate-900 text-sm">
                      ڕێکخستنی ستوونەکانی فایلی ئێکسڵی بارکراو ({rawHeaders.length} ستوون)
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                    {stagingData.length} کاڵا
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Price Column Selector */}
                  <div className="p-3 bg-white border-2 border-emerald-500 rounded-2xl shadow-xs">
                    <label className="block text-xs font-black text-emerald-900 mb-1 flex items-center justify-between">
                      <span>🏷️ ستوونی نرخ (Price):</span>
                      <span className="text-[10px] text-emerald-600 font-bold">price_usa</span>
                    </label>
                    <select
                      value={columnMapping.priceCol}
                      onChange={(e) => handlePriceColChange(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-black text-slate-900 cursor-pointer focus:outline-none"
                    >
                      {rawHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>
                          {h} {h.toLowerCase().includes('usa') || h.toLowerCase().includes('usd') ? '⭐ (USA/USD)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Column Selector */}
                  <div className="p-3 bg-white border border-purple-200 rounded-2xl shadow-xs">
                    <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center justify-between">
                      <span>📁 ستوونی کەتەگۆری:</span>
                      <span className="text-[10px] text-purple-600 font-bold">Category</span>
                    </label>
                    <select
                      value={columnMapping.catCol}
                      onChange={(e) => handleCatColChange(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-purple-50/40 border border-purple-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:outline-none"
                    >
                      <option value="-1">-- بێ ستوونی کەتەگۆری (وەسف) --</option>
                      {rawHeaders.map((h, idx) => {
                        const lower = h.toLowerCase();
                        const isCat = lower.includes('cat') || lower.includes('dept') || lower.includes('class') || lower.includes('بەش');
                        return (
                          <option key={idx} value={idx}>
                            {h} {isCat ? '📁 (Category)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Model Column Selector */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      📝 ستوونی مۆدێل (Model):
                    </label>
                    <select
                      value={columnMapping.modelCol}
                      onChange={(e) => handleModelColChange(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:outline-none"
                    >
                      {rawHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description Column Selector */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      📄 ستوونی وەسف (Description):
                    </label>
                    <select
                      value={columnMapping.descCol}
                      onChange={(e) => handleDescColChange(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:outline-none"
                    >
                      <option value="-1">-- بێ وەسف --</option>
                      {rawHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('staging')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>چوونە تابی پشکنین و هاوتاکردن</span>
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Smart Detection Features Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>دەستنیشانکردنی price_usa</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  سیستەم بە خۆکاری ستوونی <strong className="text-emerald-700">price_usa</strong> هەڵدەبژێرێت بۆ دۆلاری ئەمریکی ($ USD).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span>پاراستنی تەواوەتی نرخ ($)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  نرخەکان بێ خڕکردنەوە و بە ژمارەی تەواو لە فایلی ئێکسڵەوە دەمێننەوە (وەک 3140، 11، 16، 42).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-1">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>هاوتاکردنی ڕاستەوخۆ لەگەڵ کەتەلۆگ</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  مۆدێلەکان لەگەڵ مۆدێلە بەردەستەکانی سیستەم بەراورد دەکرێن بە کۆد، ناو، و وەسف.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Staging Explorer & Catalog Matcher */}
        {activeTab === 'staging' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            
            {/* ⭐ Active Column Mapping Control Bar (ستوونی دیاریکراوی نرخ لە ئێکسڵ) */}
            {rawHeaders.length > 0 && (
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2.5 text-xs select-none shadow-2xs">
                
                {/* Price Column Picker */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-black text-emerald-950 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>ستوونی نرخ لە ئێکسڵ:</span>
                  </div>

                  <div className="relative">
                    <select
                      value={columnMapping.priceCol}
                      onChange={(e) => handlePriceColChange(Number(e.target.value))}
                      className="ps-2.5 pe-7 py-1 bg-white border-2 border-emerald-500 hover:border-emerald-600 rounded-xl font-black text-xs text-emerald-950 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                      title="ئەگەر نرخەکان 0 بوون، لێرەوە ستوونی دروست (وەک price_usa) هەڵبژێرە"
                    >
                      {rawHeaders.map((h, idx) => {
                        const lower = h.toLowerCase();
                        const isUsa = lower.includes('usa') || lower.includes('usd');
                        return (
                          <option key={idx} value={idx}>
                            {h} {isUsa ? '⭐ (USA / USD)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {rawHeaders[columnMapping.priceCol] && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{rawHeaders[columnMapping.priceCol]}</span>
                    </span>
                  )}
                </div>

                {/* Category Column, Model Column & Description Column quick switches */}
                <div className="flex items-center gap-2.5 flex-wrap text-[11px]">
                  <div className="flex items-center gap-1">
                    <span className="text-purple-800 font-bold">📁 کەتەگۆری:</span>
                    <select
                      value={columnMapping.catCol}
                      onChange={(e) => handleCatColChange(Number(e.target.value))}
                      className="px-2 py-0.5 bg-white border border-purple-300 rounded-lg text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      <option value="-1">-- دیارینەکراو --</option>
                      {rawHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-bold">مۆدێل:</span>
                    <select
                      value={columnMapping.modelCol}
                      onChange={(e) => handleModelColChange(Number(e.target.value))}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      {rawHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-bold">وەسف:</span>
                    <select
                      value={columnMapping.descCol}
                      onChange={(e) => handleDescColChange(Number(e.target.value))}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      <option value="-1">-- بێ وەسف --</option>
                      {rawHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            )}

            {/* Top Stats Overview Cards */}
            <div className="p-3 bg-slate-50/70 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400">کۆی ئێکسڵ</div>
                  <div className="text-base font-black text-slate-800 font-mono">{stats.total}</div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                  📦
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <span>هاوتاکراو لە کەتەلۆگ</span>
                  </div>
                  <div className="text-base font-black text-emerald-700 font-mono flex items-center gap-1.5">
                    <span>{stats.matchedCount}</span>
                    <span className="text-[10px] font-bold text-emerald-600/80 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                      {stats.matchPercentage}%
                    </span>
                  </div>
                  {stats.categoryMatchedCount > 0 && (
                    <div className="text-[9.5px] font-bold text-emerald-800 mt-0.5">
                      ✅ {stats.categoryMatchedCount} هاوتای کەتەگۆری
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  🎯
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-[10px] font-bold text-amber-600">جیاوازی نرخ</div>
                  <div className="text-base font-black text-amber-700 font-mono">{stats.diffCount}</div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                  💵
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-[10px] font-bold text-rose-600">نەدۆزراوە لە کەتەلۆگ</div>
                  <div className="text-base font-black text-rose-700 font-mono">{stats.unmatchedCount}</div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                  ⚠️
                </div>
              </div>
            </div>

            {/* Toolbar: Filter chips, Category Filter Dropdown & Smart Multi-field Search Bar */}
            <div className="p-3 border-b border-slate-200 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 select-none">
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    هەمووی ({stats.total})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterMode('matched')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterMode === 'matched'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    🎯 هاوتاکراوەکان ({stats.matchedCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterMode('diff')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterMode === 'diff'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    💵 گۆڕانی نرخ ({stats.diffCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterMode('unmatched')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterMode === 'unmatched'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    ⚠️ نەدۆزراوەکان ({stats.unmatchedCount})
                  </button>
                </div>

                {/* Category Filter Dropdown */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-slate-500">کەتەگۆری:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="all">هەموو بەشەکان</option>
                    <option value="sofa">🛋️ دانیشتن (Sofa / Living)</option>
                    <option value="bedroom">🛏️ نووستن (Bedroom)</option>
                    <option value="accessories">✨ ئێکسسوارات (Accessories)</option>
                    <option value="corner">📐 کۆرنەر (Corner)</option>
                    <option value="dining">🍽️ نانخواردن (Dining)</option>
                    <option value="office">💼 ئۆفیس (Office)</option>
                  </select>
                </div>
              </div>

              {/* Real-time Search Box */}
              <div className="relative min-w-[240px] sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="گەڕان بەپێی کۆد، مۆدێل، وەسف، نرخ، کەتەگۆری..."
                  className="w-full ps-8 pe-7 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-bold text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Selection Status Bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none">
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>دیاریکردنی هەمووی لەم بینینەدا</span>
                </label>
                {selectedCount > 0 && (
                  <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {selectedCount} دانە هەڵبژێردراوە
                  </span>
                )}
              </div>

              <div className="text-[11px] font-bold text-slate-500 font-mono">
                پیشاندانی {visibleItems.length} لە کۆی {filteredItems.length} کاڵا
              </div>
            </div>

            {/* Staging Data Table */}
            <div className="flex-1 overflow-auto bg-white select-text">
              {stagingData.length === 0 ? (
                <div className="text-center py-20 p-6 text-slate-400">
                  <div className="text-4xl mb-3">📂</div>
                  <h4 className="font-bold text-slate-700 text-sm">تا ئێستا هیچ داتایەکی ئێکسڵ بارنەکراوە</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    تکایە فایلی ئێکسڵەکەت لە تابی (فایلی ئێکسڵ) باربکە، یان کلیک لە دوگمەی نموونە بکە
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ بارکردنی نموونەی ئامادەکراو (Ashley Sample)</span>
                  </button>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  🔍 هیچ کاڵایەک نەدۆزرایەوە بە گەڕانی "{searchQuery}".
                </div>
              ) : (
                <table className="w-full text-xs text-slate-800 border-collapse border border-slate-200">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 text-[11px] font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 w-9 text-center border-e border-slate-200">
                        <input
                          type="checkbox"
                          checked={isAllVisibleSelected}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-2 w-8 text-center border-e border-slate-200 font-mono">#</th>
                      <th className="p-2 w-32 text-start border-e border-slate-200">کۆدی دەرهێنراو (Code/SKU)</th>
                      <th className="p-2 min-w-[150px] text-start border-e border-slate-200">وەسفی تەواوی ئێکسڵ</th>
                      <th className="p-2 min-w-[160px] text-start border-e border-slate-200">ناوی پێشبینیکراوی مۆدێل (دەستکاری)</th>
                      <th className="p-2 w-28 text-center border-e border-slate-200 bg-purple-50/50 text-purple-950">
                        کەتەگۆری ئێکسڵ
                      </th>
                      <th className="p-2 w-28 text-center border-e border-slate-200 bg-emerald-50/70 text-emerald-950">
                        نرخی ئێکسڵ (پێش داشکاندن $)
                      </th>
                      <th className="p-2 min-w-[170px] text-start border-e border-slate-200">هاوتا لەگەڵ کەتەلۆگ</th>
                      <th className="p-2 w-28 text-center">کردار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleItems.map((item, idx) => {
                      const isMatched = !!item.matchedModel;
                      const hasPriceDiff = isMatched && !item.isPriceEqual && item.priceDifference !== null;
                      const itemPriceNum = parsePriceToFloat(item.price);
                      const isZeroPrice = itemPriceNum === 0 || !item.price;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            item.selected ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          {/* Row Checkbox */}
                          <td className="p-2 text-center border-e border-slate-200">
                            <input
                              type="checkbox"
                              checked={!!item.selected}
                              onChange={() => handleToggleRowSelect(item.id)}
                              className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
                            />
                          </td>

                          {/* Row Index */}
                          <td className="p-2 text-center border-e border-slate-200 font-mono text-[11px] text-slate-500">
                            {idx + 1}
                          </td>

                          {/* Extracted Code / SKU */}
                          <td className="p-2 border-e border-slate-200 font-mono text-[11px] font-bold text-blue-700" dir="ltr">
                            {item.extractedCode ? (
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                {item.extractedCode}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>

                          {/* Raw Excel Description */}
                          <td className="p-2 border-e border-slate-200 text-slate-600 max-w-[200px] truncate" title={item.rawDesc}>
                            <span dir="ltr" className="inline-block truncate max-w-full">
                              {item.rawDesc}
                            </span>
                          </td>

                          {/* Predicted Model (Inline Editable Input) */}
                          <td className="p-2 border-e border-slate-200">
                            <input
                              type="text"
                              dir="ltr"
                              value={item.predictedModel}
                              onChange={(e) => handleModelNameChange(item.id, e.target.value)}
                              className="w-full px-2 py-1 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 focus:bg-white rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none transition-all shadow-2xs"
                              placeholder="ناوی مۆدێل..."
                              title="کلیک بکە بۆ دەستکاریکردنی ناوی مۆدێل"
                            />
                          </td>

                          {/* Excel Category */}
                          <td className="p-2 text-center border-e border-slate-200">
                            {item.category ? (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 max-w-[120px] truncate" title={item.category}>
                                {item.category}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">--</span>
                            )}
                          </td>

                          {/* Excel Price strictly preserved in $ */}
                          <td className={`p-2 text-center border-e border-slate-200 font-mono font-black text-xs ${
                            isZeroPrice ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50/40 text-emerald-700'
                          }`}>
                            {item.price && !isZeroPrice ? (
                              <span className="text-sm font-black">${item.price}</span>
                            ) : (
                              <span className="text-amber-600 font-bold flex items-center justify-center gap-1 text-[11px]" title="نرخ 0 یان بەتاڵە - تکایە سەیری ستوونی سەرەوە بکە">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>$0 (بەتاڵ)</span>
                              </span>
                            )}
                          </td>

                          {/* Catalog Match Status & Category Status */}
                          <td className="p-2 border-e border-slate-200">
                            {isMatched ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                                    item.isCategoryMatched ? 'bg-emerald-500' : 'bg-blue-500'
                                  }`} />
                                  <span className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]" title={item.matchedModel.name}>
                                    {item.matchedModel.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-500">
                                  <span>پێش داشکاندن: ${item.currentCatalogPrice || 0}</span>
                                  <span className="text-slate-300">|</span>
                                  <span>داشکاندن: ${item.currentSalePrice || 0}</span>
                                </div>
                                {item.isCategoryMatched ? (
                                  <div className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                    <Check className="w-2.5 h-2.5 shrink-0" />
                                    <span>✅ هەمان کەتەگۆری ({item.catalogCategoryName || 'گونجاو'})</span>
                                  </div>
                                ) : item.catalogCategoryName ? (
                                  <div className="text-[9.5px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded truncate" title={`کەتەلۆگ: ${item.catalogCategoryName}`}>
                                    کەتەلۆگ: {item.catalogCategoryName}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-rose-600 font-bold text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>نەدۆزراوەتەوە</span>
                              </div>
                            )}
                          </td>

                          {/* Single Action Button */}
                          <td className="p-2 text-center">
                            {isMatched ? (
                              <button
                                type="button"
                                onClick={() => handleApplySinglePrice(item)}
                                disabled={isZeroPrice}
                                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all inline-flex items-center gap-1 ${
                                  isZeroPrice
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer active:scale-95'
                                }`}
                                title="نوێکردنەوەی نرخی ئەم کاڵایە لە سیستەم"
                              >
                                <Zap className="w-3 h-3 text-emerald-600" />
                                <span>نوێکردنەوە</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Load More Pagination Row for extreme speed */}
              {filteredItems.length > visibleItems.length && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-center flex items-center justify-center gap-3">
                  <span className="text-xs text-slate-500 font-bold">
                    پیشاندانی {visibleItems.length} لە کۆی {filteredItems.length} کاڵا
                  </span>
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(prev => prev + 50)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-blue-600 rounded-xl shadow-2xs cursor-pointer"
                  >
                    ➕ ٥٠ کاڵای زیاتر پیشان بدە
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(filteredItems.length)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl shadow-2xs cursor-pointer"
                  >
                    👁️ پیشاندانی هەموو ({filteredItems.length})
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Batch Actions Bar */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearStaging}
                  className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="سڕینەوەی ئەم شیتە"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>پاککردنەوەی شیت</span>
                </button>

                {stats.unmatchedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleImportUnmatchedAsNew}
                    disabled={isApplying}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title="زیادکردنی ئەو کاڵایانەی لە کەتەلۆگدا نین"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>هاوردەکردنی نەدۆزراوەکان ({stats.unmatchedCount})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncSelectedPrices}
                    disabled={isApplying}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>نوێکردنەوەی دیاریکراوەکان ({selectedCount})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSyncAllMatchedPrices}
                  disabled={isApplying || stats.matchedCount === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {isApplying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>⚡ نوێکردنەوەی هەموو نرخەکانی پێش داشکاندن ({stats.matchedCount} مۆدێل بە $)</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
