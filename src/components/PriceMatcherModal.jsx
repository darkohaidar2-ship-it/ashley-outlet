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
  FolderTree,
  Edit3,
  Unlink,
  Image as ImageIcon
} from 'lucide-react';
import {
  findExcelMatchForCatalogModel,
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
  // Staging Master Excel Data (saved persistently in LocalStorage)
  const [stagingData, setStagingData] = useState(() => {
    try {
      const saved = localStorage.getItem('ashley_price_matcher_staging');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [rawExcelRows, setRawExcelRows] = useState(() => {
    try {
      const saved = localStorage.getItem('ashley_price_matcher_raw_rows');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [rawHeaders, setRawHeaders] = useState(() => {
    try {
      const saved = localStorage.getItem('ashley_price_matcher_headers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

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

  // User Manual Model Overrides (saved persistently)
  // Maps catalogModelId -> { matchedExcelRow: {...}, unlinked: boolean }
  const [manualModelOverrides, setManualModelOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('ashley_manual_model_overrides');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Active Tab: 'catalog' (Primary) | 'staging' (All Excel Rows) | 'upload' (File upload)
  const [activeTab, setActiveTab] = useState(() => {
    return stagingData.length > 0 ? 'catalog' : 'upload';
  });

  // Filters for Tab 1 (Catalog Models Price Matching)
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilterMode, setCatalogFilterMode] = useState('all'); // 'all' | 'matched' | 'unmatched' | 'diff'
  const [catalogCatFilter, setCatalogCatFilter] = useState('all');
  const [selectedCatalogIds, setSelectedCatalogIds] = useState(new Set());

  // Filters for Tab 2 (Staging Explorer)
  const [stagingSearch, setStagingSearch] = useState('');
  const [stagingSearchCol, setStagingSearchCol] = useState('all');
  const [stagingFilterMode, setStagingFilterMode] = useState('all');
  const [stagingCatFilter, setStagingCatFilter] = useState('all');
  const [visibleStagingLimit, setVisibleStagingLimit] = useState(50);

  // Excel Search Dialog for manually finding a price from Excel for a catalog model
  const [excelSearchTarget, setExcelSearchTarget] = useState(null); // catalog model item
  const [excelSearchQuery, setExcelSearchQuery] = useState('');
  const [excelSearchCat, setExcelSearchCat] = useState('all');
  const [excelSearchTargetCol, setExcelSearchTargetCol] = useState('all'); // 'all' | 'desc' | 'model' | 'price'
  const excelSearchInputRef = useRef(null);

  const [isApplying, setIsApplying] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Persistence effects
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

  useEffect(() => {
    try {
      localStorage.setItem('ashley_manual_model_overrides', JSON.stringify(manualModelOverrides));
    } catch (e) {}
  }, [manualModelOverrides]);

  // Toast auto-hide
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Focus search input when Excel Search modal opens
  useEffect(() => {
    if (excelSearchTarget && excelSearchInputRef.current) {
      const timer = setTimeout(() => {
        excelSearchInputRef.current?.focus();
        excelSearchInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [excelSearchTarget]);

  // Initial tab selection when opening
  useEffect(() => {
    if (isOpen) {
      if (stagingData.length === 0) {
        setActiveTab('upload');
      } else {
        setActiveTab('catalog');
      }
    }
  }, [isOpen]);

  /**
   * Parse rows using column mapping into staging data items
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
        rawModel: rawModel || extracted.model,
        rawDesc: rawDesc || rawModel,
        predictedModel: extracted.model,
        category: extracted.category || rawCat,
        price: cleanPrice,
        rawNote,
        rawRow: r,
        selected: false
      });
    });

    return parsed;
  };

  /**
   * Process raw rows from Excel or Sample
   */
  const processRawData = (rows) => {
    if (!rows || rows.length < 2) return;

    const headers = rows[0].map(h => String(h || '').trim());
    setRawHeaders(headers);
    setRawExcelRows(rows);

    // Smart Column Detection specifically targeting price_usa
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
    setActiveTab('catalog'); // Immediately open Catalog view so user sees prices matched!

    const chosenPriceHeader = headers[detected.priceCol] || `ستوونی ${detected.priceCol + 1}`;
    setSuccessToast(
      `فایلی ئێکسڵ بە سەرکەوتوویی خوێندرایەوە! (${parsedItems.length} کاڵا | ستوونی نرخ: "${chosenPriceHeader}")`
    );
  };

  /**
   * Handle user manually selecting a column from dropdown
   */
  const handleUpdateColumnMapping = (key, newIndex) => {
    const idxNum = parseInt(newIndex, 10);
    const updated = {
      ...columnMapping,
      [key]: idxNum
    };
    setColumnMapping(updated);

    if (rawExcelRows && rawExcelRows.length > 1) {
      const reParsed = parseRowsWithMapping(rawExcelRows, updated);
      setStagingData(reParsed);
      const chosenHeader = rawHeaders[idxNum] !== undefined ? rawHeaders[idxNum] : 'دیاری نەکراوە';
      const label = key === 'modelCol' ? 'مۆدێل' : key === 'descCol' ? 'وەسف' : key === 'priceCol' ? 'نرخ' : 'کەتەگۆری';
      setSuccessToast(`ستوونی ${label} گۆڕدرا بۆ: "${chosenHeader}" - داتاکان نوێکرانەوە!`);
    }
  };

  // Handle Excel file upload (.xlsx, .xls, .csv)
  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Find sheet that has the most rows
        let bestRows = [];
        for (const sheetName of workbook.SheetNames) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
          if (rows && rows.length > bestRows.length) {
            bestRows = rows;
          }
        }

        // Filter out completely blank lines
        const nonEmptyRows = bestRows.filter(r => Array.isArray(r) && r.some(cell => String(cell || '').trim() !== ''));

        if (nonEmptyRows.length < 2) {
          alert('فایلەکە بەتاڵە یان داتای پێویستی تێدا نییە.');
          return;
        }

        // Auto-detect header row index if there is a banner or title row at the top
        let headerIdx = 0;
        for (let i = 0; i < Math.min(nonEmptyRows.length, 5); i++) {
          const rStr = nonEmptyRows[i].map(c => String(c || '').toLowerCase()).join(' ');
          if (
            rStr.includes('model') || 
            rStr.includes('price') || 
            rStr.includes('name') || 
            rStr.includes('code') || 
            rStr.includes('sku') || 
            rStr.includes('نرخ') || 
            rStr.includes('مۆدێل') ||
            rStr.includes('desc')
          ) {
            headerIdx = i;
            break;
          }
        }

        const cleanData = nonEmptyRows.slice(headerIdx);
        processRawData(cleanData);
      } catch (err) {
        console.error('Excel parse error:', err);
        alert('هەڵە لە خوێندنەوەی ئێکسڵ: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Load Built-in Sample Data
  const handleLoadSample = () => {
    processRawData(sampleDataRows);
  };

  /**
   * =========================================================================
   * CORE USER WORKFLOW: MATCH CATALOG MODELS WITH STORED EXCEL PRICE SHEET
   * "ئەو ئایتمانەی کە هەمانە هەموو پارەکەی لەو شیتەوە دەر ئەکەین نرخەکەی بە دۆلار"
   * =========================================================================
   */
  const catalogMatchedItems = useMemo(() => {
    return models.map((m, idx) => {
      const override = manualModelOverrides[m.id];
      const cat = categories.find(c => c.id === m.categoryId);
      const categoryName = cat ? (cat.name_en || cat.name_ku || cat.name || '') : '';
      const currentPriceNum = parsePriceToFloat(m.originalPrice || m.salePrice);

      // 1. If explicitly unlinked by user to leave blank
      if (override && override.unlinked) {
        return {
          id: m.id,
          model: m,
          categoryName,
          currentPrice: currentPriceNum,
          excelPrice: null,
          matchedExcelRow: null,
          isManual: true,
          isUnlinked: true,
          isCategoryMatched: false,
          confidence: 0,
          isPriceDiff: false
        };
      }

      // 2. If manually chosen by user from Excel Search dialog
      if (override && override.matchedExcelRow) {
        const exPrice = parsePriceToFloat(override.matchedExcelRow.price);
        const isDiff = exPrice > 0 && currentPriceNum > 0 && Math.abs(exPrice - currentPriceNum) >= 0.01;
        return {
          id: m.id,
          model: m,
          categoryName,
          currentPrice: currentPriceNum,
          excelPrice: exPrice > 0 ? exPrice : null,
          matchedExcelRow: override.matchedExcelRow,
          isManual: true,
          isUnlinked: false,
          isCategoryMatched: true,
          confidence: 100,
          isPriceDiff: isDiff
        };
      }

      // 3. Strict Smart Auto-Match against stored Excel sheet
      const match = findExcelMatchForCatalogModel(
        { ...m, categoryName },
        stagingData,
        categories
      );

      const isDiff = match.excelPrice && currentPriceNum > 0 && Math.abs(match.excelPrice - currentPriceNum) >= 0.01;

      return {
        id: m.id,
        model: m,
        categoryName,
        currentPrice: currentPriceNum,
        excelPrice: match.excelPrice,
        matchedExcelRow: match.matchedExcelRow,
        isManual: false,
        isUnlinked: false,
        isCategoryMatched: match.isCategoryMatched,
        confidence: match.confidence,
        isPriceDiff: isDiff
      };
    });
  }, [models, stagingData, manualModelOverrides, categories]);

  // Catalog tab statistics
  const catalogStats = useMemo(() => {
    const total = catalogMatchedItems.length;
    const matched = catalogMatchedItems.filter(i => i.excelPrice !== null && i.excelPrice > 0);
    const unmatched = catalogMatchedItems.filter(i => i.excelPrice === null);
    const diff = matched.filter(i => i.isPriceDiff);

    return {
      total,
      matchedCount: matched.length,
      unmatchedCount: unmatched.length,
      diffCount: diff.length
    };
  }, [catalogMatchedItems]);

  // Filtered Catalog Items for Tab 1
  const filteredCatalogItems = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();

    return catalogMatchedItems.filter(item => {
      // 1. Status Filter Mode
      if (catalogFilterMode === 'matched' && (!item.excelPrice || item.excelPrice <= 0)) return false;
      if (catalogFilterMode === 'unmatched' && (item.excelPrice && item.excelPrice > 0)) return false;
      if (catalogFilterMode === 'diff' && !item.isPriceDiff) return false;

      // 2. Category Filter
      if (catalogCatFilter !== 'all') {
        if (item.model.categoryId !== catalogCatFilter) return false;
      }

      // 3. Search Query
      if (!q) return true;
      const mName = (item.model.name || '').toLowerCase();
      const mSku = (item.model.sku || '').toLowerCase();
      const mCat = (item.categoryName || '').toLowerCase();
      const exDesc = (item.matchedExcelRow?.rawDesc || '').toLowerCase();
      const exPrice = String(item.excelPrice || '').toLowerCase();

      return (
        mName.includes(q) ||
        mSku.includes(q) ||
        mCat.includes(q) ||
        exDesc.includes(q) ||
        exPrice.includes(q)
      );
    });
  }, [catalogMatchedItems, catalogFilterMode, catalogCatFilter, catalogSearch]);

  // Toggle selection for all visible catalog items
  const handleToggleSelectAllCatalog = (checked) => {
    if (checked) {
      setSelectedCatalogIds(new Set(filteredCatalogItems.map(i => i.id)));
    } else {
      setSelectedCatalogIds(new Set());
    }
  };

  const handleToggleSingleCatalogSelect = (id) => {
    setSelectedCatalogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /**
   * Manual Excel Search Dialog Handlers
   */
  const handleOpenExcelSearch = (catalogItem) => {
    setExcelSearchTarget(catalogItem);
    // Pre-fill with SKU or extracted variant code or name
    const initial = catalogItem.model.sku || catalogItem.model.name || '';
    setExcelSearchQuery(initial);
    setExcelSearchCat('all');
    setExcelSearchTargetCol('all');
  };

  const handleCloseExcelSearch = () => {
    setExcelSearchTarget(null);
    setExcelSearchQuery('');
    setExcelSearchTargetCol('all');
  };

  // Assign chosen Excel row to the target catalog model
  const handleAssignExcelRowToModel = (modelId, excelRow) => {
    setManualModelOverrides(prev => ({
      ...prev,
      [modelId]: {
        matchedExcelRow: excelRow,
        unlinked: false
      }
    }));
    handleCloseExcelSearch();
    setSuccessToast(`نرخی $${excelRow.price} بۆ مۆدێلی "${excelSearchTarget?.model.name}" دەستنیشانکرا!`);
  };

  // Leave catalog model blank / unlinked (spêtî)
  const handleUnlinkCatalogModel = (modelId) => {
    setManualModelOverrides(prev => ({
      ...prev,
      [modelId]: {
        matchedExcelRow: null,
        unlinked: true
      }
    }));
    setSuccessToast('بەتاڵکرایەوە (سپێتی کرا).');
  };

  // Filtered Excel rows inside the Manual Search Dialog
  const excelDialogSearchResults = useMemo(() => {
    if (!excelSearchTarget || stagingData.length === 0) return [];
    const q = excelSearchQuery.trim().toLowerCase();

    return stagingData.filter(item => {
      if (excelSearchCat !== 'all') {
        const itemCatGroup = getCategoryGroup(item.category || item.rawDesc);
        if (itemCatGroup !== excelSearchCat) return false;
      }
      if (!q) return true;

      const desc = String(item.rawDesc || '').toLowerCase();
      const rawModel = String(item.rawModel || '').toLowerCase();
      const model = String(item.predictedModel || '').toLowerCase();
      const code = String(item.extractedCode || item.rawCode || '').toLowerCase();
      const price = String(item.price || '').toLowerCase();

      // Filter specifically by chosen column!
      if (excelSearchTargetCol === 'desc') {
        return desc.includes(q);
      }
      if (excelSearchTargetCol === 'model') {
        return rawModel.includes(q) || model.includes(q) || code.includes(q);
      }
      if (excelSearchTargetCol === 'price') {
        return price.includes(q);
      }
      // If a specific column index from rawHeaders was selected:
      if (!isNaN(parseInt(excelSearchTargetCol, 10)) && excelSearchTargetCol !== 'all') {
        const colIdx = parseInt(excelSearchTargetCol, 10);
        if (item.rawRow && item.rawRow[colIdx] !== undefined) {
          return String(item.rawRow[colIdx] || '').toLowerCase().includes(q);
        }
      }

      // Default 'all' columns
      return (
        desc.includes(q) ||
        rawModel.includes(q) ||
        model.includes(q) ||
        code.includes(q) ||
        price.includes(q)
      );
    }).slice(0, 80);
  }, [excelSearchTarget, stagingData, excelSearchQuery, excelSearchTargetCol, excelSearchCat]);

  /**
   * Apply Price Updates to Catalog
   */
  // 1. Single model price update
  const handleApplySingleCatalogPrice = (item) => {
    if (!item.excelPrice || item.excelPrice <= 0) {
      alert('نرخێک لە ئێکسڵەوە دەستنیشان نەکراوە یان سفرە ($0)');
      return;
    }

    const updated = models.map(m => {
      if (m.id === item.model.id) {
        return {
          ...m,
          originalPrice: item.excelPrice,
          salePrice: (m.salePrice !== undefined && m.salePrice !== null && m.salePrice !== '') ? Number(m.salePrice) : 0
        };
      }
      return m;
    });

    onApplyPriceUpdates(updated);
    setSuccessToast(`نرخی پێش داشکاندنی "${item.model.name}" نوێکرایەوە بۆ $${item.excelPrice}!`);
  };

  // 2. Batch update ALL matched catalog prices
  const handleApplyAllCatalogPrices = async () => {
    const validItems = catalogMatchedItems.filter(i => i.excelPrice && i.excelPrice > 0);
    if (validItems.length === 0) {
      alert('هیچ نرخێکی دروست لە فایلی ئێکسڵدا نەدۆزراوەتەوە بۆ نوێکردنەوە.');
      return;
    }

    setIsApplying(true);
    const priceMap = new Map();
    validItems.forEach(i => {
      priceMap.set(i.model.id, i.excelPrice);
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
      setSuccessToast(`⚡ ${priceMap.size} مۆدێلی کەتەلۆگ بە نرخی دۆلاری ئێکسڵ ($) نوێکرانەوە!`);
    } catch (err) {
      alert('هەڵە لە نوێکردنەوەی نرخەکان: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  // 3. Batch update SELECTED catalog items
  const handleApplySelectedCatalogPrices = async () => {
    const selectedItems = catalogMatchedItems.filter(
      i => selectedCatalogIds.has(i.id) && i.excelPrice && i.excelPrice > 0
    );

    if (selectedItems.length === 0) {
      alert('تکایە سەرەتا چەند مۆدێلێک بە چێکبۆکس هەڵبژێرە کە نرخیان لە ئێکسڵ دۆزرابێتەوە.');
      return;
    }

    setIsApplying(true);
    const priceMap = new Map();
    selectedItems.forEach(i => {
      priceMap.set(i.model.id, i.excelPrice);
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
      setSuccessToast(`✅ ${priceMap.size} مۆدێلی هەڵبژێردراو نوێکرانەوە!`);
      setSelectedCatalogIds(new Set());
    } catch (err) {
      alert('هەڵە: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * Staging tab handlers
   */
  const handleClearStaging = () => {
    if (window.confirm('ئایا دڵنیایت لە سڕینەوەی ئەم فایلی ئێکسڵە لە سیستەم؟')) {
      setStagingData([]);
      setRawExcelRows([]);
      setRawHeaders([]);
      setManualModelOverrides({});
      localStorage.removeItem('ashley_price_matcher_staging');
      localStorage.removeItem('ashley_price_matcher_raw_rows');
      localStorage.removeItem('ashley_price_matcher_headers');
      localStorage.removeItem('ashley_manual_model_overrides');
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
                دەرهێنانی نرخی کاڵاکانی ناو کەتەلۆگ لە فایلی ئێکسڵ (price_usa) و دەستنیشانکردنی دەستی
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
            {/* Tab 1: Primary Catalog Models View */}
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                activeTab === 'catalog'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>📋 مۆدێلەکانی کەتەلۆگ (Catalog Models)</span>
              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.2 rounded-full font-mono font-bold">
                {models.length}
              </span>
            </button>

            {/* Tab 2: Full Excel Staging Explorer */}
            <button
              type="button"
              onClick={() => setActiveTab('staging')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                activeTab === 'staging'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>🔍 پشکنەری فایلی ئێکسڵ (Excel Explorer)</span>
              {stagingData.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.2 rounded-full font-mono font-bold">
                  {stagingData.length}
                </span>
              )}
            </button>

            {/* Tab 3: Upload Excel */}
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
              <span>📁 بارکردنی فایلی نوێ (Upload)</span>
            </button>
          </div>

          {/* Quick Load Sample Data Button */}
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="بارکردنی نموونەی ئامادەکراو (B719-56W1, Clan, 1202020, D8917, C5473)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>⚡ نموونەی ئامادەکراو</span>
          </button>
        </div>

        {/* Live Column Selection Bar (دیاریکردنی دەستی ستوونەکانی ئێکسڵ) */}
        {rawHeaders.length > 0 && (
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>دیاریکردنی ستوونەکانی فایلی ئێکسڵ:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Model Col */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
                <span className="font-bold text-slate-500 text-[11px]">مۆدێل (MODEL EN):</span>
                <select
                  value={columnMapping.modelCol}
                  onChange={(e) => handleUpdateColumnMapping('modelCol', e.target.value)}
                  className="font-bold text-blue-700 bg-transparent focus:outline-none cursor-pointer text-xs max-w-[130px] truncate"
                >
                  <option value="-1">-- هەڵبژێرە --</option>
                  {rawHeaders.map((h, idx) => (
                    <option key={idx} value={idx}>{idx + 1}. {h || `ستوونی ${idx + 1}`}</option>
                  ))}
                </select>
              </div>

              {/* Desc Col */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
                <span className="font-bold text-slate-500 text-[11px]">وەسف (NAME EN):</span>
                <select
                  value={columnMapping.descCol}
                  onChange={(e) => handleUpdateColumnMapping('descCol', e.target.value)}
                  className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer text-xs max-w-[140px] truncate"
                >
                  <option value="-1">-- هەڵبژێرە --</option>
                  {rawHeaders.map((h, idx) => (
                    <option key={idx} value={idx}>{idx + 1}. {h || `ستوونی ${idx + 1}`}</option>
                  ))}
                </select>
              </div>

              {/* Price Col */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
                <span className="font-bold text-slate-500 text-[11px]">نرخ (price_usa):</span>
                <select
                  value={columnMapping.priceCol}
                  onChange={(e) => handleUpdateColumnMapping('priceCol', e.target.value)}
                  className="font-bold text-emerald-700 bg-transparent focus:outline-none cursor-pointer text-xs max-w-[130px] truncate"
                >
                  <option value="-1">-- هەڵبژێرە --</option>
                  {rawHeaders.map((h, idx) => (
                    <option key={idx} value={idx}>{idx + 1}. {h || `ستوونی ${idx + 1}`}</option>
                  ))}
                </select>
              </div>

              {/* Cat Col */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
                <span className="font-bold text-slate-500 text-[11px]">کەتەگۆری:</span>
                <select
                  value={columnMapping.catCol}
                  onChange={(e) => handleUpdateColumnMapping('catCol', e.target.value)}
                  className="font-bold text-purple-700 bg-transparent focus:outline-none cursor-pointer text-xs max-w-[130px] truncate"
                >
                  <option value="-1">-- بێ کەتەگۆری --</option>
                  {rawHeaders.map((h, idx) => (
                    <option key={idx} value={idx}>{idx + 1}. {h || `ستوونی ${idx + 1}`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: PRIMARY CATALOG MODELS VIEW (ئەو ئایتمانەی کە هەمانە)
            ========================================================================= */}
        {activeTab === 'catalog' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
            
            {/* Notice if Excel sheet not loaded yet */}
            {stagingData.length === 0 && (
              <div className="m-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    هێشتا هیچ فایلی ئێکسڵێک بارنەکراوە. تکایە فایلی ئێکسڵی نرخەکان لە تابی (بارکردن) دانێ، یان کلیک لە دوگمەی نموونە بکە:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shrink-0 cursor-pointer shadow-xs"
                >
                  ⚡ بارکردنی نموونەی ئاشڵی
                </button>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              
              <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="گەڕان لە مۆدێلەکانی کەتەلۆگ (ناو، کۆد، کەتەگۆری)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setCatalogFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    catalogFilterMode === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  هەمووی ({catalogStats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogFilterMode('matched')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    catalogFilterMode === 'matched'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>دۆزراوە لە ئێکسڵ ({catalogStats.matchedCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogFilterMode('unmatched')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    catalogFilterMode === 'unmatched'
                      ? 'bg-slate-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>بەتاڵ (نەدۆزراوە) ({catalogStats.unmatchedCount})</span>
                </button>
                {catalogStats.diffCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setCatalogFilterMode('diff')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      catalogFilterMode === 'diff'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <span>نرخی جیاواز ({catalogStats.diffCount})</span>
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              {categories.length > 0 && (
                <div className="flex items-center gap-1">
                  <select
                    value={catalogCatFilter}
                    onChange={(e) => setCatalogCatFilter(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">هەموو بەشەکان</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name_ku || c.name_en || c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            </div>

            {/* Catalog Models Table */}
            <div className="flex-1 overflow-auto bg-white select-text">
              {models.length === 0 ? (
                <div className="text-center py-20 p-6 text-slate-400 text-xs">
                  هیچ مۆدێلێک لە کەتەلۆگدا نییە.
                </div>
              ) : filteredCatalogItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  🔍 هیچ مۆدێلێک نەدۆزرایەوە بەم فلتەرە.
                </div>
              ) : (
                <table className="w-full text-xs text-slate-800 border-collapse border border-slate-200">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 text-[11px] font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 w-9 text-center border-e border-slate-200">
                        <input
                          type="checkbox"
                          checked={selectedCatalogIds.size > 0 && selectedCatalogIds.size === filteredCatalogItems.length}
                          onChange={(e) => handleToggleSelectAllCatalog(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-2 w-8 text-center border-e border-slate-200 font-mono">#</th>
                      <th className="p-2 w-12 text-center border-e border-slate-200">وێنە</th>
                      <th className="p-2 min-w-[170px] text-start border-e border-slate-200">مۆدێلی کەتەلۆگ (ناو و کۆد / SKU)</th>
                      <th className="p-2 w-28 text-center border-e border-slate-200">کەتەگۆری</th>
                      <th className="p-2 w-28 text-center border-e border-slate-200">نرخی ئێستا ($)</th>
                      <th className="p-2 min-w-[220px] text-start border-e border-slate-200 bg-emerald-50/50 text-emerald-950">
                        نرخ لە فایلی ئێکسڵ (price_usa $)
                      </th>
                      <th className="p-2 w-24 text-center">کردار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredCatalogItems.map((item, idx) => {
                      const isMatched = item.excelPrice !== null && item.excelPrice > 0;
                      const isSelected = selectedCatalogIds.has(item.id);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-2 text-center border-e border-slate-200">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSingleCatalogSelect(item.id)}
                              className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
                            />
                          </td>

                          {/* Index */}
                          <td className="p-2 text-center border-e border-slate-200 font-mono text-[11px] text-slate-500">
                            {idx + 1}
                          </td>

                          {/* Thumbnail */}
                          <td className="p-1.5 text-center border-e border-slate-200">
                            {item.model.image ? (
                              <img
                                src={item.model.image}
                                alt={item.model.name}
                                className="w-9 h-9 rounded-lg object-cover mx-auto border border-slate-200 shadow-2xs"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </td>

                          {/* Catalog Model Name & SKU */}
                          <td className="p-2 border-e border-slate-200">
                            <div className="font-bold text-slate-800 text-xs">
                              {item.model.name}
                            </div>
                            {item.model.sku && (
                              <div className="mt-0.5">
                                <span className="font-mono text-[10.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200" dir="ltr">
                                  {item.model.sku}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Category Badge */}
                          <td className="p-2 text-center border-e border-slate-200">
                            {item.categoryName ? (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 max-w-[110px] truncate">
                                {item.categoryName}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>

                          {/* Current Catalog Price */}
                          <td className="p-2 text-center border-e border-slate-200 font-mono text-xs">
                            <span className="text-slate-700 font-bold">
                              ${item.currentPrice || 0}
                            </span>
                          </td>

                          {/* Price in Excel Sheet Column */}
                          <td className="p-2 border-e border-slate-200">
                            {isMatched ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                                      ${item.excelPrice}
                                    </span>
                                    {item.isManual && (
                                      <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200">
                                        دەستی
                                      </span>
                                    )}
                                    {item.isCategoryMatched && (
                                      <span className="text-[9.5px] bg-emerald-50 text-emerald-800 font-bold px-1 rounded flex items-center gap-0.5">
                                        <Check className="w-2.5 h-2.5" />
                                        <span>هەمان کەتەگۆری</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenExcelSearch(item)}
                                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="گۆڕینی ئەم نرخە بە سێرچ لە ئێکسڵ"
                                    >
                                      <Search className="w-2.5 h-2.5" />
                                      <span>گۆڕین</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUnlinkCatalogModel(item.model.id)}
                                      className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[10px] font-bold transition-all cursor-pointer"
                                      title="سڕینەوەی ئەم نرخە تا سپێتی بێت"
                                    >
                                      ✕ بەتاڵ
                                    </button>
                                  </div>
                                </div>

                                {/* Matched Excel Row details */}
                                {item.matchedExcelRow && (
                                  <div className="text-[10px] space-y-0.5 text-slate-600 font-mono mt-1" dir="ltr">
                                    <div className="flex items-center gap-1.5 truncate max-w-[290px]">
                                      <span className="font-black text-slate-400 text-[9px] uppercase tracking-wider bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                                        MODEL EN:
                                      </span>
                                      <span className="font-bold text-blue-700">
                                        {item.matchedExcelRow.rawModel || item.matchedExcelRow.predictedModel || '-'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 truncate max-w-[290px]" title={item.matchedExcelRow.rawDesc}>
                                      <span className="font-black text-slate-400 text-[9px] uppercase tracking-wider bg-slate-100 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                                        NAME EN:
                                      </span>
                                      <span className="font-semibold text-slate-800 truncate">
                                        {item.matchedExcelRow.rawDesc || item.matchedExcelRow.predictedModel}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="py-1">
                                <div className="text-slate-400 font-bold text-[11px] mb-1.5 flex items-center gap-1">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                  <span className="italic">— بەتاڵ (لە ئێکسڵ نەدۆزراوە) —</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenExcelSearch(item)}
                                  className="w-full px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                  title="سێرچکردن لە فایلی ئێکسڵ تا بە دەستی نرخەکەی بدۆزیتەوە"
                                >
                                  <Search className="w-3 h-3 text-blue-600" />
                                  <span>🔍 سێرچکردن لە ناو ئێکسڵ بە دەست</span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Row Single Action */}
                          <td className="p-2 text-center">
                            {isMatched ? (
                              <button
                                type="button"
                                onClick={() => handleApplySingleCatalogPrice(item)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10.5px] font-bold transition-all inline-flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                                title="نوێکردنەوەی نرخی ئەم مۆدێلە لە کەتەلۆگ"
                              >
                                <Zap className="w-3 h-3 text-emerald-600" />
                                <span>جێبەجێکردن</span>
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
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">
                  {catalogStats.matchedCount} لە مۆدێلەکانمان نرخەکەیان لە ئێکسڵ ئامادەیە.
                </span>
                {selectedCatalogIds.size > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedCatalogIds.size} هەڵبژێردراوە
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedCatalogIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleApplySelectedCatalogPrices}
                    disabled={isApplying}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>نوێکردنەوەی دیاریکراوەکان ({selectedCatalogIds.size})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleApplyAllCatalogPrices}
                  disabled={isApplying || catalogStats.matchedCount === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {isApplying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>⚡ نوێکردنەوەی هەموو نرخەکان لە ئێکسڵەوە ({catalogStats.matchedCount} مۆدێل بە $)</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 2: FULL EXCEL STAGING EXPLORER (پشکنەری فایلی ئێکسڵ)
            ========================================================================= */}
        {activeTab === 'staging' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
            {/* Header info & column filter */}
            <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={stagingSearch}
                    onChange={(e) => setStagingSearch(e.target.value)}
                    placeholder="گەڕان لە فایلی ئێکسڵ..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">لە ستوونی:</span>
                  <select
                    value={stagingSearchCol}
                    onChange={(e) => setStagingSearchCol(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                  >
                    <option value="all">هەموو ستوونەکان</option>
                    <option value="desc">وەسف (NAME EN)</option>
                    <option value="model">مۆدێل (MODEL EN)</option>
                    <option value="code">کۆد (SKU)</option>
                    <option value="price">نرخ (price_usa)</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-bold font-mono">
                کۆی دێڕەکان: {stagingData.length}
              </div>
            </div>

            {/* Staging Table */}
            <div className="flex-1 overflow-auto bg-white select-text">
              {stagingData.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs">
                  فایلی ئێکسڵ بەتاڵە.
                </div>
              ) : (
                <table className="w-full text-xs text-slate-800 border-collapse border border-slate-200">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 text-[11px] font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 w-8 text-center border-e border-slate-200 font-mono">#</th>
                      <th className="p-2 w-32 text-start border-e border-slate-200">کۆد (SKU)</th>
                      <th className="p-2 min-w-[160px] text-start border-e border-slate-200">وەسف (NAME EN)</th>
                      <th className="p-2 w-36 text-start border-e border-slate-200">مۆدێل (MODEL EN)</th>
                      <th className="p-2 w-28 text-center border-e border-slate-200">کەتەگۆری</th>
                      <th className="p-2 w-28 text-center bg-emerald-50/70 text-emerald-950">نرخ (price_usa $)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {stagingData
                      .filter(i => {
                        if (!stagingSearch) return true;
                        const q = stagingSearch.toLowerCase();
                        if (stagingSearchCol === 'desc') return (i.rawDesc || '').toLowerCase().includes(q);
                        if (stagingSearchCol === 'model') return (i.predictedModel || i.rawModel || '').toLowerCase().includes(q);
                        if (stagingSearchCol === 'code') return (i.extractedCode || i.rawCode || '').toLowerCase().includes(q);
                        if (stagingSearchCol === 'price') return String(i.price || '').toLowerCase().includes(q);
                        return (
                          (i.extractedCode || '').toLowerCase().includes(q) ||
                          (i.predictedModel || '').toLowerCase().includes(q) ||
                          (i.rawDesc || '').toLowerCase().includes(q) ||
                          String(i.price || '').toLowerCase().includes(q)
                        );
                      })
                      .slice(0, visibleStagingLimit)
                      .map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2 text-center border-e border-slate-200 font-mono text-[11px] text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-e border-slate-200 font-mono text-[11px] font-bold text-blue-700" dir="ltr">
                            {item.extractedCode || '-'}
                          </td>
                          <td className="p-2 border-e border-slate-200 text-slate-700 max-w-[240px] truncate" dir="ltr" title={item.rawDesc}>
                            {item.rawDesc}
                          </td>
                          <td className="p-2 border-e border-slate-200 font-bold text-slate-800" dir="ltr">
                            {item.predictedModel}
                          </td>
                          <td className="p-2 text-center border-e border-slate-200">
                            {item.category ? (
                              <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                                {item.category}
                              </span>
                            ) : '--'}
                          </td>
                          <td className="p-2 text-center font-mono font-black text-emerald-700 bg-emerald-50/30">
                            ${item.price || 0}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearStaging}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاککردنەوەی ئەم فایلی ئێکسڵە</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                گەڕانەوە بۆ مۆدێلەکانی کەتەلۆگ ➔
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: UPLOAD NEW EXCEL MASTER SHEET
            ========================================================================= */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

            {/* Quick Demo Sample Data Card */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div>
                <h5 className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>تاقیکردنەوە بە نموونەی فەرمی (Ashley Sample Data)</span>
                </h5>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  دەستبەجێ مۆدێلەکان باردەکات: (Clan $3140, B719-56W1 $1250, 1202020 $780, D8917 $11, C5473 $16, C6183 $42)
                </p>
              </div>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                ⚡ بارکردنی نموونەکە
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            INTERACTIVE EXCEL SEARCH MODAL DIALOG
            User searches the Master Excel Sheet for a specific catalog model!
            "خۆم سێرچ بکەم تا بە دستی پێت بڵێم کام مۆدێلەیە تۆیش یەکسەر نرخەکەی ببێنیت"
            ========================================================================= */}
        {excelSearchTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleUp">
              
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 leading-tight">
                      گەڕان لە فایلی ئێکسڵ بە دەست
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      دۆزینەوەی نرخ بۆ مۆدێلی: <span className="font-bold text-slate-800 font-mono">{excelSearchTarget.model.name}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseExcelSearch}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Target Model Info Banner */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-slate-50 to-emerald-50/50 border-b border-slate-200 text-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  زانیاری ئەم مۆدێلەی کەتەلۆگ کە نرخەکەی بۆ دەهێنیت:
                </div>
                <div className="flex flex-wrap items-center gap-2 text-slate-800">
                  {excelSearchTarget.model.sku && (
                    <span className="font-mono font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200" dir="ltr">
                      کۆد: {excelSearchTarget.model.sku}
                    </span>
                  )}
                  <span className="font-bold text-slate-800">
                    {excelSearchTarget.model.name}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600">
                    بەش: {excelSearchTarget.categoryName || 'دیاری نەکراوە'}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono text-slate-500">
                    نرخی ئێستا: ${excelSearchTarget.currentPrice || 0}
                  </span>
                </div>
              </div>

              {/* Search Bar & Column Selection Controls */}
              <div className="p-4 border-b border-slate-200 bg-white space-y-3">
                <div className="relative">
                  <input
                    ref={excelSearchInputRef}
                    type="text"
                    dir="ltr"
                    value={excelSearchQuery}
                    onChange={(e) => setExcelSearchQuery(e.target.value)}
                    placeholder="سێرچ لە فایلی ئێکسڵ بە کۆد (وەک B719-56W1)، ناوی مۆدێل، یان وەسف..."
                    className="w-full pl-9 pr-9 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl focus:outline-none transition-all shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  {excelSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setExcelSearchQuery('')}
                      className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Column Selection Toolbar for Search */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3 text-blue-600" />
                      <span>گەڕان لە ستوونی:</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setExcelSearchTargetCol('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        excelSearchTargetCol === 'all'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      هەموو ستوونەکان
                    </button>

                    <button
                      type="button"
                      onClick={() => setExcelSearchTargetCol('desc')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        excelSearchTargetCol === 'desc'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>وەسف (NAME EN)</span>
                      {columnMapping.descCol >= 0 && rawHeaders[columnMapping.descCol] && (
                        <span className="text-[9.5px] opacity-75 font-mono">({rawHeaders[columnMapping.descCol]})</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExcelSearchTargetCol('model')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        excelSearchTargetCol === 'model'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>مۆدێل (MODEL EN)</span>
                      {columnMapping.modelCol >= 0 && rawHeaders[columnMapping.modelCol] && (
                        <span className="text-[9.5px] opacity-75 font-mono">({rawHeaders[columnMapping.modelCol]})</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExcelSearchTargetCol('price')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        excelSearchTargetCol === 'price'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>نرخ (price_usa)</span>
                    </button>
                  </div>

                  {/* Direct Dropdown for Any Column */}
                  {rawHeaders.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-medium">یان ستوونی تر:</span>
                      <select
                        value={['all', 'desc', 'model', 'price'].includes(excelSearchTargetCol) ? '' : excelSearchTargetCol}
                        onChange={(e) => {
                          if (e.target.value) setExcelSearchTargetCol(e.target.value);
                        }}
                        className="text-[11px] font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer max-w-[120px] truncate"
                      >
                        <option value="">-- هەڵبژاردن --</option>
                        {rawHeaders.map((h, idx) => (
                          <option key={idx} value={String(idx)}>
                            {idx + 1}. {h || `ستوونی ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Live Result Count Banner */}
                <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                  <span>
                    ئەنجامەکان: <strong className="font-mono text-slate-800">{excelDialogSearchResults.length}</strong> دێڕ دۆزرایەوە
                  </span>
                  {excelSearchTargetCol !== 'all' && (
                    <span className="text-blue-600 font-bold text-[10.5px]">
                      فلتەرکراو بەپێی ستوونی هەڵبژێردراو
                    </span>
                  )}
                </div>
              </div>

              {/* Results from Excel Master Sheet */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 min-h-[260px] max-h-[380px]">
                {excelDialogSearchResults.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <div className="text-2xl mb-2">🔍</div>
                    <p className="font-bold text-slate-600">هیچ دێڕێک لە فایلی ئێکسڵ نەدۆزرایەوە</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      هیچ کاڵایەک بە پیتەکانی "{excelSearchQuery}" لە فایلی ئێکسڵدا نییە. دەتوانیت وشەی سێرچەکە دەستکاری بکەیت.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {excelDialogSearchResults.map((row) => (
                      <div
                        key={row.id}
                        className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:shadow-md transition-all group"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5" dir="ltr">
                          
                          {/* Row 1: MODEL EN and Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              MODEL EN:
                            </span>
                            <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                              {row.rawModel || row.predictedModel || '-'}
                            </span>

                            {row.extractedCode && row.extractedCode !== (row.rawModel || row.predictedModel) && (
                              <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                SKU: {row.extractedCode}
                              </span>
                            )}

                            {row.category && (
                              <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                                {row.category}
                              </span>
                            )}
                          </div>

                          {/* Row 2: NAME EN (Full description from Excel) */}
                          <div className="flex items-start gap-1.5 text-xs text-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0 mt-0.5">
                              NAME EN:
                            </span>
                            <span className="font-bold text-slate-800 leading-snug break-words">
                              {row.rawDesc || row.predictedModel}
                            </span>
                          </div>

                        </div>

                        {/* Price & Pick Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-start sm:text-end">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              price_usa
                            </div>
                            <div className="font-mono font-black text-emerald-700 text-lg leading-none mt-0.5">
                              ${row.price || 0}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAssignExcelRowToModel(excelSearchTarget.model.id, row)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <Check className="w-4 h-4" />
                            <span>وەرگرتنی ئەم نرخە</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleUnlinkCatalogModel(excelSearchTarget.model.id);
                    handleCloseExcelSearch();
                  }}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>بە بەتاڵی بهێڵەوە (سپێتی کرا)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseExcelSearch}
                  className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  داخستن
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
