import React, { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
  FolderPlus,
  FolderArchive,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpZA,
  Tag,
  X
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { downloadAllImagesAsZip, downloadModelImage } from '../services/imageExportService';

export default function AdminSpreadsheet({
  models,
  categories,
  collections,
  settings,
  onSaveSettings,
  t,
  lang,
  onSaveBulk,
  onClose
}) {
  const [customStatuses, setCustomStatuses] = useState(() => {
    if (settings?.customItemTypes && settings.customItemTypes.length > 0) {
      return settings.customItemTypes;
    }
    return ['ستۆک', 'یەدەگ', 'ئاوتلێت'];
  });
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatusInput, setNewStatusInput] = useState('');

  const [tableData, setTableData] = useState(() => {
    const list = (models || []).map(m => ({
      ...m,
      itemType: m.itemType || (m.sku && m.sku !== m.name ? m.sku : '')
    }));
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));
  });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null); // 2-Factor deletion state
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, text: '' });
  const fileInputRef = useRef(null);

  // Sync customStatuses with settings
  useEffect(() => {
    if (settings?.customItemTypes && settings.customItemTypes.length > 0) {
      setCustomStatuses(settings.customItemTypes);
    }
  }, [settings?.customItemTypes]);

  // Manage custom item statuses (Add / Delete)
  const handleAddStatus = async () => {
    const trimmed = newStatusInput.trim();
    if (!trimmed || customStatuses.includes(trimmed)) return;
    const updated = [...customStatuses, trimmed];
    setCustomStatuses(updated);
    setNewStatusInput('');
    if (onSaveSettings) {
      await onSaveSettings({
        ...settings,
        customItemTypes: updated
      });
    }
  };

  const handleDeleteStatus = async (statusToDelete) => {
    if (customStatuses.length <= 1) {
      alert('پێویستە بەلایەنی کەم یەک دەستەواژە هەبێت / At least one status is required');
      return;
    }
    const updated = customStatuses.filter(s => s !== statusToDelete);
    setCustomStatuses(updated);
    if (onSaveSettings) {
      await onSaveSettings({
        ...settings,
        customItemTypes: updated
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

  // Handle cell text edits
  const handleCellChange = (index, field, value) => {
    setTableData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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
  const handleDeleteRow = (index) => {
    setDeleteCandidate({ index, model: tableData[index] });
  };

  // Image Drag & Drop onto specific row
  const handleDropImage = async (e, index) => {
    e.preventDefault();
    setDragOverIndex(null);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      try {
        const uploadedUrl = await catalogService.uploadImage(files[0]);
        if (uploadedUrl) {
          handleCellChange(index, 'image', uploadedUrl);
        }
      } catch (err) {
        alert('کێشەیەک ڕوویدا لە بارکردنی وێنە / Error uploading image');
      }
    }
  };

  // Direct File Input for row image
  const handleFileInputChange = async (e, index) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const uploadedUrl = await catalogService.uploadImage(files[0]);
        if (uploadedUrl) {
          handleCellChange(index, 'image', uploadedUrl);
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

  // Export Table Data to Excel
  const handleExportExcel = () => {
    const exportRows = tableData.map(row => {
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

  return (
    <div className="flex-1 flex flex-col bg-slate-100 p-2 sm:p-4 overflow-hidden select-none no-print h-[calc(100vh-68px)]">
      
      {/* Top Toolbar (Google Sheets Style) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-3 mb-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
              {t.spreadsheetView} (Excel / Google Sheets)
            </h3>
            <p className="text-[11px] text-slate-500">
              سەرجەم مۆدێلەکان: <strong className="text-slate-800">{tableData.length}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons: Add Row, Import, Export, Save */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Add Row */}
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.addRow}</span>
          </button>

          {/* Import Excel */}
          <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs">
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.importExcel}</span>
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
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title={t.exportExcel}
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.exportExcel}</span>
          </button>

          {/* Quick A-Z / Z-A Sorting */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleQuickSort('asc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                sortConfig.key === 'name' && sortConfig.direction === 'asc'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
              title="سۆرتی ئەلفوبێ (A بۆ Z)"
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              <span>A ➔ Z</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickSort('desc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                sortConfig.key === 'name' && sortConfig.direction === 'desc'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
              title="سۆرتی پێچەوانە (Z بۆ A)"
            >
              <ArrowUpZA className="w-3.5 h-3.5" />
              <span>Z ➔ A</span>
            </button>
          </div>

          {/* Export All Images (ZIP) */}
          <button
            onClick={handleDownloadAllImages}
            disabled={isExportingImages}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            title="خەزنکردنی هەموو وێنەکان لە یەک فایلی ZIP بە ناوی مۆدێلەکانەوە"
          >
            {isExportingImages ? (
              <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FolderArchive className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span>{isExportingImages ? exportProgress.text : 'خەزنکردنی وێنەکان (ZIP)'}</span>
          </button>

          {/* Manage Item Statuses (دۆخی کاڵا) */}
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            title={t.manageItemStatuses || "دیاریکردن و بەڕێوەبردنی دەستەواژەکانی دۆخی کاڵا"}
          >
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.itemStatus || 'دۆخی کاڵا'}</span>
            <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {customStatuses.length}
            </span>
          </button>

          {/* Save All */}
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? '...' : (saveSuccess ? 'سەیڤ کرا!' : t.saveAll)}</span>
          </button>

        </div>

      </div>

      {/* Spreadsheet Table Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-auto shadow-sm">
        <table className="w-full text-xs text-slate-700 border-collapse">
          
          {/* Header Row */}
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-300">
            <tr>
              <th className="p-2 w-10 text-center border-e border-slate-200">#</th>
              <th className="p-2 w-28 text-center border-e border-slate-200">{t.uploadImage} (Drag & Drop)</th>
              
              <th 
                onClick={() => handleSortColumn('name')}
                className="p-2 min-w-[200px] text-start border-e border-slate-200 cursor-pointer select-none hover:bg-slate-200/80 transition-colors group"
                title="کلیک بکە بۆ سۆرت (A بۆ Z / پێچەوانە)"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>{t.modelName} *</span>
                  {renderSortIndicator('name')}
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('categoryId')}
                className="p-2 min-w-[120px] text-start border-e border-slate-200 cursor-pointer select-none hover:bg-slate-200/80 transition-colors group"
                title="کلیک بکە بۆ سۆرت بەپێی کەتەگۆری"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>{t.category}</span>
                  {renderSortIndicator('categoryId')}
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('collectionId')}
                className="p-2 min-w-[120px] text-start border-e border-slate-200 cursor-pointer select-none hover:bg-slate-200/80 transition-colors group"
                title="کلیک بکە بۆ سۆرت بەپێی سێت"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>{t.collection}</span>
                  {renderSortIndicator('collectionId')}
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('itemType')}
                className="p-2 min-w-[120px] text-start border-e border-slate-200 cursor-pointer select-none hover:bg-slate-200/80 transition-colors group"
                title="کلیک بکە بۆ سۆرت بەپێی دۆخی کاڵا"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>{t.itemStatus || 'دۆخی کاڵا'}</span>
                  {renderSortIndicator('itemType')}
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('stock')}
                className="p-2 w-20 text-center border-e border-slate-200 cursor-pointer select-none hover:bg-slate-200/80 transition-colors group"
                title="کلیک بکە بۆ سۆرت بەپێی عدد"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{t.stockCount}</span>
                  {renderSortIndicator('stock')}
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('originalPrice')}
                className="p-2 w-24 text-center border-e border-slate-200 cursor-pointer select-none hover:bg-slate-200/80 transition-colors group"
                title="کلیک بکە بۆ سۆرت بەپێی نرخی پێشوو"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{t.oldPriceLabel}</span>
                  {renderSortIndicator('originalPrice')}
                </div>
              </th>

              <th 
                onClick={() => handleSortColumn('salePrice')}
                className="p-2 w-28 text-center border-e border-slate-200 text-red-600 cursor-pointer select-none hover:bg-slate-200/80 transition-colors group"
                title="کلیک بکە بۆ سۆرت بەپێی نرخی ئاوت لێت"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{t.newPriceLabel} *</span>
                  {renderSortIndicator('salePrice')}
                </div>
              </th>

              <th className="p-2 min-w-[200px] text-start border-e border-slate-200">{t.notes}</th>
              <th className="p-2 w-12 text-center"></th>
            </tr>
          </thead>

          {/* Table Body (Inline Editable Rows) */}
          <tbody className="divide-y divide-slate-200 font-medium">
            {tableData.map((row, idx) => {
              const isDragOver = dragOverIndex === idx;

              return (
                <tr 
                  key={row.id || idx}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isDragOver ? 'bg-red-50 border-2 border-red-500' : ''
                  }`}
                >
                  
                  {/* Row Number */}
                  <td className="p-1.5 text-center text-slate-400 font-mono border-e border-slate-200 text-[10px]">
                    {idx + 1}
                  </td>

                  {/* Image Drag & Drop Cell */}
                  <td 
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(idx);
                    }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => handleDropImage(e, idx)}
                    className="p-1 border-e border-slate-200 text-center"
                  >
                    <div className="relative group flex items-center justify-center">
                      {row.image ? (
                        <img
                          src={row.image}
                          alt={row.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-2xs"
                        />
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
                            onChange={(e) => handleFileInputChange(e, idx)}
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
                  <td className="p-1 border-e border-slate-200">
                    <input
                      type="text"
                      value={row.name || ''}
                      onChange={(e) => {
                        handleCellChange(idx, 'name', e.target.value);
                        handleCellChange(idx, 'sku', e.target.value);
                      }}
                      placeholder="مۆدێل..."
                      className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-red-500 focus:bg-white text-xs font-bold text-slate-900"
                    />
                  </td>

                  {/* Category */}
                  <td className="p-1 border-e border-slate-200">
                    <select
                      value={row.categoryId || ''}
                      onChange={(e) => handleCellChange(idx, 'categoryId', e.target.value)}
                      className="w-full px-1.5 py-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-red-500 bg-transparent text-xs font-semibold text-slate-700"
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
                  <td className="p-1 border-e border-slate-200">
                    <select
                      value={row.collectionId || ''}
                      onChange={(e) => handleCellChange(idx, 'collectionId', e.target.value)}
                      className="w-full px-1.5 py-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-red-500 bg-transparent text-xs font-medium text-slate-700"
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
                  <td className="p-1 border-e border-slate-200">
                    <select
                      value={row.itemType || ''}
                      onChange={(e) => handleCellChange(idx, 'itemType', e.target.value)}
                      className={`w-full px-1.5 py-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-red-500 text-xs font-bold transition-colors ${
                        row.itemType === 'ستۆک'
                          ? 'bg-amber-50 text-amber-800'
                          : row.itemType === 'یەدەگ'
                          ? 'bg-blue-50 text-blue-800'
                          : row.itemType === 'ئاوتلێت'
                          ? 'bg-red-50 text-red-700'
                          : row.itemType
                          ? 'bg-purple-50 text-purple-800'
                          : 'bg-transparent text-slate-400'
                      }`}
                    >
                      <option value="" className="text-slate-400 font-normal">-- {t.noStatus || 'دیاری نەکراوە'} --</option>
                      {customStatuses.map((st) => (
                        <option key={st} value={st} className="text-slate-800 font-bold">
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Stock */}
                  <td className="p-1 border-e border-slate-200 text-center">
                    <input
                      type="number"
                      value={row.stock !== undefined ? row.stock : ''}
                      onChange={(e) => handleCellChange(idx, 'stock', e.target.value)}
                      placeholder="0"
                      className="w-full text-center px-1 py-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-red-500 focus:bg-white text-xs font-bold text-slate-800"
                    />
                  </td>

                  {/* Old Price */}
                  <td className="p-1 border-e border-slate-200 text-center">
                    <input
                      type="number"
                      value={row.originalPrice !== undefined ? row.originalPrice : ''}
                      onChange={(e) => handleCellChange(idx, 'originalPrice', e.target.value)}
                      placeholder="0"
                      className="w-full text-center px-1 py-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-red-500 focus:bg-white text-xs text-slate-400 font-semibold"
                    />
                  </td>

                  {/* Outlet Price */}
                  <td className="p-1 border-e border-slate-200 text-center">
                    <input
                      type="number"
                      value={row.salePrice !== undefined ? row.salePrice : ''}
                      onChange={(e) => handleCellChange(idx, 'salePrice', e.target.value)}
                      placeholder="0"
                      className="w-full text-center px-1 py-1.5 rounded-lg border border-transparent hover:border-red-300 focus:border-red-500 focus:bg-white text-xs font-black text-red-600"
                    />
                  </td>

                  {/* Notes */}
                  <td className="p-1 border-e border-slate-200">
                    <input
                      type="text"
                      value={row.notes || ''}
                      onChange={(e) => handleCellChange(idx, 'notes', e.target.value)}
                      placeholder="تێبینی، قیاسات..."
                      className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-red-500 focus:bg-white text-[11px] text-slate-600"
                    />
                  </td>

                  {/* Delete Row */}
                  <td className="p-1 text-center">
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>

                </tr>
              );
            })}
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
                  setTableData(prev => prev.filter((_, i) => i !== deleteCandidate.index));
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
                    {t.manageItemStatuses || 'بەڕێوەبردنی دۆخی کاڵاکان'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    دیاریکردنی دەستەواژەکان (وەک: ستۆک، یەدەگ، ئاوتلێت...)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Status Input */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={newStatusInput}
                onChange={(e) => setNewStatusInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStatus();
                  }
                }}
                placeholder={t.newStatusPlaceholder || "دەستەواژەیەکی نوێ بنووسە..."}
                className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
              <button
                type="button"
                onClick={handleAddStatus}
                disabled={!newStatusInput.trim() || customStatuses.includes(newStatusInput.trim())}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addStatus || 'زیادکردن'}</span>
              </button>
            </div>

            {/* Current Statuses List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <p className="text-[11px] font-bold text-slate-400 mb-1">
                دەستەواژە چالاکەکان:
              </p>
              {customStatuses.map((st) => (
                <div
                  key={st}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-slate-800">{st}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteStatus(st)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="سڕینەوە"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition-colors cursor-pointer"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
