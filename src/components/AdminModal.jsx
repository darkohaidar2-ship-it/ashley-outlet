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
  RotateCcw, 
  Image as ImageIcon,
  ZoomIn,
  Trash2
} from 'lucide-react';
import { catalogService } from '../services/catalogService';

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
  const [dwellTime, setDwellTime] = useState(4.5);
  const [transitionTime, setTransitionTime] = useState(1.0);
  const [shimmerTime, setShimmerTime] = useState(7.0);
  const [uiScale, setUiScale] = useState(0.80);
  const [settingsTab, setSettingsTab] = useState('slideshow'); // 'slideshow' | 'logo'

  useEffect(() => {
    if (editingModel) {
      setModelForm({
        name: editingModel.name || '',
        sku: editingModel.sku || '',
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
        sku: 'ASH-' + Math.floor(1000 + Math.random() * 9000),
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
      if (settings.slideshowDwellTime !== undefined) setDwellTime(Number(settings.slideshowDwellTime));
      if (settings.slideshowTransitionTime !== undefined) setTransitionTime(Number(settings.slideshowTransitionTime));
      if (settings.slideshowShimmerTime !== undefined) setShimmerTime(Number(settings.slideshowShimmerTime));
      if (settings.uiScale !== undefined) setUiScale(Number(settings.uiScale));
      if (settings.logoUrl) {
        setLogoUrl(settings.logoUrl);
        setLogoPreview(settings.logoUrl);
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

  const handleResetDefaults = () => {
    setDwellTime(4.5);
    setTransitionTime(1.0);
    setShimmerTime(7.0);
    setUiScale(0.80);
    document.documentElement.style.setProperty('--ui-scale', '0.80');
    document.documentElement.style.zoom = 0.80;
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
      sku: modelForm.name.trim(),
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
            
            {/* Model Code / Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t.modelName} *
              </label>
              <input
                type="text"
                required
                value={modelForm.name}
                onChange={(e) => setModelForm({ ...modelForm, name: e.target.value, sku: e.target.value })}
                placeholder="B600-54 یان ناوی مۆدێل..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Stock Count */}
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

            {/* List of existing categories with delete button */}
            {categories && categories.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 mb-2">کەتەگۆرییە بەردەستەکان ({categories.length}):</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {categories.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs">
                      <span className="font-bold text-slate-800">{c.name_ku || c.name || c.name_en}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory && onDeleteCategory(c.id)}
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
              
              const payload = {
                logoUrl: finalLogo,
                slideshowDwellTime: Math.max(1, parseFloat(dwellTime) || 4.5),
                slideshowTransitionTime: Math.max(0.1, parseFloat(transitionTime) || 1.0),
                slideshowShimmerTime: Math.max(1, parseFloat(shimmerTime) || 7.0),
                uiScale: Math.max(0.65, Math.min(1.2, parseFloat(uiScale) || 0.80))
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
            {/* Tabs for Slideshow Timing vs Logo */}
            <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
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
                
                {/* 1. Dwell / Hold Time */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">
                          {t.dwellTimeLabel}
                        </label>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {t.dwellTimeDesc}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-red-200 text-red-600 font-extrabold text-xs rounded-xl shadow-xs shrink-0">
                      {dwellTime} {t.seconds}
                    </span>
                  </div>

                  {/* Range Slider & Synced Number */}
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={dwellTime}
                      onChange={(e) => setDwellTime(parseFloat(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      min="1"
                      max="60"
                      step="0.5"
                      value={dwellTime}
                      onChange={(e) => setDwellTime(parseFloat(e.target.value) || 1)}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 shadow-2xs"
                    />
                  </div>

                  {/* Presets */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium me-1">خێرا:</span>
                    {[3, 4.5, 6, 8, 10, 15].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDwellTime(val)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                          dwellTime === val 
                            ? 'bg-red-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {val} {t.seconds}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Transition Duration (Morph Speed) */}
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
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {t.transitionTimeDesc}
                        </p>
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

                {/* 3. Shimmer Wave Cycle */}
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
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {t.shimmerTimeDesc}
                        </p>
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

                {/* 4. UI Scale / Zoom Out (قەبارەی گشتی وێبسایت و تێکست) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">
                          {t.uiScaleLabel}
                        </label>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {t.uiScaleDesc}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-purple-200 text-purple-600 font-extrabold text-xs rounded-xl shadow-xs shrink-0">
                      {Math.round(uiScale * 100)}%
                    </span>
                  </div>

                  {/* Range Slider & Synced Value */}
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="0.70"
                      max="1.00"
                      step="0.05"
                      value={uiScale}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setUiScale(val);
                        document.documentElement.style.setProperty('--ui-scale', val);
                        document.documentElement.style.zoom = val;
                      }}
                      className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <span className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 shadow-2xs">
                      {Math.round(uiScale * 100)}%
                    </span>
                  </div>

                  {/* Presets */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium me-1">خێرا:</span>
                    {[
                      { label: '75% (ئێجگار ورد)', val: 0.75 },
                      { label: '80% (ستانداردی ورد)', val: 0.80 },
                      { label: '85%', val: 0.85 },
                      { label: '90%', val: 0.90 },
                      { label: '100% (ئاسایی)', val: 1.00 }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => {
                          setUiScale(item.val);
                          document.documentElement.style.setProperty('--ui-scale', item.val);
                          document.documentElement.style.zoom = item.val;
                        }}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                          Math.abs(uiScale - item.val) < 0.01 
                            ? 'bg-purple-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
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
              </div>
            )}

            {/* Bottom Actions: Save & Reset Defaults */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                title={t.resetDefaults}
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.resetDefaults}</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
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
