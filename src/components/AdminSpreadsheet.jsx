import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Save, 
  Image as ImageIcon, 
  ImageOff,
  Check, 
  CheckCheck,
  AlertCircle,
  FolderPlus,
  FolderArchive,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpZA,
  Tag,
  Edit3,
  RotateCcw,
  Palette,
  Printer,
  Ticket,
  Search,
  X
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { downloadAllImagesAsZip, downloadModelImage } from '../services/imageExportService';
import StickerSheet from './StickerSheet';
import { 
  STATUS_COLOR_PALETTE, 
  DEFAULT_STATUS_COLORS, 
  getStatusColor, 
  getStatusBadgeStyle, 
  getStatusDotStyle,
  normalizeHex 
} from '../utils/statusColors';
import { getOptimizedImageUrl } from '../utils/imageUrl';
import ProgressiveImage from './ProgressiveImage';

export default function AdminSpreadsheet({
  models,
  categories,
  collections,
  settings,
  onSaveSettings,
  t,
  lang,
  onSaveBulk,
  onClose,
  onBatchPrint
}) {
  const [customStatuses, setCustomStatuses] = useState(() => {
    if (settings?.customItemTypes && settings.customItemTypes.length > 0) {
      return settings.customItemTypes;
    }
    return ['ستۆک', 'یەدەگ', 'ئاوتلێت'];
  });
  const [statusColors, setStatusColors] = useState(() => {
    return settings?.customItemTypeColors || DEFAULT_STATUS_COLORS;
  });
  const [newStatusColor, setNewStatusColor] = useState('#9333ea');
  const [activeColorPickerFor, setActiveColorPickerFor] = useState(null); // status name or '__NEW__'
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatusInput, setNewStatusInput] = useState('');
  const [editingStatus, setEditingStatus] = useState(null); // { oldName: '', newName: '' }

  const [tableData, setTableData] = useState(() => {
    const list = (models || []).map(m => ({
      ...m,
      itemType: m.itemType || (m.sku && m.sku !== m.name ? m.sku : '')
    }));
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));
  });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [tableSearch, setTableSearch] = useState('');
  const searchInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dragOverRowId, setDragOverRowId] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null); // 2-Factor deletion state
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, text: '' });
  const [stickerModal, setStickerModal] = useState({ isOpen: false, items: [] });
  const fileInputRef = useRef(null);

  // In-table real-time filtered dataset
  const filteredTableData = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return tableData;

    return tableData.filter((row) => {
      if ((row.name || '').toLowerCase().includes(q)) return true;
      if ((row.itemType || '').toLowerCase().includes(q)) return true;
      if ((row.sku || '').toLowerCase().includes(q)) return true;

      const cat = categories.find(c => c.id === row.categoryId);
      if (cat) {
        if ((cat.name_ku || '').toLowerCase().includes(q)) return true;
        if ((cat.name_en || '').toLowerCase().includes(q)) return true;
        if ((cat.name_ar || '').toLowerCase().includes(q)) return true;
      }

      const col = collections.find(c => c.id === row.collectionId);
      if (col && (col.name || '').toLowerCase().includes(q)) return true;

      if ((row.notes || '').toLowerCase().includes(q)) return true;
      if (String(row.stock ?? '').toLowerCase().includes(q)) return true;
      if (String(row.salePrice ?? '').toLowerCase().includes(q)) return true;
      if (String(row.originalPrice ?? '').toLowerCase().includes(q)) return true;

      return false;
    });
  }, [tableData, tableSearch, categories, collections]);

  // Bulk apply status to items (either only those with empty status, or all items)
  const handleBulkApplyStatus = (statusName, onlyEmpty = true) => {
    if (!statusName) return;
    let count = 0;
    setTableData(prev => {
      return prev.map(row => {
        if (onlyEmpty) {
          if (!row.itemType || !row.itemType.trim()) {
            count++;
            return { ...row, itemType: statusName };
          }
          return row;
        } else {
          count++;
          return { ...row, itemType: statusName };
        }
      });
    });
    alert(
      onlyEmpty 
        ? `دۆخی "${statusName}" بۆ ${count} مۆدێلی بێ دۆخ دیاری کرا.` 
        : `دۆخی "${statusName}" بۆ هەموو ${count} مۆدێل دیاری کرا.`
    );
  };

  // Open sticker modal for a single model
  const handlePrintSingleSticker = (row) => {
    setStickerModal({ isOpen: true, items: [row] });
  };

  // Open sticker modal for all items in the current view (filtered or all)
  const handleOpenStickerBulkModal = () => {
    const targetItems = filteredTableData.length > 0 ? filteredTableData : tableData;
    if (!targetItems || targetItems.length === 0) {
      alert('هیچ مۆدێلێک نەدۆزرایەوە بۆ دروستکردنی لەزگە');
      return;
    }
    setStickerModal({ isOpen: true, items: targetItems });
  };

  // Trigger batch print for all items in current view (filtered or all)
  const handleTriggerBatchPrint = () => {
    const targetItems = filteredTableData.length > 0 ? filteredTableData : tableData;
    if (onBatchPrint) {
      onBatchPrint(targetItems);
    } else {
      window.print();
    }
  };

  // Keep print-stickers mode active on body whenever sticker modal is open
  useEffect(() => {
    if (stickerModal.isOpen) {
      document.body.classList.add('print-stickers');
    } else {
      document.body.classList.remove('print-stickers');
    }
    return () => {
      document.body.classList.remove('print-stickers');
    };
  }, [stickerModal.isOpen]);

  // Trigger browser print for stickers
  const handleExecuteStickerPrint = () => {
    document.body.classList.add('print-stickers');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Sync customStatuses & colors with settings
  useEffect(() => {
    if (settings?.customItemTypes && settings.customItemTypes.length > 0) {
      setCustomStatuses(settings.customItemTypes);
    }
    if (settings?.customItemTypeColors) {
      setStatusColors(prev => ({
        ...prev,
        ...settings.customItemTypeColors
      }));
    }
  }, [settings?.customItemTypes, settings?.customItemTypeColors]);

  // Update a single status's custom color
  const handleUpdateStatusColor = async (statusName, newColor) => {
    const cleanColor = normalizeHex(newColor);
    const updatedColors = {
      ...statusColors,
      [statusName]: cleanColor
    };
    setStatusColors(updatedColors);
    setActiveColorPickerFor(null);
    if (onSaveSettings) {
      await onSaveSettings({
        ...settings,
        customItemTypes: customStatuses,
        customItemTypeColors: updatedColors
      });
    }
  };

  // Manage custom item statuses (Add / Delete / Rename / Restore)
  const handleAddStatus = async (statusToAdd = null, colorToUse = null) => {
    const trimmed = (statusToAdd !== null && typeof statusToAdd === 'string' ? statusToAdd : newStatusInput).trim();
    if (!trimmed) return null;
    if (customStatuses.includes(trimmed)) {
      alert(`دەستەواژەی "${trimmed}" پێشتر بوونی هەیە!`);
      return trimmed;
    }
    const color = normalizeHex(colorToUse || newStatusColor || '#9333ea');
    const updated = [...customStatuses, trimmed];
    const updatedColors = {
      ...statusColors,
      [trimmed]: color
    };
    setCustomStatuses(updated);
    setStatusColors(updatedColors);
    setNewStatusInput('');
    if (onSaveSettings) {
      await onSaveSettings({
        ...settings,
        customItemTypes: updated,
        customItemTypeColors: updatedColors
      });
    }
    return trimmed;
  };

  const handleDeleteStatus = async (statusToDelete) => {
    if (!window.confirm(`دڵنیایت لە سڕینەوە و کەمکردنی "${statusToDelete}" لە لیستی دۆخەکان؟`)) return;
    const updated = customStatuses.filter(s => s !== statusToDelete);
    const updatedColors = { ...statusColors };
    delete updatedColors[statusToDelete];
    setCustomStatuses(updated);
    setStatusColors(updatedColors);
    if (onSaveSettings) {
      await onSaveSettings({
        ...settings,
        customItemTypes: updated,
        customItemTypeColors: updatedColors
      });
    }
  };

  const handleRenameStatus = async (oldName, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed || trimmed === oldName) {
      setEditingStatus(null);
      return;
    }
    if (customStatuses.includes(trimmed)) {
      alert(`دەستەواژەی "${trimmed}" پێشتر لە لیستەکەدا هەیە!`);
      setEditingStatus(null);
      return;
    }
    const updated = customStatuses.map(s => s === oldName ? trimmed : s);
    const updatedColors = { ...statusColors };
    if (updatedColors[oldName]) {
      updatedColors[trimmed] = updatedColors[oldName];
      delete updatedColors[oldName];
    }
    setCustomStatuses(updated);
    setStatusColors(updatedColors);
    setTableData(prev => prev.map(r => r.itemType === oldName ? { ...r, itemType: trimmed } : r));
    setEditingStatus(null);
    if (onSaveSettings) {
      await onSaveSettings({
        ...settings,
        customItemTypes: updated,
        customItemTypeColors: updatedColors
      });
    }
  };

  const handleRestoreDefaultStatuses = async () => {
    const defaults = ['ستۆک', 'یەدەگ', 'ئاوتلێت'];
    const merged = Array.from(new Set([...customStatuses, ...defaults]));
    const updatedColors = {
      ...statusColors,
      ...DEFAULT_STATUS_COLORS
    };
    setCustomStatuses(merged);
    setStatusColors(updatedColors);
    if (onSaveSettings) {
      await onSaveSettings({
        ...settings,
        customItemTypes: merged,
        customItemTypeColors: updatedColors
      });
    }
  };

  // Download all images in a ZIP named after models
  const handleDownloadAllImages = async () => {
    setIsExportingImages(true);
    setExportProgress({ current: 0, total: 0, text: 'ئامادەکاری...' });
    try {
      const count = await downloadAllImagesAsZip(tableData, (current, total, modelName) => {
        setExportProgress({
          current,
          total,
          text: `${current} / ${total}`
        });
      });
      alert(`بە سەرکەوتوویی ${count} وێنە لە فایلی ZIP بە ناوی مۆدێلەکان خەزن کران!`);
    } catch (err) {
      alert(err.message || 'کێشەیەک لە کاتی داگرتنی وێنەکان دروستبوو');
    } finally {
      setIsExportingImages(false);
    }
  };

  // Interactive Column Sorting
  const handleSortColumn = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    setTableData(prev => {
      const sorted = [...prev].sort((a, b) => {
        let valA = a[key] ?? '';
        let valB = b[key] ?? '';

        if (key === 'categoryId') {
          const catA = categories.find(c => c.id === a.categoryId);
          const catB = categories.find(c => c.id === b.categoryId);
          valA = catA?.name_ku || catA?.name || '';
          valB = catB?.name_ku || catB?.name || '';
        } else if (key === 'collectionId') {
          const colA = collections.find(c => c.id === a.collectionId);
          const colB = collections.find(c => c.id === b.collectionId);
          valA = colA?.name || '';
          valB = colB?.name || '';
        } else if (key === 'itemType') {
          valA = a.itemType || '';
          valB = b.itemType || '';
        } else if (key === 'stock' || key === 'originalPrice' || key === 'salePrice') {
          const numA = parseFloat(valA) || 0;
          const numB = parseFloat(valB) || 0;
          return direction === 'asc' ? numA - numB : numB - numA;
        }

        const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        return direction === 'asc' ? comp : -comp;
      });
      return sorted;
    });
  };

  // Quick alphabetical sort for toolbar buttons
  const handleQuickSort = (direction) => {
    setSortConfig({ key: 'name', direction });
    setTableData(prev => {
      const sorted = [...prev].sort((a, b) => {
        const comp = (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
        return direction === 'asc' ? comp : -comp;
      });
      return sorted;
    });
  };

  const renderSortIndicator = (colKey) => {
    if (sortConfig.key !== colKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 inline-block ms-1 opacity-50 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <span className="text-red-600 font-black ms-1 text-[12px]">▲</span> 
      : <span className="text-red-600 font-black ms-1 text-[12px]">▼</span>;
  };

  // Handle cell text edits by unique row ID (immune to filtering & sorting)
  const handleCellChange = (rowId, field, value) => {
    setTableData(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  };

  // Add new empty row
  const handleAddRow = () => {
    const newRow = {
      id: 'mod-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      categoryId: categories[0]?.id || '',
      collectionId: '',
      itemType: '',
      name: '',
      sku: '',
      image: '',
      stock: '',
      originalPrice: '',
      salePrice: '',
      notes: ''
    };
    setTableData(prev => [newRow, ...prev]);
  };

  // 2-Factor / 2-Step delete row request
  const handleDeleteRow = (row) => {
    setDeleteCandidate({ model: row });
  };

  // Image Drag & Drop onto specific row by row ID
  const handleDropImage = async (e, rowId) => {
    e.preventDefault();
    setDragOverRowId(null);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      try {
        const uploadedUrl = await catalogService.uploadImage(files[0]);
        if (uploadedUrl) {
          handleCellChange(rowId, 'image', uploadedUrl);
        }
      } catch (err) {
        alert('کێشەیەک ڕوویدا لە بارکردنی وێنە / Error uploading image');
      }
    }
  };

  // Direct File Input for row image by row ID
  const handleFileInputChange = async (e, rowId) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const uploadedUrl = await catalogService.uploadImage(files[0]);
        if (uploadedUrl) {
          handleCellChange(rowId, 'image', uploadedUrl);
        }
      } catch (err) {
        alert('کێشەیەک ڕوویدا لە بارکردنی وێنە / Error uploading image');
      }
    }
  };

  // Import Excel File (.xlsx, .xls, .csv)
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });

        // Map imported rows tolerance: leave missing fields completely empty
        const importedRows = rawData.map((row, idx) => {
          // Normalize keys to lowercase
          const r = {};
          Object.keys(row).forEach(k => {
            r[k.trim().toLowerCase()] = row[k];
          });

          // Helper to find value from possible column aliases
          const findVal = (keys) => {
            for (const k of keys) {
              if (r[k] !== undefined && r[k] !== '') return r[k];
            }
            return '';
          };

          const codeOrName = findVal([
            'code', 'item code', 'item no', 'item_code', 'item', 'کۆد', 'کۆدی کاڵا', 'کۆدی مۆدێل', 'بارکۆد', 'رمز',
            'name', 'model', 'model name', 'model_name', 'description', 'ناو', 'ناوی مۆدێل', 'اسم', 'الموديل', 'sku'
          ]);
          const itemStatus = findVal([
            'status', 'item status', 'item_status', 'condition', 'type', 'item type', 'item_type',
            'دۆخ', 'دۆخی کاڵا', 'جۆر', 'جۆری کاڵا', 'پۆلێن', 'حالة'
          ]);
          const stock = findVal(['stock', 'quantity', 'qty', 'count', 'عدد', 'ژمارە', 'العدد', 'الكمية']);
          const salePrice = findVal(['price', 'sale price', 'outlet price', 'نرخ', 'نرخی نوێ', 'السعر']);
          const originalPrice = findVal(['original price', 'old price', 'before discount', 'کۆن', 'نرخی پێشوو', 'السعر الأصلي']);
          const notes = findVal(['notes', 'dimensions', 'desc', 'description', 'تێبینی', 'قیاس', 'ملاحظات']);
          const image = findVal(['image', 'photo', 'img', 'وێنە', 'صورة']);
          const catName = findVal(['category', 'cat', 'کەتەگۆری', 'بەش', 'قسم']);
          const colName = findVal(['collection', 'group', 'سێت', 'مجموعة']);

          // Find category ID matching name or leave empty
          const matchedCat = categories.find(c => 
            (c.name_ku && c.name_ku.toLowerCase() === catName.toString().toLowerCase()) ||
            (c.name_en && c.name_en.toLowerCase() === catName.toString().toLowerCase()) ||
            (c.name_ar && c.name_ar.toLowerCase() === catName.toString().toLowerCase()) ||
            (c.id === catName)
          );

          // Find collection ID
          const matchedCol = collections.find(col => 
            col.name.toLowerCase() === colName.toString().toLowerCase() || col.id === colName
          );

          return {
            id: 'mod-' + Date.now() + '-' + idx,
            name: codeOrName || '',
            sku: itemStatus || codeOrName || '',
            itemType: itemStatus || '',
            categoryId: matchedCat ? matchedCat.id : (categories[0]?.id || ''),
            collectionId: matchedCol ? matchedCol.id : '',
            stock: stock !== '' ? stock : '',
            originalPrice: originalPrice !== '' ? originalPrice : '',
            salePrice: salePrice !== '' ? salePrice : '',
            notes: notes || '',
            image: image || ''
          };
        });

        // Prepend or replace table data
        setTableData(prev => [...importedRows, ...prev]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error('Failed to parse Excel file', error);
        alert('کێشەیەک ڕوویدا لە خوێندنەوەی ئێکسڵ / Error reading Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Export Table Data to Excel (exports filtered subset if active)
  const handleExportExcel = () => {
    const rowsToExport = filteredTableData.length > 0 ? filteredTableData : tableData;
    const exportRows = rowsToExport.map(row => {
      const cat = categories.find(c => c.id === row.categoryId);
      const col = collections.find(c => c.id === row.collectionId);
      return {
        'Model (مۆدێل)': row.name,
        'Category (کەتەگۆری)': cat ? (lang === 'ku' ? cat.name_ku : cat.name_en) : '',
        'Collection (سێت)': col ? col.name : '',
        'Status (دۆخی کاڵا)': row.itemType || '',
        'Stock (عدد)': row.stock,
        'Original Price (د.ع)': row.originalPrice,
        'Outlet Price (د.ع)': row.salePrice,
        'Notes (تێبینی)': row.notes,
        'Image URL (بەستەری وێنە)': row.image
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ashley Models');
    XLSX.writeFile(wb, `Ashley_Outlet_Models_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Save All Changes to Server
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveBulk(tableData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to bulk save', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard Shortcuts: Ctrl+S (Save), Ctrl+P (Print), Ctrl+F (Search), Esc (Clear Search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S -> Save all
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveAll();
        return;
      }

      // Ctrl+P or Cmd+P -> Batch Print
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleTriggerBatchPrint();
        return;
      }

      // Ctrl+F or Cmd+F -> Focus Search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Escape -> Clear search if has query
      if (e.key === 'Escape') {
        if (tableSearch) {
          e.preventDefault();
          setTableSearch('');
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tableSearch, tableData, filteredTableData, onBatchPrint]);

  return (
    <div className="flex-1 flex flex-col bg-slate-100 p-2 sm:p-4 overflow-hidden select-none no-print h-[calc(100vh-68px)]">
      
      {/* Top Toolbar (Compact, Modern, Icon-Centric + In-Table Quick Search) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-2.5 mb-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        
        {/* Title, Row Count Badge & In-Table Quick Search (Ctrl+F) */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-lg">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-sm leading-tight hidden sm:block">
              {t.spreadsheetView}
            </h3>
            <span 
              className={`text-xs px-2 py-0.5 rounded-full font-bold border font-mono transition-colors ${
                filteredTableData.length !== tableData.length
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={filteredTableData.length !== tableData.length ? `فلتەرکراو: ${filteredTableData.length} لە کۆی ${tableData.length}` : `کۆی گشتی: ${tableData.length}`}
            >
              {filteredTableData.length !== tableData.length ? `${filteredTableData.length} / ${tableData.length}` : tableData.length}
            </span>
          </div>

          {/* Real-time search box (Ctrl+F) */}
          <div className="relative flex-1 min-w-[130px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="گەڕان... (Ctrl+F)"
              className="w-full ps-8 pe-7 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-bold text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-red-500 focus:outline-none transition-all shadow-2xs"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => setTableSearch('')}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
                title="پاککردنەوەی گەڕان (Esc)"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons: Add Row, Print, Import, Export, Sort, Statuses, Save */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Add Row */}
          <button
            onClick={handleAddRow}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-emerald-700 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="زیادکردنی ڕیز (Add Row)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Batch Print A4 Album (PRINT / Ctrl+P) */}
          <button
            type="button"
            onClick={handleTriggerBatchPrint}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-red-600 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
            title={`چاپکردنی ئەلبوم (PRINT / Ctrl+P) - ${filteredTableData.length} مۆدێل`}
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Import Excel */}
          <label 
            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="هاوردەکردنی ئێکسڵ (Import Excel)"
          >
            <Upload className="w-4 h-4" />
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
            title={`داگرتنی ئێکسڵ (${filteredTableData.length} مۆدێل)`}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Quick A-Z / Z-A Sorting */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleQuickSort('asc')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                sortConfig.key === 'name' && sortConfig.direction === 'asc'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
              title="سۆرتی ئەلفوبێ (A ➔ Z)"
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickSort('desc')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                sortConfig.key === 'name' && sortConfig.direction === 'desc'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
              title="سۆرتی پێچەوانە (Z ➔ A)"
            >
              <ArrowUpZA className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export All Images (ZIP) */}
          <button
            onClick={handleDownloadAllImages}
            disabled={isExportingImages}
            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
            title="خەزنکردنی هەموو وێنەکان (ZIP)"
          >
            {isExportingImages ? (
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FolderArchive className="w-4 h-4 text-purple-600" />
            )}
          </button>

          {/* Print Stickers (ئامادەکردنی لەزگە) */}
          <button
            type="button"
            onClick={handleOpenStickerBulkModal}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
            title={`ئامادەکردن و چاپکردنی لەزگە (${filteredTableData.length})`}
          >
            <Ticket className="w-4 h-4" />
            <span className="text-[11px] font-bold text-rose-800">{filteredTableData.length}</span>
          </button>

          {/* Manage Item Statuses (دۆخی کاڵا) */}
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
            title="ڕێکخستنی دۆخی کاڵا (ستۆک، ئاوتلێت، یەدەگ)"
          >
            <Tag className="w-4 h-4 text-amber-600" />
            <span className="bg-amber-200 text-amber-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {customStatuses.length}
            </span>
          </button>

          {/* Save All (Ctrl+S) */}
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title="سەیڤکردنی هەموو گۆڕانکارییەکان (Ctrl+S)"
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? '...' : (saveSuccess ? 'سەیڤ کرا!' : 'سەیڤ')}</span>
          </button>

          {/* Close Spreadsheet View */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-all cursor-pointer"
              title="داخستنی خشتە و گەڕانەوە بۆ پێشاندانی وێنەیی"
            >
              <X className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>

      {/* Spreadsheet Table Container with Clear TABLE BORDER */}
      <div className="flex-1 bg-white rounded-xl border-2 border-slate-300 overflow-auto shadow-xs">
        <table className="w-full text-xs text-slate-800 border-collapse border border-slate-300 select-text">
          
          {/* Header Row */}
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 text-[11px] font-bold border-b-2 border-slate-400 shadow-2xs">
            <tr>
              <th className="p-2 w-10 text-center border border-slate-300 bg-slate-100 font-bold">#</th>
              <th className="p-2 w-24 text-center border border-slate-300 bg-slate-100 font-bold">{t.uploadImage}</th>
              
              <th 
                onClick={() => handleSortColumn('name')}
                className="p-2 min-w-[200px] text-start border border-slate-300 bg-slate-100 cursor-pointer select-none hover:bg-slate-200 transition-colors group font-bold"
                title="کلیک بکە بۆ سۆرت (A بۆ Z / پێچەوانە)"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>{t.modelName} *</span>
                  {renderSortIndicator('name')}
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('categoryId')}
                className="p-2 min-w-[120px] text-start border border-slate-300 bg-slate-100 cursor-pointer select-none hover:bg-slate-200 transition-colors group font-bold"
                title="کلیک بکە بۆ سۆرت بەپێی کەتەگۆری"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>{t.category}</span>
                  {renderSortIndicator('categoryId')}
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('collectionId')}
                className="p-2 min-w-[120px] text-start border border-slate-300 bg-slate-100 cursor-pointer select-none hover:bg-slate-200 transition-colors group font-bold"
                title="کلیک بکە بۆ سۆرت بەپێی سێت"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>{t.collection}</span>
                  {renderSortIndicator('collectionId')}
                </div>
              </th>

              <th 
                className="p-2 min-w-[140px] text-start border border-slate-300 bg-slate-100 select-none group font-bold"
              >
                <div className="flex items-center justify-between gap-1">
                  <span 
                    onClick={() => handleSortColumn('itemType')}
                    className="cursor-pointer flex items-center gap-1 font-bold flex-1"
                    title="کلیک بکە بۆ سۆرت بەپێی دۆخی کاڵا"
                  >
                    <span>{t.itemStatus || 'دۆخی کاڵا'}</span>
                    {renderSortIndicator('itemType')}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStatusModalOpen(true);
                    }}
                    className="p-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-md border border-amber-300 shadow-2xs cursor-pointer"
                    title="ڕێکخستنی دۆخەکان (ستۆک، ئاوتلێت، یەدەگ...)"
                  >
                    <Tag className="w-3 h-3" />
                  </button>
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('stock')}
                className="p-2 w-20 text-center border border-slate-300 bg-slate-100 cursor-pointer select-none hover:bg-slate-200 transition-colors group font-bold"
                title="کلیک بکە بۆ سۆرت بەپێی عدد"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{t.stockCount}</span>
                  {renderSortIndicator('stock')}
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('originalPrice')}
                className="p-2 w-24 text-center border border-slate-300 bg-slate-100 cursor-pointer select-none hover:bg-slate-200 transition-colors group font-bold"
                title="کلیک بکە بۆ سۆرت بەپێی نرخی پێشوو"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{t.oldPriceLabel}</span>
                  {renderSortIndicator('originalPrice')}
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('salePrice')}
                className="p-2 w-28 text-center border border-slate-300 bg-slate-100 text-red-600 cursor-pointer select-none hover:bg-slate-200 transition-colors group font-bold"
                title="کلیک بکە بۆ سۆرت بەپێی نرخی ئاوت لێت"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{t.newPriceLabel} *</span>
                  {renderSortIndicator('salePrice')}
                </div>
              </th>

              <th className="p-2 min-w-[200px] text-start border border-slate-300 bg-slate-100 font-bold">{t.notes}</th>
              <th className="p-2 w-16 text-center border border-slate-300 bg-slate-100"></th>
            </tr>
          </thead>

          {/* Table Body (Inline Editable Rows with Clear Gridlines) */}
          <tbody className="font-medium">
            {filteredTableData.map((row, idx) => {
              const isDragOver = dragOverRowId === row.id;

              return (
                <tr 
                  key={row.id || idx}
                  className={`border-b border-slate-300 transition-colors ${
                    isDragOver 
                      ? 'bg-red-50 border-2 border-red-500' 
                      : (idx % 2 === 1 ? 'bg-slate-50/70 hover:bg-amber-50/50' : 'bg-white hover:bg-amber-50/50')
                  }`}
                >
                  
                  {/* Row Number */}
                  <td className="p-1.5 text-center text-slate-500 font-mono font-bold border border-slate-300 text-[11px] bg-slate-100/50 select-none">
                    {idx + 1}
                  </td>

                  {/* Image Drag & Drop Cell with Progressive Thumbnail */}
                  <td 
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverRowId(row.id);
                    }}
                    onDragLeave={() => setDragOverRowId(null)}
                    onDrop={(e) => handleDropImage(e, row.id)}
                    className="p-1 border border-slate-300 text-center bg-white"
                  >
                    <div className="relative group flex items-center justify-center">
                      {row.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                          <ProgressiveImage
                            src={row.image}
                            alt={row.name}
                            preset="thumb"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-[8px] text-slate-400">
                          <ImageOff className="w-3.5 h-3.5 mb-0.5 text-slate-400" />
                          <span className="font-semibold text-[8px] leading-none">بێ وێنە</span>
                        </div>
                      )}

                      {/* Drop/Upload overlay & direct image download */}
                      <div className="absolute inset-0 bg-black/65 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                        <label className="bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded cursor-pointer font-bold leading-tight">
                          <span>{row.image ? 'گۆڕین' : 'دانان'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileInputChange(e, row.id)}
                            className="hidden"
                          />
                        </label>
                        {row.image && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadModelImage(row);
                            }}
                            className="p-1 bg-white/20 hover:bg-white/40 rounded text-white cursor-pointer transition-colors"
                            title="داگرتنی ئەم وێنەیە بە ناوی مۆدێل"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Model */}
                  <td className="p-0.5 border border-slate-300">
                    <input
                      type="text"
                      value={row.name || ''}
                      onChange={(e) => {
                        handleCellChange(row.id, 'name', e.target.value);
                        handleCellChange(row.id, 'sku', e.target.value);
                      }}
                      placeholder="مۆدێل..."
                      className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-red-500 focus:bg-white bg-transparent text-xs font-bold text-slate-900"
                    />
                  </td>

                  {/* Category */}
                  <td className="p-0.5 border border-slate-300">
                    <select
                      value={row.categoryId || ''}
                      onChange={(e) => handleCellChange(row.id, 'categoryId', e.target.value)}
                      className="w-full px-1.5 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-red-500 bg-transparent text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      <option value="">-- دیاری بکە --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {lang === 'ku' ? c.name_ku || c.name : lang === 'ar' ? c.name_ar || c.name : c.name_en || c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Collection */}
                  <td className="p-0.5 border border-slate-300">
                    <select
                      value={row.collectionId || ''}
                      onChange={(e) => handleCellChange(row.id, 'collectionId', e.target.value)}
                      className="w-full px-1.5 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-red-500 bg-transparent text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="">-- سێت --</option>
                      {collections
                        .filter(col => !row.categoryId || col.categoryId === row.categoryId)
                        .map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.name}
                          </option>
                        ))}
                    </select>
                  </td>

                  {/* Item Status (دۆخی کاڵا) */}
                  <td className="p-1 border border-slate-300 text-center">
                    <select
                      value={row.itemType || ''}
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (val === '__ADD_NEW__') {
                          const newName = window.prompt('ناوی دۆخی نوێ بنووسە بۆ زیادکردن (وەک: ستۆک، ئاوتلێت، یەدەگ، تێکچوو، پێشانگا، هتد):');
                          if (newName && newName.trim()) {
                            const added = await handleAddStatus(newName.trim());
                            if (added) {
                              handleCellChange(row.id, 'itemType', added);
                            }
                          }
                          return;
                        }
                        if (val === '__MANAGE__') {
                          setIsStatusModalOpen(true);
                          return;
                        }
                        handleCellChange(row.id, 'itemType', val);
                      }}
                      style={row.itemType ? getStatusBadgeStyle(row.itemType, statusColors) : {}}
                      className={`w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-red-500 text-xs font-black transition-all cursor-pointer text-center ${
                        !row.itemType ? 'bg-slate-50 text-slate-400 font-normal' : 'shadow-2xs'
                      }`}
                    >
                      <option value="" className="text-slate-400 font-normal bg-white">-- {t.noStatus || 'دیاری نەکراوە'} --</option>
                      {customStatuses.map((st) => (
                        <option key={st} value={st} className="text-slate-800 font-bold bg-white">
                          {st}
                        </option>
                      ))}
                      <option disabled className="text-slate-300 font-bold">──────────</option>
                      <option value="__ADD_NEW__" className="text-emerald-700 font-black bg-emerald-50">
                        ➕ زیادکردنی دۆخی نوێ...
                      </option>
                      <option value="__MANAGE__" className="text-amber-800 font-bold bg-amber-50">
                        ⚙️ سڕینەوە و کەمکردن (بەڕێوەبردن)...
                      </option>
                    </select>
                  </td>

                  {/* Stock */}
                  <td className="p-0.5 border border-slate-300 text-center">
                    <input
                      type="number"
                      value={row.stock !== undefined ? row.stock : ''}
                      onChange={(e) => handleCellChange(row.id, 'stock', e.target.value)}
                      placeholder="0"
                      className="w-full text-center px-1 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-red-500 focus:bg-white bg-transparent text-xs font-bold text-slate-800 font-mono"
                    />
                  </td>

                  {/* Old Price */}
                  <td className="p-0.5 border border-slate-300 text-center">
                    <input
                      type="number"
                      value={row.originalPrice !== undefined ? row.originalPrice : ''}
                      onChange={(e) => handleCellChange(row.id, 'originalPrice', e.target.value)}
                      placeholder="0"
                      className="w-full text-center px-1 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-red-500 focus:bg-white bg-transparent text-xs text-slate-400 font-semibold font-mono"
                    />
                  </td>

                  {/* Outlet Price */}
                  <td className="p-0.5 border border-slate-300 text-center">
                    <input
                      type="number"
                      value={row.salePrice !== undefined ? row.salePrice : ''}
                      onChange={(e) => handleCellChange(row.id, 'salePrice', e.target.value)}
                      placeholder="0"
                      className="w-full text-center px-1 py-1.5 rounded border border-transparent hover:border-red-300 focus:border-red-500 focus:bg-white bg-transparent text-xs font-black text-red-600 font-mono"
                    />
                  </td>

                  {/* Notes */}
                  <td className="p-0.5 border border-slate-300">
                    <input
                      type="text"
                      value={row.notes || ''}
                      onChange={(e) => handleCellChange(row.id, 'notes', e.target.value)}
                      placeholder="تێبینی، قیاسات..."
                      className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-red-500 focus:bg-white bg-transparent text-[11px] text-slate-600"
                    />
                  </td>

                  {/* Actions (Sticker & Delete) */}
                  <td className="p-1 border border-slate-300 text-center bg-slate-50/50">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePrintSingleSticker(row)}
                        className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-lg transition-all cursor-pointer shadow-2xs"
                        title="ئامادەکردن و چاپکردنی لەزگەی ئەم مۆدێلە (Print Sticker)"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}

            {/* Empty Search State */}
            {filteredTableData.length === 0 && (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-400 bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-slate-300" />
                    <span className="text-sm font-bold text-slate-700">
                      هیچ مۆدێلێک نەدۆزرایەوە بە گەڕانی "{tableSearch}"
                    </span>
                    <button
                      type="button"
                      onClick={() => setTableSearch('')}
                      className="mt-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl shadow-2xs cursor-pointer"
                    >
                      پاککردنەوەی گەڕان
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* 2-Factor / 2-Step Item Deletion Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 text-center animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <h3 className="font-black text-base text-slate-900 leading-snug">
              دڵنیایت لە سڕینەوەی ئەم مۆدێلە؟
            </h3>
            
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-start space-y-1.5">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>مۆدێل:</span>
                <span className="text-red-600 font-black">{deleteCandidate.model?.name || 'بێ ناو'}</span>
              </div>
              {deleteCandidate.model?.stock !== '' && deleteCandidate.model?.stock !== undefined && (
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>عدد:</span>
                  <span className="font-bold text-slate-800">{deleteCandidate.model.stock} دانە</span>
                </div>
              )}
              {deleteCandidate.model?.salePrice && (
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>نرخ:</span>
                  <span className="font-bold text-slate-800">{Number(deleteCandidate.model.salePrice).toLocaleString()} {t.currency}</span>
                </div>
              )}
            </div>

            <p className="text-[10.5px] text-rose-600 font-bold mt-2.5">
              ⚠️ ئەم هەنگاوە (2F) بۆ پاراستنی کاڵاکانە و پاشگەزبوونەوەی نییە!
            </p>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableData(prev => prev.filter(r => r.id !== deleteCandidate.model?.id));
                  setDeleteCandidate(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer active:scale-98"
              >
                بەڵێ، بسڕەوە
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Item Statuses Management Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                    زیادکردن و کەمکردنی دۆخی کاڵا
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    بەڕێوەبردنی دەستەواژەکان (ستۆک، ئاوتلێت، یەدەگ...)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setEditingStatus(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Status Input */}
            <div className="mb-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
              <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                ➕ زیادکردنی دۆخی نوێ لەگەڵ ڕەنگ:
              </label>
              <div className="flex items-center gap-2">
                <label
                  className="relative w-9 h-9 rounded-xl border-2 border-white shadow-md cursor-pointer flex items-center justify-center transition-transform hover:scale-105 shrink-0"
                  style={{ backgroundColor: newStatusColor }}
                  title="هەڵبژاردنی ڕەنگ بە دڵی خۆت"
                >
                  <Palette className="w-4 h-4 text-white drop-shadow-sm" />
                  <input
                    type="color"
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
                <input
                  type="text"
                  value={newStatusInput}
                  onChange={(e) => setNewStatusInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStatus(newStatusInput.trim(), newStatusColor);
                    }
                  }}
                  placeholder="بۆ نموونە: ستۆک، ئاوتلێت، یەدەگ..."
                  className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
                <button
                  type="button"
                  onClick={() => handleAddStatus(newStatusInput.trim(), newStatusColor)}
                  disabled={!newStatusInput.trim() || customStatuses.includes(newStatusInput.trim())}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>زیادکردن</span>
                </button>
              </div>

              {/* Color Presets */}
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold">پێشنیاری ڕەنگ:</span>
                {STATUS_COLOR_PALETTE.map((c) => {
                  const hexStr = normalizeHex(c);
                  const isSelected = normalizeHex(newStatusColor).toLowerCase() === hexStr.toLowerCase();
                  return (
                    <button
                      key={hexStr}
                      type="button"
                      onClick={() => setNewStatusColor(hexStr)}
                      className={`w-4 h-4 rounded-full border border-white shadow-xs transition-transform cursor-pointer ${
                        isSelected ? 'scale-125 ring-2 ring-amber-500 ring-offset-1' : 'hover:scale-115'
                      }`}
                      style={{ backgroundColor: hexStr }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Current Statuses List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>لیستی دۆخەکان و ڕەنگەکانیان ({customStatuses.length}):</span>
                <span className="text-[10px] text-slate-400">کلیک لە ڕەنگ بکە بۆ گۆڕینی</span>
              </div>

              {/* Notice for unassigned items if any */}
              {(() => {
                const unassignedCount = tableData.filter(r => !r.itemType || !r.itemType.trim()).length;
                if (unassignedCount === 0) return null;
                return (
                  <div className="mb-2 p-2.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{unassignedCount} مۆدێل دۆخیان دیاری نەکراوە</span>
                    </div>
                    <span className="text-[10.5px] text-amber-800 font-medium">
                      کلیک لە <CheckCheck className="w-3.5 h-3.5 inline text-emerald-700" /> بکە بۆ پڕکردنەوە
                    </span>
                  </div>
                );
              })()}

              {customStatuses.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  هیچ دۆخێک بوونی نییە. دەستەواژەیەک لە سەرەوە زیاد بکە!
                </div>
              ) : (
                customStatuses.map((st) => {
                  const isEditing = editingStatus?.oldName === st;
                  const count = tableData.filter(r => r.itemType === st).length;
                  const unassignedCount = tableData.filter(r => !r.itemType || !r.itemType.trim()).length;
                  const currentColor = getStatusColor(st, statusColors);

                  return (
                    <div
                      key={st}
                      className="relative flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors gap-2"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingStatus.newName}
                            onChange={(e) => setEditingStatus({ ...editingStatus, newName: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleRenameStatus(st, editingStatus.newName);
                              }
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 text-xs font-bold border border-amber-400 rounded-lg focus:outline-none bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameStatus(st, editingStatus.newName)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-bold text-[11px]"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStatus(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors font-bold text-[11px]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Color Swatch / Trigger */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveColorPickerFor(activeColorPickerFor === st ? null : st)}
                                className="w-5 h-5 rounded-full shrink-0 border-2 border-white shadow-xs hover:scale-125 transition-transform cursor-pointer flex items-center justify-center"
                                style={{ backgroundColor: currentColor }}
                                title="کلیک بکە بۆ گۆڕینی ڕەنگ"
                              >
                                <Palette className="w-2.5 h-2.5 text-white/90 drop-shadow-xs" />
                              </button>

                              {/* Color Picker Popover */}
                              {activeColorPickerFor === st && (
                                <div className="absolute top-7 right-0 z-40 bg-white p-2.5 rounded-2xl shadow-2xl border border-slate-200 flex flex-col gap-2 min-w-[200px] animate-fadeIn">
                                  <div className="flex items-center justify-between text-[11px] font-black text-slate-700 pb-1 border-b border-slate-100">
                                    <span>ڕەنگی دۆخ: {st}</span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveColorPickerFor(null)}
                                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-5 gap-1.5">
                                    {STATUS_COLOR_PALETTE.map((palColor) => {
                                      const hexStr = normalizeHex(palColor);
                                      const isSelected = normalizeHex(currentColor).toLowerCase() === hexStr.toLowerCase();
                                      return (
                                        <button
                                          key={hexStr}
                                          type="button"
                                          onClick={() => handleUpdateStatusColor(st, hexStr)}
                                          className={`w-6 h-6 rounded-full border border-white shadow-xs transition-transform cursor-pointer ${
                                            isSelected ? 'scale-125 ring-2 ring-amber-500' : 'hover:scale-115'
                                          }`}
                                          style={{ backgroundColor: hexStr }}
                                        />
                                      );
                                    })}
                                  </div>
                                  <label className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer border border-slate-200 transition-colors">
                                    <input
                                      type="color"
                                      value={currentColor}
                                      onChange={(e) => handleUpdateStatusColor(st, e.target.value)}
                                      className="w-4 h-4 rounded cursor-pointer"
                                    />
                                    <span>ڕەنگی تر (دەستی)...</span>
                                  </label>
                                </div>
                              )}
                            </div>

                            {/* Status Label with its styled badge preview */}
                            <span 
                              className="text-xs font-black px-2 py-0.5 rounded-md truncate shadow-xs"
                              style={getStatusBadgeStyle(st, statusColors)}
                            >
                              {st}
                            </span>

                            {count > 0 && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 px-1.5 py-0.2 rounded-full">
                                {count} کاڵا
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Bulk Apply to all Unassigned items */}
                            <button
                              type="button"
                              onClick={() => handleBulkApplyStatus(st, true)}
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title={`دانانی "${st}" بۆ ئەو مۆدێلانەی دۆخیان دیاری نەکراوە (${unassignedCount})`}
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStatus({ oldName: st, newName: st })}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="دەستکاری ناوی دۆخ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStatus(st)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="سڕینەوە و کەمکردن"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Restore Defaults / Pre-fill */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleRestoreDefaultStatuses}
                className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors font-bold cursor-pointer"
                title="گەڕاندنەوەی دەستەواژە سەرەکییەکان ئەگەر سڕابوونەوە"
              >
                <RotateCcw className="w-3 h-3" />
                <span>گەڕاندنەوەی (ستۆک، ئاوتلێت، یەدەگ)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setEditingStatus(null);
                }}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition-colors cursor-pointer"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. STICKER / LABEL PREVIEW & PRINT MODAL */}
      {stickerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fadeIn no-print">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    ئامادەکردن و پێشبینینی لەزگە (Sticker / Label Preview)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {stickerModal.items.length} لەزگە ئامادەیە بۆ چاپکردن بە ڕەنگی دۆخەکە
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExecuteStickerPrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  title="چاپکردن یان خەزنکردن وەک فایلی PDF"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span className="font-black tracking-wider">PRINT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStickerModal({ isOpen: false, items: [] })}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Preview of the Stickers */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 space-y-6">
              <div id="sticker-preview-wrapper" className="max-w-2xl mx-auto space-y-6">
                {stickerModal.items.map((item, idx) => (
                  <div key={item.id || idx} className="shadow-lg rounded-2xl overflow-hidden">
                    <StickerSheet
                      stickersToPrint={[item]}
                      categories={categories}
                      collections={collections}
                      logoUrl={settings?.logoUrl || ''}
                      statusColors={statusColors}
                      t={t}
                      lang={lang}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-600 font-bold">
                  بۆ خەزنکردن بە PDF: لە پەنجەرەی چاپەکەدا بژاردەی <span className="text-rose-600 font-black">Save as PDF</span> هەڵبژێرە.
                </span>
              </div>
              <button
                type="button"
                onClick={handleExecuteStickerPrint}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                title="دەستپێکردنی چاپ"
              >
                <Printer className="w-4 h-4" />
                <span className="font-black tracking-wider">PRINT ({stickerModal.items.length})</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Active Container for Sticker Printing (Rendered at Body level to escape #screen-root display:none) */}
      {stickerModal.items.length > 0 && typeof document !== 'undefined' && createPortal(
        <StickerSheet
          id="sticker-print-container"
          stickersToPrint={stickerModal.items}
          categories={categories}
          collections={collections}
          logoUrl={settings?.logoUrl || ''}
          statusColors={statusColors}
          t={t}
          lang={lang}
        />,
        document.body
      )}

    </div>
  );
}
