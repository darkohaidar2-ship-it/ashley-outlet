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
  DollarSign
} from 'lucide-react';
import {
  extractSmartModel,
  matchStagingItemWithCatalog,
  sampleDataRows
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
  const [stagingData, setStagingData] = useState(() => {
    try {
      const saved = localStorage.getItem('ashley_price_matcher_staging');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [rawHeaders, setRawHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    modelCol: -1,
    descCol: -1,
    priceCol: -1,
    codeCol: -1,
    noteCol: -1
  });

  // Search, filter, pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'matched' | 'unmatched' | 'diff'
  const [visibleLimit, setVisibleLimit] = useState(50);
  const [isApplying, setIsApplying] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-save staging data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ashley_price_matcher_staging', JSON.stringify(stagingData));
    } catch (e) {}
  }, [stagingData]);

  // Toast auto-hide
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // If no data initially, load sample or default
  useEffect(() => {
    if (isOpen && stagingData.length === 0) {
      setActiveTab('upload');
    }
  }, [isOpen]);

  // Process raw rows (from Excel or Sample)
  const processRawData = (rows) => {
    if (!rows || rows.length < 2) return;

    const headers = rows[0].map(h => String(h || '').trim());
    setRawHeaders(headers);

    // Auto-detect column indexes
    let mIdx = -1, dIdx = -1, pIdx = -1, cIdx = -1, nIdx = -1;

    headers.forEach((h, idx) => {
      const lower = h.toLowerCase().trim();
      if (lower === 'model_name_en' || lower === 'model_name' || lower === 'model' || lower === 'مۆدێل') {
        if (mIdx === -1) mIdx = idx;
      } else if (lower === 'name_en' || lower.includes('description') || lower.includes('desc') || lower.includes('وەسف') || lower === 'name') {
        if (dIdx === -1) dIdx = idx;
      } else if (lower.includes('نرخ') || lower.includes('price') || lower.includes('سعر')) {
        if (pIdx === -1) pIdx = idx;
      } else if (lower.includes('بارکۆد') || lower.includes('barcode') || lower.includes('code') || lower.includes('کۆد') || lower.includes('sku')) {
        if (cIdx === -1) cIdx = idx;
      } else if (lower.includes('تێبینی') || lower.includes('note')) {
        if (nIdx === -1) nIdx = idx;
      }
    });

    if (mIdx === -1 && dIdx >= 0) mIdx = dIdx;
    if (mIdx === -1) mIdx = 0;
    if (pIdx === -1) pIdx = headers.length > 1 ? 1 : 0;

    setColumnMapping({
      modelCol: mIdx,
      descCol: dIdx,
      priceCol: pIdx,
      codeCol: cIdx,
      noteCol: nIdx
    });

    const parsedItems = [];
    const dataRows = rows.slice(1);

    dataRows.forEach((r, idx) => {
      const rawModel = (mIdx >= 0 && r[mIdx] !== undefined) ? String(r[mIdx]).trim() : '';
      const rawDesc = (dIdx >= 0 && r[dIdx] !== undefined) ? String(r[dIdx]).trim() : (mIdx >= 0 && r[mIdx] !== undefined ? String(r[mIdx]).trim() : '');
      const rawPrice = (pIdx >= 0 && r[pIdx] !== undefined && r[pIdx] !== null) ? String(r[pIdx]).trim() : '';
      const rawCode = (cIdx >= 0 && r[cIdx] !== undefined && r[cIdx] !== null) ? String(r[cIdx]).trim() : '';
      const rawNote = (nIdx >= 0 && r[nIdx] !== undefined && r[nIdx] !== null) ? String(r[nIdx]).trim() : '';

      if (!rawDesc && !rawModel && !rawPrice && !rawCode) return;

      const extracted = extractSmartModel(rawDesc, rawModel, rawCode, rawPrice);

      parsedItems.push({
        id: 'stg_' + idx + '_' + Math.random().toString(36).substring(2, 7),
        rawCode,
        extractedCode: extracted.code,
        rawDesc: rawDesc || rawModel,
        predictedModel: extracted.model,
        price: extracted.price || rawPrice,
        rawNote,
        selected: false
      });
    });

    setStagingData(parsedItems);
    setActiveTab('staging');
    setVisibleLimit(50);
    setSuccessToast(`${parsedItems.length} کاڵا بە سەرکەوتوویی لە فایلی ئێکسڵ دەرهێنران!`);
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
      const match = matchStagingItemWithCatalog(item, models);
      return {
        ...item,
        ...match
      };
    });
  }, [stagingData, models]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = matchedStagingItems.length;
    const matched = matchedStagingItems.filter(i => i.matchedModel !== null);
    const unmatched = matchedStagingItems.filter(i => i.matchedModel === null);
    const diffPrices = matched.filter(i => !i.isPriceEqual && i.priceDifference !== null);

    return {
      total,
      matchedCount: matched.length,
      unmatchedCount: unmatched.length,
      diffCount: diffPrices.length,
      matchPercentage: total > 0 ? Math.round((matched.length / total) * 100) : 0
    };
  }, [matchedStagingItems]);

  // Filtered & Searched items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return matchedStagingItems.filter((item) => {
      // 1. Filter mode
      if (filterMode === 'matched' && !item.matchedModel) return false;
      if (filterMode === 'unmatched' && item.matchedModel) return false;
      if (filterMode === 'diff' && (item.isPriceEqual || !item.matchedModel)) return false;

      // 2. Real-time Multi-field search
      if (!q) return true;
      const code = (item.extractedCode || item.rawCode || '').toLowerCase();
      const model = (item.predictedModel || '').toLowerCase();
      const desc = (item.rawDesc || '').toLowerCase();
      const price = String(item.price || '').toLowerCase();
      const matchedName = (item.matchedModel?.name || '').toLowerCase();

      return (
        code.includes(q) ||
        model.includes(q) ||
        desc.includes(q) ||
        price.includes(q) ||
        matchedName.includes(q)
      );
    });
  }, [matchedStagingItems, filterMode, searchQuery]);

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
    const cleanPrice = parseFloat(item.price);
    if (isNaN(cleanPrice)) {
      alert('نرخەکە نادروستە');
      return;
    }

    const updated = models.map(m => {
      if (m.id === item.matchedModel.id) {
        return {
          ...m,
          salePrice: cleanPrice
        };
      }
      return m;
    });

    onApplyPriceUpdates(updated);
    setSuccessToast(`نرخی مۆدێلی "${item.matchedModel.name}" نوێکرایەوە بۆ $${cleanPrice}!`);
  };

  // Batch sync ALL matched prices to catalog
  const handleSyncAllMatchedPrices = async () => {
    const matchedWithValidPrices = matchedStagingItems.filter(
      i => i.matchedModel && !isNaN(parseFloat(i.price))
    );

    if (matchedWithValidPrices.length === 0) {
      alert('هیچ مۆدێلێکی هاوتاکراو بە نرخی دروست نەدۆزرایەوە.');
      return;
    }

    setIsApplying(true);
    const priceMap = new Map();
    matchedWithValidPrices.forEach(item => {
      priceMap.set(item.matchedModel.id, parseFloat(item.price));
    });

    const updatedCatalog = models.map(m => {
      if (priceMap.has(m.id)) {
        return {
          ...m,
          salePrice: priceMap.get(m.id)
        };
      }
      return m;
    });

    try {
      await onApplyPriceUpdates(updatedCatalog);
      setSuccessToast(`⚡ ${matchedWithValidPrices.length} مۆدێل بە نرخی نوێی دۆلار ($) نوێکرانەوە!`);
    } catch (err) {
      alert('هەڵە لە نوێکردنەوەی نرخەکان: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Batch sync SELECTED items
  const handleSyncSelectedPrices = async () => {
    const selectedItems = matchedStagingItems.filter(
      i => i.selected && i.matchedModel && !isNaN(parseFloat(i.price))
    );

    if (selectedItems.length === 0) {
      alert('تکایە سەرەتا چەند مۆدێلێکی هاوتاکراو بە چێکبۆکس هەڵبژێرە.');
      return;
    }

    setIsApplying(true);
    const priceMap = new Map();
    selectedItems.forEach(item => {
      priceMap.set(item.matchedModel.id, parseFloat(item.price));
    });

    const updatedCatalog = models.map(m => {
      if (priceMap.has(m.id)) {
        return {
          ...m,
          salePrice: priceMap.get(m.id)
        };
      }
      return m;
    });

    try {
      await onApplyPriceUpdates(updatedCatalog);
      setSuccessToast(`✅ ${selectedItems.length} مۆدێلی دیاریکراو نوێکرانەوە!`);
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
      originalPrice: parseFloat(item.price) || 0,
      salePrice: parseFloat(item.price) || 0,
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
      localStorage.removeItem('ashley_price_matcher_staging');
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
                دەرهێنانی زیرەکی مۆدێل، پاراستنی وردی نرخ ($)، و نوێکردنەوەی خێرای کەتەلۆگ
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

            {/* Smart Detection Features Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>دەرهێنانی زیرەکی مۆدێل</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  وشە زیادەکانی وەک Accessories، Furniture و پێوانەکان لا دەبات و ناوی خاوێنی مۆدێل و کۆد دەردەهێنێت.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span>پاراستنی تەواوەتی نرخ ($)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  نرخەکان بە تەواوی و بێ دەستکاری وەک ناو فایلی ئێکسڵ دەمێننەوە بە دۆلاری ئەمریکی ($ USD).
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
                  <div className="text-[10px] font-bold text-emerald-600">هاوتاکراو لە کەتەلۆگ</div>
                  <div className="text-base font-black text-emerald-700 font-mono flex items-center gap-1.5">
                    <span>{stats.matchedCount}</span>
                    <span className="text-[10px] font-bold text-emerald-600/80 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                      {stats.matchPercentage}%
                    </span>
                  </div>
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

            {/* Toolbar: Filter chips & Smart Multi-field Search Bar */}
            <div className="p-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 select-none">
              
              {/* Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
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

              {/* Real-time Search Box */}
              <div className="relative min-w-[240px] sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="گەڕان بەپێی کۆد، مۆدێل، وەسف، نرخ..."
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
                      <th className="p-2 min-w-[160px] text-start border-e border-slate-200">وەسفی تەواوی ئێکسڵ</th>
                      <th className="p-2 min-w-[180px] text-start border-e border-slate-200">ناوی پێشبینیکراوی مۆدێل (دەستکاری)</th>
                      <th className="p-2 w-24 text-center border-e border-slate-200">نرخی ئێکسڵ ($)</th>
                      <th className="p-2 w-36 text-start border-e border-slate-200">هاوتا لەگەڵ کەتەلۆگ</th>
                      <th className="p-2 w-28 text-center">کردار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleItems.map((item, idx) => {
                      const isMatched = !!item.matchedModel;
                      const hasPriceDiff = isMatched && !item.isPriceEqual && item.priceDifference !== null;

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
                          <td className="p-2 border-e border-slate-200 text-slate-600 max-w-[220px] truncate" title={item.rawDesc}>
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

                          {/* Excel Price strictly preserved in $ */}
                          <td className="p-2 text-center border-e border-slate-200 font-mono font-black text-emerald-700 text-xs">
                            {item.price ? (
                              <span>${item.price}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Catalog Match Status & Current Price */}
                          <td className="p-2 border-e border-slate-200">
                            {isMatched ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]" title={item.matchedModel.name}>
                                    {item.matchedModel.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-500">
                                  <span>ئێستا: ${item.currentCatalogPrice || 0}</span>
                                  {hasPriceDiff && (
                                    <span className={`px-1 py-0.2 rounded font-bold text-[9.5px] ${
                                      item.priceDifference > 0
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {item.priceDifference > 0 ? `+${item.priceDifference}` : item.priceDifference}
                                    </span>
                                  )}
                                  {item.isPriceEqual && (
                                    <span className="text-slate-400 text-[9.5px]">هاوشێوە</span>
                                  )}
                                </div>
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
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1"
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
                  <span>⚡ نوێکردنەوەی هەموو نرخە هاوتاکراوەکان ({stats.matchedCount} مۆدێل بە $)</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
