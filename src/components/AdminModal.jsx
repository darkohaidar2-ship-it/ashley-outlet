import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Save, 
  Lock, 
  FolderPlus, 
  Layers, 
  PlusCircle, 
  Sliders, 
  Clock, 
  Sparkles, 
  MoveRight, 
  Image as ImageIcon,
  ZoomIn,
  Trash2,
  Camera,
  Maximize2,
  Scan,
  Palette,
  RotateCcw
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { getCategoryColor, CATEGORY_COLOR_PALETTE } from '../utils/categoryColors';
import { getStatusColor } from '../utils/statusColors';

export default function AdminModal({
  type, // 'login' | 'model' | 'category' | 'collection' | 'logo' | 'settings'
  isOpen,
  onClose,
  t,
  lang,
  categories,
  collections,
  editingModel,
  currentLogo,
  settings,
  onLogin,
  onSaveModel,
  onSaveCategory,
  onDeleteCategory,
  onSaveCollection,
  onDeleteCollection,
  onSaveLogo,
  onSaveSettings,
  onClearAllData
}) {
  if (!isOpen) return null;

  // Login State
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Logo Settings State
  const [logoUrl, setLogoUrl] = useState(currentLogo || '');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(currentLogo || '');

  // Model Form State
  const [modelForm, setModelForm] = useState({
    name: '',
    sku: '',
    itemType: '',
    categoryId: categories[0]?.id || '',
    collectionId: collections[0]?.id || '',
    originalPrice: '',
    salePrice: '',
    stock: 1,
    notes: '',
    image: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Category Form State
  const [catForm, setCatForm] = useState({
    name_ku: '',
    name_en: '',
    name_ar: ''
  });

  // Collection Form State
  const [colForm, setColForm] = useState({
    categoryId: categories[0]?.id || '',
    name: ''
  });

  // Slideshow Timing & UI Scale Settings State
  const [stage1Time, setStage1Time] = useState(3.0);
  const [zoomMotionTime, setZoomMotionTime] = useState(5.0);
  const [stage3Time, setStage3Time] = useState(4.0);
  const [zoomScaleRatio, setZoomScaleRatio] = useState(1.0);
  const [dwellTime, setDwellTime] = useState(12.0);
  const [transitionTime, setTransitionTime] = useState(1.0);
  const [shimmerTime, setShimmerTime] = useState(7.0);
  const [uiScale, setUiScale] = useState(1.0);
  const [settingsTab, setSettingsTab] = useState('slideshow'); // 'slideshow' | 'logo' | 'colors'
  const [logoSubtitle, setLogoSubtitle] = useState(() => settings?.logoSubtitle !== undefined ? settings.logoSubtitle : 'SULAIMANIYAH');
  const [currencyChoice, setCurrencyChoice] = useState(() => settings?.currency || 'USD');

  // Custom Colors State
  const [customCategoryColors, setCustomCategoryColors] = useState({});
  const [customStatusColors, setCustomStatusColors] = useState({});

  useEffect(() => {
    if (editingModel) {
      setModelForm({
        name: editingModel.name || '',
        sku: editingModel.sku || '',
        itemType: editingModel.itemType || (editingModel.sku && editingModel.sku !== editingModel.name ? editingModel.sku : ''),
        categoryId: editingModel.categoryId || (categories[0]?.id || ''),
        collectionId: editingModel.collectionId || '',
        originalPrice: editingModel.originalPrice || '',
        salePrice: editingModel.salePrice || '',
        stock: editingModel.stock || 1,
        notes: editingModel.notes || '',
        image: editingModel.image || ''
      });
      setImagePreview(editingModel.image || '');
    } else {
      setModelForm({
        name: '',
        sku: '',
        itemType: '',
        categoryId: categories[0]?.id || '',
        collectionId: collections[0]?.id || '',
        originalPrice: '',
        salePrice: '',
        stock: 1,
        notes: '',
        image: ''
      });
      setImagePreview('');
    }

    if (settings) {
      if (settings.stage1Time !== undefined) setStage1Time(Number(settings.stage1Time));
      if (settings.zoomMotionTime !== undefined) setZoomMotionTime(Number(settings.zoomMotionTime));
      if (settings.stage3Time !== undefined) setStage3Time(Number(settings.stage3Time));
      if (settings.zoomScaleRatio !== undefined) setZoomScaleRatio(Number(settings.zoomScaleRatio));
      if (settings.slideshowDwellTime !== undefined) setDwellTime(Number(settings.slideshowDwellTime));
      if (settings.slideshowTransitionTime !== undefined) setTransitionTime(Number(settings.slideshowTransitionTime));
      if (settings.slideshowShimmerTime !== undefined) setShimmerTime(Number(settings.slideshowShimmerTime));
      if (settings.uiScale !== undefined) setUiScale(Number(settings.uiScale));
      if (settings.logoUrl) {
        setLogoUrl(settings.logoUrl);
        setLogoPreview(settings.logoUrl);
      }
      if (settings.logoSubtitle !== undefined) setLogoSubtitle(settings.logoSubtitle);
      if (settings.currency) setCurrencyChoice(settings.currency);
      if (settings.categoryColors && typeof settings.categoryColors === 'object') {
        setCustomCategoryColors(settings.categoryColors);
      } else {
        setCustomCategoryColors({});
      }
      if (settings.customItemTypeColors && typeof settings.customItemTypeColors === 'object') {
        setCustomStatusColors(settings.customItemTypeColors);
      } else {
        setCustomStatusColors({ 'ستۆک': '#9333ea', 'ئاوتلێت': '#dc2626', 'یەدەگ': '#2563eb' });
      }
    } else if (currentLogo) {
      setLogoUrl(currentLogo);
      setLogoPreview(currentLogo);
    }

    if (type === 'logo') {
      setSettingsTab('logo');
    } else {
      setSettingsTab('slideshow');
    }
  }, [editingModel, isOpen, categories, collections, settings, currentLogo, type]);

  const handleUpdateCategoryColor = async (catId, newColor) => {
    const updated = {
      ...customCategoryColors,
      [catId]: newColor
    };
    setCustomCategoryColors(updated);
    if (onSaveSettings) {
      await onSaveSettings({
        ...settings,
        categoryColors: updated
      });
    }
  };

  const handleUpdateStatusColor = async (statusKey, newColor) => {
    const updated = {
      ...customStatusColors,
      [statusKey]: newColor
    };
    setCustomStatusColors(updated);
    if (onSaveSettings) {
      await onSaveSettings({
        ...settings,
        customItemTypeColors: updated
      });
    }
  };


  // Handle Login Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setLoginError('وشەی نهێنی هەڵەیە / Wrong password');
    } else {
      setPassword('');
      setLoginError('');
      onClose();
    }
  };

  // Handle Image File Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle Model Submit
  const handleModelSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    let finalImageUrl = modelForm.image;

    // If a file was selected, upload it via catalogService
    if (imageFile) {
      try {
        const uploadedUrl = await catalogService.uploadImage(imageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      } catch (err) {
        console.error('Upload failed, using fallback/existing image', err);
      }
    }

    // Do not set default/placeholder image; leave empty if no image provided
    await onSaveModel({
      ...modelForm,
      sku: modelForm.itemType || modelForm.name.trim(),
      image: finalImageUrl || ''
    });

    setIsUploading(false);
    setImageFile(null);
    onClose();
  };

  // Handle Category Submit
  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!catForm.name_ku && !catForm.name_en) return;
    onSaveCategory(catForm);
    setCatForm({ name_ku: '', name_en: '', name_ar: '' });
    onClose();
  };

  // Handle Collection Submit
  const handleCollectionSubmit = (e) => {
    e.preventDefault();
    if (!colForm.name) return;
    onSaveCollection(colForm);
    setColForm({ categoryId: categories[0]?.id || '', name: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn no-print">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {type === 'login' && <Lock className="w-5 h-5 text-red-600" />}
            {type === 'model' && <PlusCircle className="w-5 h-5 text-red-600" />}
            {type === 'category' && <FolderPlus className="w-5 h-5 text-red-600" />}
            {type === 'collection' && <Layers className="w-5 h-5 text-red-600" />}
            {(type === 'logo' || type === 'settings') && <Sliders className="w-5 h-5 text-red-600" />}
            <h3 className="font-bold text-lg text-slate-900">
              {type === 'login' && t.adminLoginTitle}
              {type === 'model' && (editingModel ? t.edit : t.addNewModel)}
              {type === 'category' && t.addNewCategory}
              {type === 'collection' && t.addNewCollection}
              {(type === 'logo' || type === 'settings') && t.slideshowSettings}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Login Form */}
        {type === 'login' && (
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t.enterPassword}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium tracking-widest"
              />
              {loginError && (
                <p className="text-xs text-red-600 mt-1 font-semibold">{loginError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all"
            >
              {t.login}
            </button>
          </form>
        )}

        {/* 2. Model Form (Add or Edit) */}
        {type === 'model' && (
          <form onSubmit={handleModelSubmit} className="mt-4 space-y-3">
            
            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t.modelName} *
              </label>
              <input
                type="text"
                required
                value={modelForm.name}
                onChange={(e) => setModelForm({ ...modelForm, name: e.target.value, sku: e.target.value })}
                placeholder="B600-54 یان مۆدێل..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Stock Count & Item Status (دۆخی کاڵا) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t.stockCount}
                </label>
                <input
                  type="number"
                  min="0"
                  value={modelForm.stock}
                  onChange={(e) => setModelForm({ ...modelForm, stock: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t.itemStatus || 'دۆخی کاڵا'}
                </label>
                <select
                  value={modelForm.itemType || ''}
                  onChange={async (e) => {
                    const val = e.target.value;
                    if (val === '__ADD_NEW__') {
                      const newName = window.prompt('ناوی دۆخی نوێ بنووسە بۆ زیادکردن (وەک: ستۆک، ئاوتلێت، یەدەگ، تێکچوو، هتد):');
                      if (newName && newName.trim()) {
                        const trimmed = newName.trim();
                        const currentList = settings?.customItemTypes || ['ستۆک', 'یەدەگ', 'ئاوتلێت'];
                        if (!currentList.includes(trimmed)) {
                          const updated = [...currentList, trimmed];
                          if (onSaveSettings) {
                            await onSaveSettings({
                              ...settings,
                              customItemTypes: updated
                            });
                          }
                        }
                        setModelForm({ ...modelForm, itemType: trimmed });
                      }
                      return;
                    }
                    setModelForm({ ...modelForm, itemType: val });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                >
                  <option value="">-- {t.noStatus || 'دیاری نەکراوە'} --</option>
                  {(settings?.customItemTypes || ['ستۆک', 'یەدەگ', 'ئاوتلێت']).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                  <option disabled className="text-slate-300">──────────</option>
                  <option value="__ADD_NEW__" className="text-emerald-700 font-bold bg-emerald-50">
                    ➕ زیادکردنی دۆخی نوێ...
                  </option>
                </select>
              </div>
            </div>

            {/* Category & Collection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t.category}
                </label>
                <select
                  value={modelForm.categoryId}
                  onChange={(e) => setModelForm({ ...modelForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'ku' ? c.name_ku || c.name : lang === 'ar' ? c.name_ar || c.name : c.name_en || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t.collection}
                </label>
                <select
                  value={modelForm.collectionId}
                  onChange={(e) => setModelForm({ ...modelForm, collectionId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                >
                  <option value="">-- هیچ کۆمەڵەیەک --</option>
                  {collections
                    .filter(c => !modelForm.categoryId || c.categoryId === modelForm.categoryId)
                    .map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t.oldPriceLabel}
                </label>
                <input
                  type="number"
                  step="any"
                  value={modelForm.originalPrice}
                  onChange={(e) => setModelForm({ ...modelForm, originalPrice: e.target.value })}
                  placeholder="1200"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-red-600 mb-1">
                  {t.newPriceLabel} *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={modelForm.salePrice}
                  onChange={(e) => setModelForm({ ...modelForm, salePrice: e.target.value })}
                  placeholder="850"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 text-sm font-bold text-red-600"
                />
              </div>
            </div>

            {/* Image Upload or URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t.uploadImage}
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{imageFile ? imageFile.name : t.uploadImage}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                  />
                )}
              </div>
              <input
                type="text"
                value={modelForm.image}
                onChange={(e) => {
                  setModelForm({ ...modelForm, image: e.target.value });
                  setImagePreview(e.target.value);
                }}
                placeholder={t.orImageUrl}
                className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t.notes}
              </label>
              <textarea
                rows="2"
                value={modelForm.notes}
                onChange={(e) => setModelForm({ ...modelForm, notes: e.target.value })}
                placeholder="قیاس و ڕەنگ و تێبینی تایبەت..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading}
              className="w-full mt-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isUploading ? '...' : t.save}</span>
            </button>

          </form>
        )}

        {/* 3. Category Form */}
        {type === 'category' && (
          <form onSubmit={handleCategorySubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ناوی کەتەگۆری (کوردی) *
              </label>
              <input
                type="text"
                required
                value={catForm.name_ku}
                onChange={(e) => setCatForm({ ...catForm, name_ku: e.target.value })}
                placeholder="ژووری میوان"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Category Name (English)
              </label>
              <input
                type="text"
                value={catForm.name_en}
                onChange={(e) => setCatForm({ ...catForm, name_en: e.target.value })}
                placeholder="Guest Room"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                اسم القسم (العربية)
              </label>
              <input
                type="text"
                value={catForm.name_ar}
                onChange={(e) => setCatForm({ ...catForm, name_ar: e.target.value })}
                placeholder="غرفة الضيوف"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all"
            >
              {t.save}
            </button>

            {/* List of existing categories with color picker and delete button */}
            {categories && categories.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    <span>کەتەگۆرییەکان و ڕەنگی ئەلبوم ({categories.length}):</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">کلیک لە ڕەنگ بکە بۆ گۆڕین</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pe-1">
                  {categories.map((c) => {
                    const activeColor = getCategoryColor(c, customCategoryColors);
                    return (
                      <div 
                        key={c.id} 
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs gap-2 border border-slate-200/80 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Color Swatch with Native Color Picker */}
                          <label 
                            className="w-7 h-7 rounded-xl cursor-pointer shrink-0 shadow-xs border-2 border-white ring-1 ring-slate-300 flex items-center justify-center relative overflow-hidden transition-transform hover:scale-110"
                            style={{ backgroundColor: activeColor }}
                            title="گۆڕینی ڕەنگی ئەلبوم بۆ ئەم کەتەگۆرییە"
                          >
                            <input 
                              type="color" 
                              value={activeColor}
                              onChange={(e) => handleUpdateCategoryColor(c.id, e.target.value)}
                              className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                            />
                          </label>
                          <div className="truncate">
                            <span className="font-bold text-slate-900 block truncate">{c.name_ku || c.name || c.name_en}</span>
                            {c.name_en && c.name_en !== c.name_ku && (
                              <span className="text-[10px] text-slate-500 font-medium block truncate font-sans">{c.name_en}</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Palette Circles */}
                        <div className="flex items-center gap-1.5">
                          <div className="hidden sm:flex items-center gap-1">
                            {['#059669', '#1d4ed8', '#d97706', '#b91c1c', '#7c3aed'].map((paletteHex) => (
                              <button
                                key={paletteHex}
                                type="button"
                                onClick={() => handleUpdateCategoryColor(c.id, paletteHex)}
                                className={`w-3.5 h-3.5 rounded-full transition-transform hover:scale-125 ${activeColor.toLowerCase() === paletteHex.toLowerCase() ? 'ring-2 ring-slate-900 scale-110' : 'opacity-70 hover:opacity-100'}`}
                                style={{ backgroundColor: paletteHex }}
                                title={paletteHex}
                              />
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => onDeleteCategory && onDeleteCategory(c.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="سڕینەوە"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        )}

        {/* 4. Collection Form */}
        {type === 'collection' && (
          <form onSubmit={handleCollectionSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t.category} *
              </label>
              <select
                value={colForm.categoryId}
                onChange={(e) => setColForm({ ...colForm, categoryId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'ku' ? c.name_ku || c.name : lang === 'ar' ? c.name_ar || c.name : c.name_en || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ناوی سێت یان کۆمەڵە (Collection Name) *
              </label>
              <input
                type="text"
                required
                value={colForm.name}
                onChange={(e) => setColForm({ ...colForm, name: e.target.value })}
                placeholder="Darcy Modern"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all"
            >
              {t.save}
            </button>

            {/* List of existing collections with delete button */}
            {collections && collections.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 mb-2">سێتە بەردەستەکان ({collections.length}):</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {collections.map((col) => (
                    <div key={col.id} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs">
                      <span className="font-bold text-slate-800">{col.name}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteCollection && onDeleteCollection(col.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="سڕینەوە"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

        {/* 5. Settings & Logo Form */}
        {(type === 'settings' || type === 'logo') && (
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              let finalLogo = logoUrl;
              if (logoFile) {
                try {
                  const uploadedLogo = await catalogService.uploadImage(logoFile);
                  if (uploadedLogo) finalLogo = uploadedLogo;
                } catch (err) {
                  console.error('Logo upload error', err);
                }
              }
              
              const s1 = Math.max(0.5, parseFloat(stage1Time) || 3.0);
              const s2 = Math.max(0.5, parseFloat(zoomMotionTime) || 5.0);
              const s3 = Math.max(0.5, parseFloat(stage3Time) || 4.0);
              const zRatio = Math.max(1.0, Math.min(2.5, parseFloat(zoomScaleRatio) || 1.0));
              const totalDwell = Number((s1 + s2 + s3).toFixed(1));

              const payload = {
                logoUrl: finalLogo,
                slideshowDwellTime: totalDwell,
                stage1Time: s1,
                zoomMotionTime: s2,
                stage3Time: s3,
                zoomScaleRatio: zRatio,
                slideshowTransitionTime: Math.max(0.1, parseFloat(transitionTime) || 1.0),
                slideshowShimmerTime: Math.max(1, parseFloat(shimmerTime) || 7.0),
                uiScale: Math.max(0.65, Math.min(1.2, parseFloat(uiScale) || 0.80)),
                customItemTypes: settings?.customItemTypes || ['یەدەگ', 'ستۆک', 'ئاوتلێت'],
                customItemTypeColors: customStatusColors,
                categoryColors: customCategoryColors,
                currency: currencyChoice,
                logoSubtitle: logoSubtitle
              };

              if (onSaveSettings) {
                await onSaveSettings(payload);
              } else if (onSaveLogo) {
                await onSaveLogo(finalLogo);
              }
              onClose();
            }} 
            className="mt-4 space-y-4"
          >
            {/* Tabs for Slideshow Timing vs Logo vs Colors */}
            <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setSettingsTab('slideshow')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  settingsTab === 'slideshow'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{t.slideshowSettings}</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('colors')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  settingsTab === 'colors'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>ڕەنگەکانی چاپ</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('logo')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  settingsTab === 'logo'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{t.websiteLogo}</span>
              </button>
            </div>

            {settingsTab === 'slideshow' && (
              <div className="space-y-3.5">
                
                {/* 3-Stage Overall Timeline Card */}
                <div className="p-3.5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl text-white shadow-md border border-slate-700/60">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-black tracking-wide text-slate-200">
                        {t.totalDwellTimeLabel || 'کۆی گشتی کاتی مانەوە لەسەر مۆدێل'}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600/90 text-white text-xs font-black tracking-wider shadow-xs">
                      {(parseFloat(stage1Time || 3) + parseFloat(zoomMotionTime || 5) + parseFloat(stage3Time || 4)).toFixed(1)} {t.seconds}
                    </span>
                  </div>

                  {/* Visual 3-Stage Progress Timeline */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                    <div className="bg-indigo-950/70 border border-indigo-500/40 rounded-xl p-2">
                      <span className="text-indigo-300 block text-[9px] font-medium">قۆناغی ١</span>
                      <span className="text-white font-extrabold">{stage1Time}s</span>
                      <span className="text-[9px] text-slate-300 block mt-0.5">تەواوی وێنە</span>
                    </div>
                    <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-2">
                      <span className="text-emerald-300 block text-[9px] font-medium">قۆناغی ٢</span>
                      <span className="text-white font-extrabold">{zoomMotionTime}s</span>
                      <span className="text-[9px] text-emerald-400 block mt-0.5">{Math.round(zoomScaleRatio * 100)}% زووم</span>
                    </div>
                    <div className="bg-rose-950/70 border border-rose-500/40 rounded-xl p-2">
                      <span className="text-rose-300 block text-[9px] font-medium">قۆناغی ٣</span>
                      <span className="text-white font-extrabold">{stage3Time}s</span>
                      <span className="text-[9px] text-slate-300 block mt-0.5">کۆتایی تەواو</span>
                    </div>
                  </div>
                </div>

                {/* Stage 1: Initial Full View Duration */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">
                          {t.stage1TimeLabel || 'قۆناغی ١: نیشاندانی تەواوی وێنە لە سەرەتاوە'}
                        </label>
                        <span className="text-[10px] text-slate-500 block">
                          {t.stage1TimeDesc || 'چرکەی نیشاندانی سەرەتایی وێنەکە پێش ئەوەی کامێرە زووم بکات'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-600 font-extrabold text-xs rounded-xl shadow-xs shrink-0">
                      {stage1Time} {t.seconds}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      value={stage1Time}
                      onChange={(e) => setStage1Time(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      min="1"
                      max="30"
                      step="0.5"
                      value={stage1Time}
                      onChange={(e) => setStage1Time(parseFloat(e.target.value) || 1)}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 shadow-2xs"
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium me-1">خێرا:</span>
                    {[2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStage1Time(val)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                          stage1Time === val 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {val} {t.seconds}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stage 2: Zoom & Pan Motion Duration */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">
                          {t.stage2TimeLabel || 'قۆناغی ٢: زووم ئین و مۆشنی کامێرە (چەپ بۆ ڕاست)'}
                        </label>
                        <span className="text-[10px] text-slate-500 block">
                          {t.stage2TimeDesc || 'چرکەی زوومی ورد و جوڵەی کامێرە بەسەر دیزاین و وردەکاری کاڵاکەدا'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-600 font-extrabold text-xs rounded-xl shadow-xs shrink-0">
                      {zoomMotionTime} {t.seconds}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="0.5"
                      value={zoomMotionTime}
                      onChange={(e) => setZoomMotionTime(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      min="2"
                      max="40"
                      step="0.5"
                      value={zoomMotionTime}
                      onChange={(e) => setZoomMotionTime(parseFloat(e.target.value) || 2)}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 shadow-2xs"
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium me-1">خێرا:</span>
                    {[3, 4, 5, 6, 8, 10].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setZoomMotionTime(val)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                          zoomMotionTime === val 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {val} {t.seconds}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom Scale Ratio (ڕێژەی زوومکردنی کامێرە لە قۆناغی دووەمدا) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">
                          {t.zoomScaleRatioLabel || 'ڕێژەی زوومکردنی سڵایدشۆو (گەورەکردنی وێنە)'}
                        </label>
                        <span className="text-[10px] text-slate-500 block">
                          {t.zoomScaleRatioDesc || 'ڕێژەی زوومی کامێرە لە قۆناغی دووەمدا (بۆ نموونە: ١٢٨٪ یان ١.٢٨x)'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-teal-200 text-teal-600 font-extrabold text-xs rounded-xl shadow-xs shrink-0">
                      {Math.round(zoomScaleRatio * 100)}% ({zoomScaleRatio}x)
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="1.10"
                      max="1.80"
                      step="0.02"
                      value={zoomScaleRatio}
                      onChange={(e) => setZoomScaleRatio(parseFloat(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      min="1.05"
                      max="2.5"
                      step="0.05"
                      value={zoomScaleRatio}
                      onChange={(e) => setZoomScaleRatio(parseFloat(e.target.value) || 1.10)}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 shadow-2xs"
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium me-1">خێرا:</span>
                    {[
                      { label: '١٠٠٪ (تەواو / بێ کەتکردن)', val: 1.0 },
                      { label: '١١٥٪', val: 1.15 },
                      { label: '١٢٥٪', val: 1.25 },
                      { label: '١٢٨٪', val: 1.28 },
                      { label: '١٣٥٪', val: 1.35 },
                      { label: '١٥٠٪', val: 1.50 },
                      { label: '١٦٥٪', val: 1.65 }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setZoomScaleRatio(item.val)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                          Math.abs(zoomScaleRatio - item.val) < 0.01
                            ? 'bg-teal-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stage 3: Final Full View Duration */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <Scan className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">
                          {t.stage3TimeLabel || 'قۆناغی ٣: نیشاندانی تەواوی کۆتایی پێش مۆدێلی دواتر'}
                        </label>
                        <span className="text-[10px] text-slate-500 block">
                          {t.stage3TimeDesc || 'چرکەی نیشاندانی وێنەکە دوای زووم پێش تێپەڕین بۆ مۆدێلی داهاتوو'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-rose-200 text-rose-600 font-extrabold text-xs rounded-xl shadow-xs shrink-0">
                      {stage3Time} {t.seconds}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      value={stage3Time}
                      onChange={(e) => setStage3Time(parseFloat(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      min="1"
                      max="30"
                      step="0.5"
                      value={stage3Time}
                      onChange={(e) => setStage3Time(parseFloat(e.target.value) || 1)}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 shadow-2xs"
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium me-1">خێرا:</span>
                    {[2, 3, 4, 5, 6].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStage3Time(val)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                          stage3Time === val 
                            ? 'bg-rose-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {val} {t.seconds}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transition Duration (Morph Speed) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <MoveRight className="w-4 h-4 rtl:rotate-180" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">
                          {t.transitionTimeLabel}
                        </label>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-blue-200 text-blue-600 font-extrabold text-xs rounded-xl shadow-xs shrink-0">
                      {transitionTime} {t.seconds}
                    </span>
                  </div>

                  {/* Range Slider & Synced Number */}
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="0.2"
                      max="4.0"
                      step="0.1"
                      value={transitionTime}
                      onChange={(e) => setTransitionTime(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      min="0.2"
                      max="10"
                      step="0.1"
                      value={transitionTime}
                      onChange={(e) => setTransitionTime(parseFloat(e.target.value) || 0.2)}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 shadow-2xs"
                    />
                  </div>

                  {/* Presets */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium me-1">خێرا:</span>
                    {[0.5, 0.8, 1.0, 1.5, 2.0].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTransitionTime(val)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                          transitionTime === val 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {val} {t.seconds}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shimmer Wave Cycle */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">
                          {t.shimmerTimeLabel}
                        </label>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-amber-200 text-amber-600 font-extrabold text-xs rounded-xl shadow-xs shrink-0">
                      {shimmerTime} {t.seconds}
                    </span>
                  </div>

                  {/* Range Slider & Synced Number */}
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="2"
                      max="25"
                      step="0.5"
                      value={shimmerTime}
                      onChange={(e) => setShimmerTime(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      min="2"
                      max="60"
                      step="0.5"
                      value={shimmerTime}
                      onChange={(e) => setShimmerTime(parseFloat(e.target.value) || 2)}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 shadow-2xs"
                    />
                  </div>

                  {/* Presets */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium me-1">خێرا:</span>
                    {[4, 5, 7, 10, 15, 20].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setShimmerTime(val)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                          shimmerTime === val 
                            ? 'bg-amber-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {val} {t.seconds}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {settingsTab === 'colors' && (
              <div className="space-y-4">
                {/* Description Box */}
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl text-xs text-amber-900 leading-relaxed shadow-2xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                    <Palette className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ڕەنگەکانی چاپی ئەلبوم (بەپێی کەتەگۆری و جۆری کاڵا)</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    هەر کەتەگۆرییەک کە دیاری دەکرێت، بەرگی چاپ و چوارچێوەی لاپەڕەکانی بەم ڕەنگە چاپ دەبێت تاکو ئەلبوومی ئاوت لێتی نووستن لە ئاوت لێتی دانیشتن جیا بکرێتەوە.
                  </p>
                </div>

                {/* Section 1: Category Colors */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>ڕەنگی کەتەگۆرییەکان (Categories)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCategoryColors({});
                      }}
                      className="text-[10px] text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-100 transition-colors"
                      title="گەڕاندنەوە بۆ پێشنیارە بنەڕەتییەکان"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>ڕەنگە بنەڕەتییەکان</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pe-1">
                    {categories.map((c) => {
                      const catColor = customCategoryColors[c.id] || getCategoryColor(c, {});
                      return (
                        <div key={c.id} className="p-2.5 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <label 
                              className="w-7 h-7 rounded-xl cursor-pointer shrink-0 shadow-xs border-2 border-white ring-1 ring-slate-300 relative overflow-hidden transition-transform hover:scale-110"
                              style={{ backgroundColor: catColor }}
                              title="کلیک بکە بۆ هەڵبژاردنی هەر ڕەنگێک"
                            >
                              <input
                                type="color"
                                value={catColor}
                                onChange={(e) => setCustomCategoryColors({ ...customCategoryColors, [c.id]: e.target.value })}
                                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                              />
                            </label>
                            <div className="truncate">
                              <span className="font-bold text-slate-900 text-xs block truncate">{c.name_ku || c.name || c.name_en}</span>
                              {c.name_en && (
                                <span className="text-[10px] text-slate-400 font-sans block truncate">{c.name_en}</span>
                              )}
                            </div>
                          </div>

                          {/* Palette presets */}
                          <div className="flex items-center gap-1">
                            {CATEGORY_COLOR_PALETTE.slice(0, 6).map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => setCustomCategoryColors({ ...customCategoryColors, [c.id]: hex })}
                                className={`w-3.5 h-3.5 rounded-full transition-transform hover:scale-125 ${catColor.toLowerCase() === hex.toLowerCase() ? 'ring-2 ring-slate-900 scale-110' : 'opacity-70 hover:opacity-100'}`}
                                style={{ backgroundColor: hex }}
                                title={hex}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Status Colors (ئاوتلێت، ستۆک، یەدەگ) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900">
                    <span>ڕەنگی باج و جۆری کاڵاکان (Status Badges)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {['ئاوتلێت', 'ستۆک', 'یەدەگ'].map((statusKey) => {
                      const defaultHex = statusKey === 'ئاوتلێت' ? '#dc2626' : statusKey === 'ستۆک' ? '#9333ea' : '#2563eb';
                      const activeColor = customStatusColors[statusKey] || defaultHex;
                      return (
                        <div key={statusKey} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <label 
                              className="w-6 h-6 rounded-lg cursor-pointer shrink-0 shadow-xs border border-white ring-1 ring-slate-300 relative overflow-hidden transition-transform hover:scale-110"
                              style={{ backgroundColor: activeColor }}
                            >
                              <input
                                type="color"
                                value={activeColor}
                                onChange={(e) => setCustomStatusColors({ ...customStatusColors, [statusKey]: e.target.value })}
                                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                              />
                            </label>
                            <span className="font-bold text-xs text-slate-800">{statusKey}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'logo' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  {t.websiteLogo} (Upload or URL)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl text-xs font-bold text-slate-600 hover:text-red-600 transition-colors bg-white">
                    <Upload className="w-4 h-4" />
                    <span>{logoFile ? logoFile.name : t.uploadImage}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                          setLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {(logoPreview || logoUrl) && (
                    <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      <img
                        src={logoPreview || logoUrl}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => {
                    setLogoUrl(e.target.value);
                    setLogoPreview(e.target.value);
                  }}
                  placeholder="https://... یان بەتاڵی جێبێڵە بۆ لۆگۆی بنەڕەت"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-600 bg-white"
                />

                {/* Logo Subtitle (وەک SULAIMANIYAH) */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نۆت / دەقی ژێر لۆگۆ (وەک SULAIMANIYAH)
                  </label>
                  <input
                    type="text"
                    value={logoSubtitle}
                    onChange={(e) => setLogoSubtitle(e.target.value)}
                    placeholder="SULAIMANIYAH"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    ئەم دەقە بە جوانی لە ژێر لۆگۆی ئاشڵی لەسەر پەڕەی پرێنت و ئەلبوم دەردەکەوێت.
                  </p>
                </div>

                {/* Currency Choice ($ vs د.ع) */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    دراوی سیستەم (Currency)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrencyChoice('USD')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        currencyChoice === 'USD'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>$ دۆلاری ئەمریکی (USD)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrencyChoice('IQD')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        currencyChoice === 'IQD'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>د.ع دیناری عێراقی (IQD)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions: Save Settings */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{t.save}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
