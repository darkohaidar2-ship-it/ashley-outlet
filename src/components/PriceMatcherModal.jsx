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
  Image as ImageIcon,
  Download,
  Table as TableIcon,
  LayoutGrid,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import {
  findExcelMatchForCatalogModel,
  extractSmartModel,
  matchStagingItemWithCatalog,
  sampleDataRows,
  cleanNumericPrice,
  parsePriceToFloat,
  detectExcelColumns,
  getCategoryGroup,
  suggestModelFromRow,
  rankExcelRows,
  cleanModelNumber
} from '../utils/modelExtractor';
import { catalogService } from '../services/catalogService';

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

  // Active Tab: 'auto' (Automatic Matching) | 'manual' (Manual Matching)
  const [activeTab, setActiveTab] = useState('auto');

  // Filters for Tab 1 (Automatic Matching)
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilterMode, setCatalogFilterMode] = useState('all'); // 'all' | 'matched' | 'unmatched' | 'diff'
  const [catalogCatFilter, setCatalogCatFilter] = useState('all');
  const [selectedCatalogIds, setSelectedCatalogIds] = useState(new Set());

  // Filters for Tab 2 (Manual Matching)
  const [manualSearch, setManualSearch] = useState('');
  const [manualFilterMode, setManualFilterMode] = useState('all'); // 'all' | 'unmatched' | 'manual'
  const [manualCatFilter, setManualCatFilter] = useState('all');

  // Excel Search Dialog for manually finding a price from Excel for a catalog model
  const [excelSearchTarget, setExcelSearchTarget] = useState(null); // catalog model item
  const [excelSearchQuery, setExcelSearchQuery] = useState('');
  const [excelSearchCat, setExcelSearchCat] = useState('all');
  const [excelSearchTargetCol, setExcelSearchTargetCol] = useState('all'); // 'all' | 'cat' | 'model' | 'desc' | 'price' | 'suggested'
  const [excelDialogViewMode, setExcelDialogViewMode] = useState('cards'); // 'cards' | 'table'
  const excelSearchInputRef = useRef(null);

  // Search filter for 5-Column Excel tab
  const [excel5ColSearch, setExcel5ColSearch] = useState('');
  // Active selected catalog model in the unified Manual / 5-Column section
  const [activeManualModelId, setActiveManualModelId] = useState(null);

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
      const rawDesc = (dIdx >= 0 && r[dIdx] !== undefined) ? String(r[dIdx]).trim() : '';
      const rawPrice = (pIdx >= 0 && r[pIdx] !== undefined && r[pIdx] !== null) ? String(r[pIdx]).trim() : '';
      const rawCode = (cIdx >= 0 && r[cIdx] !== undefined && r[cIdx] !== null) ? String(r[cIdx]).trim() : '';
      const rawCat = (catIdx >= 0 && r[catIdx] !== undefined && r[catIdx] !== null) ? String(r[catIdx]).trim() : '';
      const rawNote = (nIdx >= 0 && r[nIdx] !== undefined && r[nIdx] !== null) ? String(r[nIdx]).trim() : '';

      if (!rawDesc && !rawModel && !rawPrice && !rawCode && !rawCat) return;

      const extracted = extractSmartModel(rawDesc, rawModel, rawCode, rawPrice, rawCat);
      const cleanPrice = cleanNumericPrice(rawPrice) || extracted.price;
      const suggestion = suggestModelFromRow(rawCat, rawModel, rawDesc);

      parsed.push({
        id: 'stg_' + idx + '_' + Math.random().toString(36).substring(2, 7),
        rawCode,
        extractedCode: extracted.code,
        rawModel: rawModel || extracted.model,
        rawDesc: rawDesc || rawModel, // Complete, un-truncated string from Excel!
        predictedModel: (suggestion.suggestedModel && suggestion.suggestedModel !== '-') ? suggestion.suggestedModel : (rawModel || extracted.model),
        category: rawCat || extracted.category,
        price: cleanPrice,
        suggestedModel: suggestion.suggestedModel,
        suggestionReason: suggestion.reason,
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
    setActiveTab('auto'); // Immediately open Automatic view so user sees prices matched!

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
    const manualMatched = catalogMatchedItems.filter(i => i.isManual && i.excelPrice !== null && i.excelPrice > 0);
    const diff = matched.filter(i => i.isPriceDiff);

    return {
      total,
      matchedCount: matched.length,
      unmatchedCount: unmatched.length,
      manualCount: manualMatched.length,
      diffCount: diff.length
    };
  }, [catalogMatchedItems]);

  // Filtered Catalog Items for Tab 1 (Auto)
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

  // Filtered Catalog Items for Tab 2 (Manual)
  const filteredManualItems = useMemo(() => {
    const q = manualSearch.trim().toLowerCase();

    return catalogMatchedItems.filter(item => {
      // 1. Status Filter Mode
      if (manualFilterMode === 'unmatched' && (item.excelPrice && item.excelPrice > 0)) return false;
      if (manualFilterMode === 'manual' && (!item.isManual || !item.excelPrice)) return false;

      // 2. Category Filter
      if (manualCatFilter !== 'all') {
        if (item.model.categoryId !== manualCatFilter) return false;
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
  }, [catalogMatchedItems, manualFilterMode, manualCatFilter, manualSearch]);

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
    const modelObj = models.find(m => m.id === modelId) || excelSearchTarget?.model;
    setSuccessToast(`نرخی $${excelRow.price} دەستنیشانکرا بۆ مۆدێلی «${modelObj?.sku || modelObj?.name || ''}»`);
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

  // Active Catalog Item in the unified Manual / 5-Column section
  const activeManualItem = useMemo(() => {
    if (!catalogMatchedItems || catalogMatchedItems.length === 0) return null;
    if (activeManualModelId) {
      const found = catalogMatchedItems.find(it => it.model.id === activeManualModelId);
      if (found) return found;
    }
    return catalogMatchedItems.find(it => !it.excelPrice) || catalogMatchedItems[0];
  }, [catalogMatchedItems, activeManualModelId]);

  const handleSelectActiveManualModel = (item) => {
    if (!item) return;
    setActiveManualModelId(item.model.id);
    const searchCandidate = cleanModelNumber(item.model.sku || item.model.name);
    setExcel5ColSearch(searchCandidate || item.model.sku || item.model.name || '');
  };

  const handleAssignRowIn5ColTable = (row) => {
    if (!activeManualItem) return;
    const priceNum = parsePriceToFloat(row.price);
    handleAssignExcelRowToModel(activeManualItem.model.id, row);

    // Save directly to catalog as originalPrice (before discount) with salePrice = 0
    if (onApplyPriceUpdates && priceNum > 0) {
      const updated = models.map(m => {
        if (m.id === activeManualItem.model.id) {
          return {
            ...m,
            originalPrice: priceNum,
            salePrice: 0
          };
        }
        return m;
      });
      onApplyPriceUpdates(updated);
    }

    // Find next unmatched catalog model to auto-advance seamlessly
    const currentIndex = catalogMatchedItems.findIndex(it => it.model.id === activeManualItem.model.id);
    const nextUnmatched = catalogMatchedItems.slice(currentIndex + 1).find(it => !it.excelPrice && it.model.id !== activeManualItem.model.id)
      || catalogMatchedItems.find(it => !it.excelPrice && it.model.id !== activeManualItem.model.id);
    if (nextUnmatched) {
      handleSelectActiveManualModel(nextUnmatched);
    }
  };

  // Filtered Excel rows inside the Manual Search Dialog
  // User requested: "داتاکان زۆرە . با نزیکترین 15 داتا هەمیشە نیشان بدات لە سێرچەکە"
  const excelDialogSearchResults = useMemo(() => {
    if (!excelSearchTarget || stagingData.length === 0) return [];
    return rankExcelRows(stagingData, excelSearchQuery, excelSearchTargetCol, excelSearchCat, 15);
  }, [excelSearchTarget, stagingData, excelSearchQuery, excelSearchTargetCol, excelSearchCat]);

  // Filtered rows for 5-Column Excel tab (Always closest 15 rows)
  // User requested: "داتاکان زۆرە . با نزیکترین 15 داتا هەمیشە نیشان بدات لە سێرچەکە"
  const filteredExcel5ColRows = useMemo(() => {
    if (!stagingData || stagingData.length === 0) return [];
    return rankExcelRows(stagingData, excel5ColSearch, excelSearchTargetCol, 'all', 15);
  }, [stagingData, excel5ColSearch, excelSearchTargetCol]);

  const handleExport5ColExcel = () => {
    if (stagingData.length === 0) return;
    const exportData = stagingData.map((row, idx) => ({
      '#': idx + 1,
      'category_name_en': row.category || '',
      'model_name_en': row.rawModel || '',
      'name_en': row.rawDesc || '',
      'price_usd': row.price || '',
      'suggested_model': row.suggestedModel || '',
      'suggestion_reason': row.suggestionReason || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ashley_5_Columns');
    XLSX.writeFile(wb, 'ashley_outlet_5_columns.xlsx');
    setSuccessToast('فایلی ٥ کۆڵۆم بە سەرکەوتوویی دابەزێنرا.');
  };

  /**
   * Apply Price Updates to Catalog
   * As requested: "نرخی دوای داشکاندن هەمووی بکە بە سفر . ئەو نرخەی وەرمان گرتوە نرخی پێش داشکاندنە"
   * The Excel price is originalPrice (before discount) and salePrice is reset to 0.
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
          salePrice: 0
        };
      }
      return m;
    });

    onApplyPriceUpdates(updated);
    setSuccessToast(`نرخی پێش داشکاندنی "${item.model.name}" نوێکرایەوە بۆ $${item.excelPrice} و نرخی دوای داشکاندن کرا بە $0!`);
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
          salePrice: 0
        };
      }
      return m;
    });

    try {
      await onApplyPriceUpdates(updatedCatalog);
      setSuccessToast(`⚡ ${priceMap.size} مۆدێلی کەتەلۆگ بە نرخی پێش داشکاندنی ئێکسڵ ($) نوێکرانەوە و نرخی دوای داشکاندن کران بە $0!`);
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
          salePrice: 0
        };
      }
      return m;
    });

    try {
      await onApplyPriceUpdates(updatedCatalog);
      setSuccessToast(`✅ ${priceMap.size} مۆدێلی هەڵبژێردراو نوێکرانەوە (salePrice = 0)!`);
      setSelectedCatalogIds(new Set());
    } catch (err) {
      alert('هەڵە: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  // 2-Factor Price Reset States (سفرکردنەوەی نرخەکان بە ٢ فاکتەر)
  const [priceResetCandidate, setPriceResetCandidate] = useState(null);
  const [priceResetConfirmed, setPriceResetConfirmed] = useState(false);
  const [isResettingPrice, setIsResettingPrice] = useState(false);
  const [isPriceResetDropdownOpen, setIsPriceResetDropdownOpen] = useState(false);
  const priceResetDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (priceResetDropdownRef.current && !priceResetDropdownRef.current.contains(e.target)) {
        setIsPriceResetDropdownOpen(false);
      }
    };
    if (isPriceResetDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPriceResetDropdownOpen]);

  const handleExecutePriceReset = async () => {
    if (!priceResetCandidate) return;
    setIsResettingPrice(true);
    const { target } = priceResetCandidate; // 'salePrice' | 'originalPrice' | 'both'

    const updated = models.map(m => {
      if (target === 'salePrice') {
        return { ...m, salePrice: 0 };
      }
      if (target === 'originalPrice') {
        return { ...m, originalPrice: 0 };
      }
      return { ...m, salePrice: 0, originalPrice: 0 };
    });

    try {
      if (onApplyPriceUpdates) {
        await onApplyPriceUpdates(updated);
      }
      await catalogService.resetPrices(target);
      setSuccessToast(`سەرکەوتووانە ${priceResetCandidate.title} جێبەجێ کرا!`);
      setPriceResetCandidate(null);
      setPriceResetConfirmed(false);
    } catch (err) {
      alert('هەڵە لە سفرکردنەوەی نرخەکان: ' + err.message);
    } finally {
      setIsResettingPrice(false);
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
      setActiveTab('auto');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-6xl max-h-[94vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Toast Notification Banner */}
        {successToast && (
          <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md transition-all">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setSuccessToast('')}
              className="p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                  هاوتاکردنی نرخ لەگەڵ ئێکسڵ (Excel Price Matcher)
                </h3>
                <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  USD ($)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                دۆزینەوە و دیاریکردنی نرخی مۆدێلەکان لە فایلی ئێکسڵ (price_usd)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 2-Factor Price Reset Dropdown Button (سفرکردنەوەی نرخەکان بە ٢ فاکتەر) */}
            <div className="relative" ref={priceResetDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPriceResetDropdownOpen(!isPriceResetDropdownOpen)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="سفرکردنەوەی نرخەکان بە ٢ فاکتەر (2-Factor Price Reset)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">سفرکردنەوەی نرخ (2F)</span>
                <ChevronDown className={`w-3 h-3 text-rose-500 transition-transform ${isPriceResetDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isPriceResetDropdownOpen && (
                <div className="absolute top-full end-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn text-start select-none">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400">
                    فەرمانەکانی سفرکردنەوە (٢ فاکتەر)
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPriceResetDropdownOpen(false);
                      setPriceResetCandidate({
                        target: 'salePrice',
                        title: 'سفرکردنەوەی نرخی دوای داشکاندن',
                        targetLabel: 'نرخی دوای داشکاندن (Sale Price)',
                        itemCount: models.length,
                        description: 'هەموو نرخەکانی دوای داشکاندن دەکرێن بە $0. نرخی پێش داشکاندن وەک خۆی دەمێنێتەوە.'
                      });
                      setPriceResetConfirmed(false);
                    }}
                    className="w-full px-3 py-2 text-start text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="flex-1">سفرکردنەوەی نرخی دوای داشکاندن</span>
                    <span className="text-[10px] text-slate-400 font-mono">$0</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPriceResetDropdownOpen(false);
                      setPriceResetCandidate({
                        target: 'originalPrice',
                        title: 'سفرکردنەوەی نرخی پێش داشکاندن',
                        targetLabel: 'نرخی پێش داشکاندن (Original Price)',
                        itemCount: models.length,
                        description: 'هەموو نرخەکانی پێش داشکاندن دەکرێن بە $0. نرخی دوای داشکاندن وەک خۆی دەمێنێتەوە.'
                      });
                      setPriceResetConfirmed(false);
                    }}
                    className="w-full px-3 py-2 text-start text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="flex-1">سفرکردنەوەی نرخی پێش داشکاندن</span>
                    <span className="text-[10px] text-slate-400 font-mono">$0</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsPriceResetDropdownOpen(false);
                      setPriceResetCandidate({
                        target: 'both',
                        title: 'سفرکردنەوەی گشت نرخەکان (هەردوو نرخەکە)',
                        targetLabel: 'نرخی پێش و دوای داشکاندن',
                        itemCount: models.length,
                        description: 'هەردوو نرخی پێش داشکاندن و دوای داشکاندن بۆ گشت مۆدێلەکان سفر دەکرێنەوە.'
                      });
                      setPriceResetConfirmed(false);
                    }}
                    className="w-full px-3 py-2 text-start text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1">سفرکردنەوەی هەردوو نرخەکە</span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-mono font-black">2F</span>
                  </button>
                </div>
              )}
            </div>

            {/* Simple Excel File Upload / Change Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
              title="بارکردنی فایلی نوێی ئێکسڵ"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {rawExcelRows.length > 0 ? `فایل: (${rawExcelRows.length - 1} کاڵا)` : 'بارکردنی ئێکسڵ'}
              </span>
            </button>

            {rawExcelRows.length === 0 && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200 flex items-center gap-1"
                title="بارکردنی نموونەی ئاشڵی"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>نموونە</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                if (e.target.files.length) handleFileUpload(e.target.files[0]);
              }}
              className="hidden"
            />

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Two Main Sections Toggle (بەشی ئۆتۆماتیک و بەشی دەستی و تەواو) */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('auto')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'auto'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>بەشی ئۆتۆماتیک (Automatic)</span>
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
              activeTab === 'auto' ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-600'
            }`}>
              {catalogStats.matchedCount} ئامادەیە
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              if (activeManualItem) {
                handleSelectActiveManualModel(activeManualItem);
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>سێرچی دەستی لە خشتەی ٥ کۆڵۆم</span>
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
              activeTab === 'manual' ? 'bg-slate-800 text-blue-300' : 'bg-slate-100 text-slate-600'
            }`}>
              {catalogStats.unmatchedCount} بێ نرخ
            </span>
          </button>
        </div>

        {/* EMPTY STATE IF NO EXCEL FILE LOADED */}
        {stagingData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
              <FileSpreadsheet className="w-7 h-7 text-slate-500" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              هێشتا فایلی ئێکسڵ بارنەکراوە
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              تکایە فایلی ئێکسڵی نرخەکان دابنێ تا سیستەم بە ئۆتۆماتیک یان بە دەست نرخەکان هاوتا بکات.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>بارکردنی فایلی ئێکسڵ</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>نموونەی ئامادەکراو</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* =========================================================================
                SECTION 1: AUTOMATIC MATCHING (بەشی ئۆتۆماتیک)
                ========================================================================= */}
            {activeTab === 'auto' && (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
                
                {/* Column Mapping Toolbar (دیاریکردنی ستوونەکان بە سادەیی) */}
                {rawHeaders.length > 0 && (
                  <div className="bg-white border-b border-slate-200 px-6 py-2.5">
                    <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                      <span>دیاریکردنی ستوونەکانی فایلی ئێکسڵ بۆ دەرهێنانی نرخ:</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Model Col */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500 font-semibold">مۆدێل (model_name_en):</span>
                        <select
                          value={columnMapping.modelCol}
                          onChange={(e) => handleUpdateColumnMapping('modelCol', e.target.value)}
                          className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer truncate"
                        >
                          <option value="-1">-- دیاری نەکراوە --</option>
                          {rawHeaders.map((h, idx) => (
                            <option key={idx} value={idx}>{idx + 1}. {h || `ستوونی ${idx + 1}`}</option>
                          ))}
                        </select>
                      </div>

                      {/* Desc Col */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500 font-semibold">وەسف (name_en):</span>
                        <select
                          value={columnMapping.descCol}
                          onChange={(e) => handleUpdateColumnMapping('descCol', e.target.value)}
                          className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer truncate"
                        >
                          <option value="-1">-- دیاری نەکراوە --</option>
                          {rawHeaders.map((h, idx) => (
                            <option key={idx} value={idx}>{idx + 1}. {h || `ستوونی ${idx + 1}`}</option>
                          ))}
                        </select>
                      </div>

                      {/* Price Col */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500 font-semibold">نرخ (price_usd):</span>
                        <select
                          value={columnMapping.priceCol}
                          onChange={(e) => handleUpdateColumnMapping('priceCol', e.target.value)}
                          className="bg-transparent font-bold text-emerald-700 text-xs focus:outline-none cursor-pointer truncate"
                        >
                          <option value="-1">-- دیاری نەکراوە --</option>
                          {rawHeaders.map((h, idx) => (
                            <option key={idx} value={idx}>{idx + 1}. {h || `ستوونی ${idx + 1}`}</option>
                          ))}
                        </select>
                      </div>

                      {/* Cat Col */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500 font-semibold">کەتەگۆری (category_name_en):</span>
                        <select
                          value={columnMapping.catCol}
                          onChange={(e) => handleUpdateColumnMapping('catCol', e.target.value)}
                          className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer truncate"
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

                {/* Sub-bar (Search & Quick Filter) */}
                <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder="گەڕان لە مۆدێلەکان..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-slate-400 font-medium"
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

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCatalogFilterMode('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        catalogFilterMode === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      هەمووی ({catalogStats.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogFilterMode('matched')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        catalogFilterMode === 'matched'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      دۆزراوە لە ئێکسڵ ({catalogStats.matchedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogFilterMode('unmatched')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        catalogFilterMode === 'unmatched'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      بەتاڵ ({catalogStats.unmatchedCount})
                    </button>
                  </div>
                </div>

                {/* Automatic Table */}
                <div className="flex-1 overflow-auto bg-white select-text">
                  <table className="w-full text-xs text-slate-800 border-collapse border border-slate-200">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 text-[11px] font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 w-8 text-center border-e border-slate-200 font-mono">#</th>
                        <th className="p-2 w-12 text-center border-e border-slate-200">وێنە</th>
                        <th className="p-2 min-w-[170px] text-start border-e border-slate-200">ژمارەی مۆدێل (model_name_en)</th>
                        <th className="p-2 w-28 text-center border-e border-slate-200">کەتەگۆری</th>
                        <th className="p-2 w-24 text-center border-e border-slate-200">نرخی ئێستا ($)</th>
                        <th className="p-2 min-w-[200px] text-start border-e border-slate-200">نرخ لە ئێکسڵ (price_usd $)</th>
                        <th className="p-2 w-24 text-center">کردار</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredCatalogItems.map((item, idx) => {
                        const isMatched = item.excelPrice !== null && item.excelPrice > 0;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2 text-center border-e border-slate-200 font-mono text-[11px] text-slate-500">
                              {idx + 1}
                            </td>
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
                            <td className="p-2 border-e border-slate-200">
                              <div className="font-bold text-slate-900 text-xs font-mono" dir="ltr">
                                {item.model.sku || item.model.name}
                              </div>
                              {item.model.name && item.model.sku && item.model.name !== item.model.sku && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {item.model.name}
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-center border-e border-slate-200 text-slate-600 font-medium">
                              {item.categoryName || '-'}
                            </td>
                            <td className="p-2 text-center border-e border-slate-200 font-mono text-xs text-slate-600 font-bold">
                              ${item.currentPrice || 0}
                            </td>
                            <td className="p-2 border-e border-slate-200">
                              {isMatched ? (
                                <div>
                                  <div className="font-mono font-black text-emerald-700 text-sm">
                                    ${item.excelPrice}
                                  </div>
                                  {item.matchedExcelRow && (
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 space-y-0.5" dir="ltr">
                                      <div>
                                        model_name_en: <span className="font-bold text-slate-700">{item.matchedExcelRow.rawModel || item.matchedExcelRow.predictedModel || '-'}</span> | name_en: <span className="text-slate-600">{item.matchedExcelRow.rawDesc || '-'}</span>
                                      </div>
                                      {item.matchedExcelRow.suggestedModel && item.matchedExcelRow.suggestedModel !== '-' && (
                                        <div className="text-amber-800 font-sans text-[10px] flex items-center gap-1" dir="rtl">
                                          <span className="font-bold">💡 پێشنیاری مۆدێل:</span>
                                          <span className="font-mono font-bold bg-amber-100 px-1 rounded text-amber-950" dir="ltr">{item.matchedExcelRow.suggestedModel}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-slate-400 italic text-[11px]">— بەتاڵ (لە ئێکسڵ نەدۆزراوە) —</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('manual');
                                      handleOpenExcelSearch(item);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-[10.5px] font-bold block mt-0.5 cursor-pointer"
                                  >
                                    سێرچی بکە بە دەست ➔
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {isMatched ? (
                                <button
                                  type="button"
                                  onClick={() => handleApplySingleCatalogPrice(item)}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-[10.5px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                  جێبەجێکردن
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">--</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Actions Bar */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-bold text-slate-600">
                    {catalogStats.matchedCount} لە مۆدێلەکانمان نرخەکەیان لە ئێکسڵ ئامادەیە.
                  </span>

                  <button
                    type="button"
                    onClick={handleApplyAllCatalogPrices}
                    disabled={isApplying || catalogStats.matchedCount === 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
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
            )}

            {/* =========================================================================
                SECTION 2: UNIFIED MANUAL SEARCH & 5-COLUMN EXCEL WORKSPACE
                "سێرچی دەستی و 5 کۆڵۆمەکە هەردووکی بکە بە یەک با یەکسەر لەوێ کۆڵۆمەکە بتوانین نرخەکە وەر بگریین"
                "با نزیکترین 15 داتا هەمیشە نیشان بدات لە سێرچەکە"
                ========================================================================= */}
            {activeTab === 'manual' && (
              <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50/30 overflow-hidden">
                
                {/* LEFT PANEL: Catalog Models Selector List */}
                <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-e border-slate-200 flex flex-col min-h-0 shrink-0">
                  
                  {/* Search in Catalog Models */}
                  <div className="p-3 border-b border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>مۆدێلەکانی کەتەلۆگ</span>
                        <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                          {catalogStats.total}
                        </span>
                      </span>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                        {catalogStats.unmatchedCount} بێ نرخ
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={manualSearch}
                        onChange={(e) => setManualSearch(e.target.value)}
                        placeholder="فلتەری مۆدێلەکان (کۆد یان ناو)..."
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-medium"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      {manualSearch && (
                        <button
                          type="button"
                          onClick={() => setManualSearch('')}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Quick filter pills */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setManualFilterMode('all')}
                        className={`flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer ${
                          manualFilterMode === 'all'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        هەمووی ({catalogStats.total})
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualFilterMode('unmatched')}
                        className={`flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer ${
                          manualFilterMode === 'unmatched'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        بێ نرخ ({catalogStats.unmatchedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualFilterMode('manual')}
                        className={`flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer ${
                          manualFilterMode === 'manual'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        دانراو ({catalogStats.matchedCount})
                      </button>
                    </div>
                  </div>

                  {/* List of Models */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {filteredManualItems.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        هیچ مۆدێلێک نەدۆزرایەوە
                      </div>
                    ) : (
                      filteredManualItems.map((item) => {
                        const isSelected = activeManualItem?.model.id === item.model.id;
                        const hasPrice = item.excelPrice !== null && item.excelPrice > 0;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectActiveManualModel(item)}
                            className={`p-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {item.model.image ? (
                                <img
                                  src={item.model.image}
                                  alt={item.model.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs truncate font-mono" dir="ltr">
                                  {item.model.sku || item.model.name}
                                </div>
                                {item.model.name && item.model.sku && item.model.name !== item.model.sku && (
                                  <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {item.model.name}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-end">
                              {hasPrice ? (
                                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                                  isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}>
                                  ${item.excelPrice}
                                </span>
                              ) : (
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  بێ نرخ
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>

                {/* RIGHT PANEL: 5-COLUMN EXCEL SHEET WITH DIRECT PRICE PICK ACTION */}
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  
                  {/* Active Selected Model Header Banner */}
                  {activeManualItem && (
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-500">دانانی نرخ بۆ مۆدێلی:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs text-xs" dir="ltr">
                            {activeManualItem.model.sku || activeManualItem.model.name}
                          </span>
                          {activeManualItem.model.name && activeManualItem.model.sku && activeManualItem.model.name !== activeManualItem.model.sku && (
                            <span className="text-slate-600 font-semibold text-xs">
                              ({activeManualItem.model.name})
                            </span>
                          )}
                          {activeManualItem.categoryName && (
                            <span className="text-slate-500 text-[11px]">
                              | کەتەگۆری: {activeManualItem.categoryName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeManualItem.excelPrice ? (
                          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg text-emerald-800 font-bold text-xs">
                            <span>نرخی دانراو لە ئێکسڵ:</span>
                            <span className="font-mono text-sm font-black">${activeManualItem.excelPrice}</span>
                            <button
                              type="button"
                              onClick={() => handleUnlinkCatalogModel(activeManualItem.model.id)}
                              className="text-slate-400 hover:text-rose-600 font-bold mr-1 cursor-pointer"
                              title="سڕینەوەی نرخ"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                            ⚠️ بێ نرخە — کلیک لە «وەرگرتن» بکە لە ڕیزی گونجاوی خوارەوە
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5-Column Search & Filter Toolbar */}
                  <div className="p-3 border-b border-slate-200 bg-white space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={excel5ColSearch}
                          onChange={(e) => setExcel5ColSearch(e.target.value)}
                          placeholder="سێرچ لە فایلی ئێکسڵ بە کۆد (وەک 1200067)، ناوی مۆدێل، وەسف، نرخ..."
                          className="w-full pl-8 pr-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-slate-500 transition-all font-mono"
                          dir="ltr"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                        {excel5ColSearch && (
                          <button
                            type="button"
                            onClick={() => setExcel5ColSearch('')}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleExport5ColExcel}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        title="داگرتنی فایلی ئێکسڵ بە ٥ کۆڵۆم"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden sm:inline">داگرتنی ٥ کۆڵۆم (Excel)</span>
                      </button>
                    </div>

                    {/* Filter Pills for 5-Column Table */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10.5px] font-bold text-slate-500 ml-1">گەڕان لە:</span>
                        
                        <button
                          type="button"
                          onClick={() => setExcelSearchTargetCol('all')}
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            excelSearchTargetCol === 'all'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          🌐 هەمووی
                        </button>

                        <button
                          type="button"
                          onClick={() => setExcelSearchTargetCol('model')}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            excelSearchTargetCol === 'model'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          🏷️ مۆدێل
                        </button>

                        <button
                          type="button"
                          onClick={() => setExcelSearchTargetCol('desc')}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            excelSearchTargetCol === 'desc'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          📝 وەسف (name_en)
                        </button>

                        <button
                          type="button"
                          onClick={() => setExcelSearchTargetCol('suggested')}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            excelSearchTargetCol === 'suggested'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          💡 پێشنیاری مۆدێل
                        </button>

                        <button
                          type="button"
                          onClick={() => setExcelSearchTargetCol('cat')}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            excelSearchTargetCol === 'cat'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          📁 کەتەگۆری
                        </button>

                        <button
                          type="button"
                          onClick={() => setExcelSearchTargetCol('price')}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            excelSearchTargetCol === 'price'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          💲 نرخ
                        </button>
                      </div>

                      <div className="text-[11px] font-bold text-slate-500">
                        پیشاندانی <strong className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">نزیکترین {filteredExcel5ColRows.length} داتا</strong>
                      </div>
                    </div>
                  </div>

                  {/* 5-COLUMN TABLE WITH DIRECT PRICE PICK ACTION */}
                  <div className="flex-1 overflow-auto bg-white select-text">
                    <table className="w-full text-xs text-slate-800 border-collapse border border-slate-200">
                      <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 text-[11px] font-bold border-b border-slate-300 font-mono">
                        <tr>
                          <th className="p-2 w-8 text-center border-e border-slate-200">#</th>
                          <th className="p-2 w-28 text-center border-e border-slate-200">1. category_name_en</th>
                          <th className="p-2 w-32 text-center border-e border-slate-200">2. model_name_en</th>
                          <th className="p-2 min-w-[280px] text-start border-e border-slate-200">3. name_en (وەسفی تەواو)</th>
                          <th className="p-2 w-24 text-center border-e border-slate-200">4. price_usd ($)</th>
                          <th className="p-2 min-w-[220px] text-start border-e border-amber-200 bg-amber-50/70 text-amber-900">
                            5. 💡 پێشنیاری پرۆگرام
                          </th>
                          <th className="p-2 w-36 text-center font-sans bg-slate-200/60">
                            کردار: وەرگرتنی نرخ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredExcel5ColRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                              هیچ دێڕێک لە فایلی ئێکسڵ نەدۆزرایەوە بۆ پیتەکانی "{excel5ColSearch}". دەتوانیت پیتەکانی ناو سێرچەکە دەستکاری بکەیت.
                            </td>
                          </tr>
                        ) : (
                          filteredExcel5ColRows.map((row, idx) => {
                            const isCurrentAssigned = activeManualItem?.matchedExcelRow?.id === row.id || (activeManualItem?.excelPrice === row.price && activeManualItem?.matchedExcelRow?.rawDesc === row.rawDesc);
                            return (
                              <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${isCurrentAssigned ? 'bg-emerald-50/40' : ''}`}>
                                <td className="p-2 text-center border-e border-slate-200 font-mono text-[11px] text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="p-2 text-center border-e border-slate-200 text-slate-700 font-medium">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-sans">
                                    {row.category || '-'}
                                  </span>
                                </td>
                                <td className="p-2 text-center border-e border-slate-200 font-bold text-slate-900 font-mono">
                                  {row.rawModel || '-'}
                                </td>
                                <td className="p-2 border-e border-slate-200 text-xs text-slate-800 font-semibold leading-relaxed break-words font-mono" dir="ltr">
                                  {row.rawDesc || '-'}
                                </td>
                                <td className="p-2 text-center border-e border-slate-200 font-black text-emerald-700 text-xs font-mono">
                                  ${row.price || 0}
                                </td>
                                <td className="p-2 bg-amber-50/40 border-e border-amber-200">
                                  <div className="flex flex-col gap-0.5" dir="rtl">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-black text-xs text-amber-950 bg-white px-2 py-0.5 rounded border border-amber-300 shadow-2xs" dir="ltr">
                                        {row.suggestedModel || '-'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-amber-800 leading-tight">
                                      {row.suggestionReason || 'بەپێی کۆڵۆمەکانی کەتەگۆری و مۆدێل و name_en'}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2 text-center bg-slate-50/30">
                                  {isCurrentAssigned ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>دانراوە</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleUnlinkCatalogModel(activeManualItem.model.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                        title="سڕینەوەی ئەم نرخە"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAssignRowIn5ColTable(row)}
                                      className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1 mx-auto whitespace-nowrap"
                                    >
                                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>وەرگرتن (${row.price})</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <span className="text-xs font-bold text-slate-600">
                      {catalogStats.matchedCount} لە {catalogStats.total} مۆدێل ئێستا نرخەکەیان دیاریکراوە.
                    </span>

                    <button
                      type="button"
                      onClick={handleApplyAllCatalogPrices}
                      disabled={isApplying || catalogStats.matchedCount === 0}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      {isApplying ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      <span>⚡ نوێکردنەوەی هەموو نرخەکان لە سیستەمدا ({catalogStats.matchedCount} مۆدێل بە $)</span>
                    </button>
                  </div>

                </div>

              </div>
            )}
          </>
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
              <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
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
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Target Model Info Banner */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-800">
                  {excelSearchTarget.model.sku && (
                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200" dir="ltr">
                      کۆد: {excelSearchTarget.model.sku}
                    </span>
                  )}
                  <span className="font-bold text-slate-900">
                    {excelSearchTarget.model.name}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600">
                    بەش: {excelSearchTarget.categoryName || 'دیاری نەکراوە'}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono text-slate-600 font-bold">
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
                    className="w-full pl-9 pr-9 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 focus:border-slate-500 focus:bg-white rounded-xl focus:outline-none transition-all shadow-2xs"
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
                      <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                      <span>گەڕان لە ستوونی:</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setExcelSearchTargetCol('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        excelSearchTargetCol === 'all'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      🌐 هەر ٤ ستوونەکە (All 4 Columns)
                    </button>

                    <button
                      type="button"
                      onClick={() => setExcelSearchTargetCol('cat')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        excelSearchTargetCol === 'cat'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>📁 کەتەگۆری (category_name_en)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExcelSearchTargetCol('model')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        excelSearchTargetCol === 'model'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>🏷️ مۆدێل (model_name_en)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExcelSearchTargetCol('desc')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        excelSearchTargetCol === 'desc'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>📝 وەسف (name_en)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExcelSearchTargetCol('price')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        excelSearchTargetCol === 'price'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>💲 نرخ (price_usd)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExcelSearchTargetCol('suggested')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        excelSearchTargetCol === 'suggested'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>💡 پێشنیاری مۆدێل</span>
                    </button>
                  </div>

                  {/* Direct Dropdown for Any Column & View Mode Toggle */}
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle: Cards vs 5-Column Table */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setExcelDialogViewMode('cards')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          excelDialogViewMode === 'cards'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="پیشاندانی کارتی"
                      >
                        <LayoutGrid className="w-3 h-3" />
                        <span>کارتەکان</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExcelDialogViewMode('table')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          excelDialogViewMode === 'table'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="پیشاندانی خشتەی ٥ کۆڵۆم"
                      >
                        <TableIcon className="w-3 h-3" />
                        <span>خشتەی ٥ کۆڵۆم</span>
                      </button>
                    </div>

                    {rawHeaders.length > 0 && (
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 font-medium">یان:</span>
                        <select
                          value={['all', 'desc', 'model', 'price', 'cat', 'suggested'].includes(excelSearchTargetCol) ? '' : excelSearchTargetCol}
                          onChange={(e) => {
                            if (e.target.value) setExcelSearchTargetCol(e.target.value);
                          }}
                          className="text-[11px] font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer max-w-[110px] truncate"
                        >
                          <option value="">-- ستوون --</option>
                          {rawHeaders.map((h, idx) => (
                            <option key={idx} value={String(idx)}>
                              {idx + 1}. {h || `ستوونی ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Result Count Banner */}
                <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                  <span>
                    ئەنجامەکان: <strong className="font-mono text-slate-800">{excelDialogSearchResults.length}</strong> دێڕ دۆزرایەوە
                  </span>
                  {excelSearchTargetCol !== 'all' && (
                    <span className="text-slate-700 font-bold text-[10.5px]">
                      فلتەرکراو بەپێی ستوونی هەڵبژێردراو
                    </span>
                  )}
                </div>
              </div>

              {/* Results from Excel Master Sheet */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 min-h-[260px] max-h-[420px]">
                {excelDialogSearchResults.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <div className="text-2xl mb-2">🔍</div>
                    <p className="font-bold text-slate-600">هیچ دێڕێک لە فایلی ئێکسڵ نەدۆزرایەوە</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      هیچ کاڵایەک بە پیتەکانی "{excelSearchQuery}" لە فایلی ئێکسڵدا نییە.
                    </p>
                  </div>
                ) : excelDialogViewMode === 'table' ? (
                  /* 5-COLUMN TABLE VIEW INSIDE SEARCH MODAL */
                  <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-slate-800 border-collapse">
                      <thead className="bg-slate-100 text-slate-800 text-[10.5px] font-bold border-b border-slate-300 font-mono">
                        <tr>
                          <th className="p-2 text-center border-e border-slate-200 w-8">#</th>
                          <th className="p-2 text-center border-e border-slate-200">category_name_en</th>
                          <th className="p-2 text-center border-e border-slate-200">model_name_en</th>
                          <th className="p-2 text-start border-e border-slate-200 min-w-[200px]">name_en (تەواو)</th>
                          <th className="p-2 text-center border-e border-slate-200 w-20">price_usd</th>
                          <th className="p-2 text-start border-e border-slate-200 min-w-[180px] bg-amber-50/70 text-amber-900">💡 پێشنیاری مۆدێل</th>
                          <th className="p-2 text-center w-24">کردار</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {excelDialogSearchResults.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2 text-center border-e border-slate-200 text-slate-400 text-[10px]">
                              {idx + 1}
                            </td>
                            <td className="p-2 text-center border-e border-slate-200 font-sans text-[11px] text-slate-700">
                              {row.category || '-'}
                            </td>
                            <td className="p-2 text-center border-e border-slate-200 font-bold text-slate-900">
                              {row.rawModel || '-'}
                            </td>
                            <td className="p-2 border-e border-slate-200 text-slate-800 font-medium break-words font-mono text-[11px]" dir="ltr">
                              {row.rawDesc || '-'}
                            </td>
                            <td className="p-2 text-center border-e border-slate-200 font-black text-emerald-700">
                              ${row.price || 0}
                            </td>
                            <td className="p-2 bg-amber-50/40 border-e border-amber-200 font-sans">
                              <span className="font-mono font-black text-amber-950 bg-white px-1.5 py-0.5 rounded border border-amber-300 text-xs" dir="ltr">
                                {row.suggestedModel || '-'}
                              </span>
                            </td>
                            <td className="p-2 text-center font-sans">
                              <button
                                type="button"
                                onClick={() => handleAssignExcelRowToModel(excelSearchTarget.model.id, row)}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1 mx-auto"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>وەرگرتن</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* 5-FIELD CARD VIEW INSIDE SEARCH MODAL */
                  <div className="grid grid-cols-1 gap-2">
                    {excelDialogSearchResults.map((row) => (
                      <div
                        key={row.id}
                        className="p-3 bg-white border border-slate-200 hover:border-slate-400 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:shadow-xs transition-all"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5" dir="ltr">
                          
                          {/* Row 1: category_name_en & model_name_en */}
                          <div className="flex flex-wrap items-center gap-2">
                            {row.category && (
                              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                category_name_en: <strong className="text-slate-900">{row.category}</strong>
                              </span>
                            )}

                            <span className="text-[11px] font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              model_name_en: <strong className="text-slate-900">{row.rawModel || row.predictedModel || '-'}</strong>
                            </span>

                            {row.extractedCode && row.extractedCode !== (row.rawModel || row.predictedModel) && (
                              <span className="font-mono text-[10px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                SKU: {row.extractedCode}
                              </span>
                            )}
                          </div>

                          {/* Row 2: name_en (FULL description from Excel, never truncated!) */}
                          <div className="flex items-start gap-1.5 text-xs text-slate-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0 mt-0.5">
                              name_en:
                            </span>
                            <span className="font-semibold text-slate-800 leading-snug break-words">
                              {row.rawDesc || row.predictedModel}
                            </span>
                          </div>

                          {/* Row 3: Suggested Model Code by AI */}
                          {row.suggestedModel && row.suggestedModel !== '-' && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50/80 border border-amber-200 px-2 py-1 rounded-lg" dir="rtl">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="text-[10.5px] font-bold">
                                پێشنیاری پرۆگرام بۆ مۆدێل:
                              </span>
                              <span className="font-mono font-black text-amber-950 bg-white px-2 py-0.5 rounded border border-amber-300" dir="ltr">
                                {row.suggestedModel}
                              </span>
                              {row.suggestionReason && (
                                <span className="text-[10px] text-amber-700 hidden sm:inline mr-1">
                                  ({row.suggestionReason})
                                </span>
                              )}
                            </div>
                          )}

                        </div>

                        {/* Price & Pick Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-start sm:text-end">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              price_usd
                            </div>
                            <div className="font-mono font-black text-emerald-700 text-base leading-none mt-0.5">
                              ${row.price || 0}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAssignExcelRowToModel(excelSearchTarget.model.id, row)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
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

        {/* =========================================================================
            2-FACTOR PRICE RESET MODAL (سفرکردنەوەی نرخەکان بە ٢ فاکتەر)
            ========================================================================= */}
        {priceResetCandidate && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 text-center animate-scaleUp">
              
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <RotateCcw className="w-7 h-7" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-[11px] font-black mb-2.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>پشتڕاستکردنەوەی ٢ فاکتەر (2-Factor Confirmation)</span>
              </div>

              <h3 className="font-black text-base text-slate-900 leading-snug">
                {priceResetCandidate.title}
              </h3>

              <div className="mt-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-start space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span>مەودای جێبەجێکردن:</span>
                  <span className="text-slate-900 font-black">{priceResetCandidate.itemCount} مۆدێلی ناو کەتەلۆگ</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span>کۆڵۆمی ئامانج:</span>
                  <span className="text-red-600 font-black">{priceResetCandidate.targetLabel}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span>نرخی نوێ دەبێتە:</span>
                  <span className="text-emerald-700 font-black font-mono">$0 (سفر دۆلار)</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/80 leading-relaxed">
                  {priceResetCandidate.description}
                </p>
              </div>

              <p className="text-[11px] text-rose-600 font-bold mt-3">
                ⚠️ ئەم هەنگاوە (2F) بۆ پاراستنی نرخەکانە و پاشگەزبوونەوەی نییە!
              </p>

              {/* 2nd Factor Checkbox */}
              <label className="mt-3.5 p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center gap-2.5 cursor-pointer text-start select-none">
                <input
                  type="checkbox"
                  checked={priceResetConfirmed}
                  onChange={(e) => setPriceResetConfirmed(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-rose-900 leading-tight">
                  دڵنیام لە سفرکردنەوەی ئەم نرخە بۆ تەواوی مۆدێلەکان
                </span>
              </label>

              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPriceResetCandidate(null);
                    setPriceResetConfirmed(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="button"
                  disabled={!priceResetConfirmed || isResettingPrice}
                  onClick={handleExecutePriceReset}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                >
                  {isResettingPrice ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>سفر بکەرەوە (2F)</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
