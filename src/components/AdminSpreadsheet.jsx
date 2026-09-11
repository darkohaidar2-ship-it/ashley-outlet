import React, { useState, useRef } from 'react';
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
  FolderPlus
} from 'lucide-react';
import { catalogService } from '../services/catalogService';

export default function AdminSpreadsheet({
  models,
  categories,
  collections,
  t,
  lang,
  onSaveBulk,
  onClose
}) {
  const [tableData, setTableData] = useState(() => JSON.parse(JSON.stringify(models || [])));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const fileInputRef = useRef(null);

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
      name: '',
      sku: 'ASH-' + Math.floor(1000 + Math.random() * 9000),
      image: '',
      stock: '',
      originalPrice: '',
      salePrice: '',
      notes: ''
    };
    setTableData(prev => [newRow, ...prev]);
  };

  // Delete row
  const handleDeleteRow = (index) => {
    setTableData(prev => prev.filter((_, i) => i !== index));
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
        console.error('Failed to upload dropped image', err);
      }
    }
  };

  // Image File Picker for specific row
  const handleFileInputChange = async (e, index) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const uploadedUrl = await catalogService.uploadImage(file);
        if (uploadedUrl) {
          handleCellChange(index, 'image', uploadedUrl);
        }
      } catch (err) {
        console.error('Failed to upload image file', err);
      }
    }
  };

  // Excel / CSV File Import
  const handleImportExcel = (e) => {
    const file = e.target.files?.[0];
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
            sku: codeOrName || '',
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
        'Model Code / Name (کۆد / ناوی مۆدێل)': row.name,
        'Category (کەتەگۆری)': cat ? (lang === 'ku' ? cat.name_ku : cat.name_en) : '',
        'Collection (سێت)': col ? col.name : '',
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
              <th className="p-2 min-w-[200px] text-start border-e border-slate-200">{t.modelName} *</th>
              <th className="p-2 min-w-[120px] text-start border-e border-slate-200">{t.category}</th>
              <th className="p-2 min-w-[120px] text-start border-e border-slate-200">{t.collection}</th>
              <th className="p-2 w-20 text-center border-e border-slate-200">{t.stockCount}</th>
              <th className="p-2 w-24 text-center border-e border-slate-200">{t.oldPriceLabel}</th>
              <th className="p-2 w-28 text-center border-e border-slate-200 text-red-600">{t.newPriceLabel} *</th>
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
                          <span className="font-semibold text-[8px] leading-none">{t.noImage || 'وێنەی نییە'}</span>
                        </div>
                      )}

                      {/* Drop/Upload overlay */}
                      <label className="absolute inset-0 bg-black/60 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer font-bold">
                        <span>{row.image ? 'گۆڕین' : 'دانان'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileInputChange(e, idx)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </td>

                  {/* Model Code / Name */}
                  <td className="p-1 border-e border-slate-200">
                    <input
                      type="text"
                      value={row.name || ''}
                      onChange={(e) => {
                        handleCellChange(idx, 'name', e.target.value);
                        handleCellChange(idx, 'sku', e.target.value);
                      }}
                      placeholder="کۆد یان ناوی مۆدێل..."
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

    </div>
  );
}
