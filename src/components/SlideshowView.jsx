import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Edit3,
  Maximize2,
  Minimize2,
  Sliders,
  ImageOff,
  X,
  RotateCcw
} from 'lucide-react';

export default function SlideshowView({
  models,
  categories,
  collections,
  t,
  lang,
  isAdmin,
  logoUrl,
  settings = {},
  onPrintSingle,
  onEditModel,
  onOpenSettings,
  initialIndex = 0
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sidebarCategory, setSidebarCategory] = useState('all');
  const [sidebarCollection, setSidebarCollection] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Filter models strictly by Category & Collection
  const filteredModels = models.filter((model) => {
    if (sidebarCategory !== 'all' && model.categoryId !== sidebarCategory) {
      return false;
    }
    if (sidebarCollection !== 'all' && model.collectionId !== sidebarCollection) {
      return false;
    }
    return true;
  });

  // Keep index within bounds when filtering
  useEffect(() => {
    if (currentIndex >= filteredModels.length) {
      setCurrentIndex(0);
    }
  }, [filteredModels.length, currentIndex]);

  const activeModel = filteredModels[currentIndex] || filteredModels[0];

  // Dynamic timing controls (under Admin settings control)
  const dwellTime = Math.max(1, parseFloat(settings?.slideshowDwellTime) || 4.5);
  const transitionTime = Math.max(0.1, parseFloat(settings?.slideshowTransitionTime) || 1.0);
  const shimmerTime = Math.max(1, parseFloat(settings?.slideshowShimmerTime) || 7.0);

  // Auto play timer with admin-controlled dwell time
  useEffect(() => {
    let timer;
    if (isPlaying && filteredModels.length > 1) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredModels.length);
      }, dwellTime * 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, filteredModels.length, dwellTime]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredModels.length]);

  const goToNext = () => {
    if (filteredModels.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % filteredModels.length);
  };

  const goToPrev = () => {
    if (filteredModels.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + filteredModels.length) % filteredModels.length);
  };

  // Touch Swipe Gesture for iPad, Tablets and Mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    // Detect horizontal swipe with minimum threshold
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swiped left (in RTL: next / in LTR: next)
        goToNext();
      } else {
        // Swiped right
        goToPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Fullscreen toggle with iOS/iPadOS Safari fallback
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return '';
    if (lang === 'ku') return cat.name_ku || cat.name;
    if (lang === 'ar') return cat.name_ar || cat.name;
    return cat.name_en || cat.name;
  };

  const getCollectionName = (colId) => {
    const col = collections.find((c) => c.id === colId);
    return col ? col.name : '';
  };

  const relevantCollections = sidebarCategory === 'all'
    ? collections
    : collections.filter((c) => c.categoryId === sidebarCategory);

  const discountPercent = activeModel?.originalPrice && activeModel.originalPrice > activeModel.salePrice
    ? Math.round(((activeModel.originalPrice - activeModel.salePrice) / activeModel.originalPrice) * 100)
    : 0;

  const isOutOfStock = !activeModel?.stock || activeModel.stock <= 0;

  return (
    <div 
      ref={containerRef}
      className={`w-full flex flex-col overflow-hidden no-print select-none transition-all relative ${
        isFullscreen 
          ? 'fixed inset-0 z-50 h-screen w-screen bg-slate-950 p-0' 
          : 'h-[calc(100dvh-54px)] sm:h-[calc(100dvh-60px)] md:h-[calc(100dvh-68px)] bg-slate-100 p-1.5 sm:p-2.5 md:p-3'
      }`}
    >
      
      {/* 1. SLIDE-OVER FILTER & THUMBNAILS DRAWER (دەستە ڕاست / لەسەر داوای بەکارهێنەر) */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden no-print">
          {/* Backdrop Blur */}
          <div 
            onClick={() => setIsFilterOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity cursor-pointer animate-fadeIn"
          />

          {/* Floating Drawer Container on the right side (RTL start / right) */}
          <aside className="absolute inset-y-0 start-0 max-w-full w-80 sm:w-88 bg-white/95 backdrop-blur-2xl border-e border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-slideInRight">
            
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shadow-xs">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">
                    فلتەر و گەڕانی مۆدێلەکان
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {filteredModels.length} مۆدێل لەم بەشەدایە
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                title="داخستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filters Controls */}
            <div className="p-3.5 space-y-2.5 border-b border-slate-100 bg-slate-50/40">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  {t.category}
                </label>
                <select
                  value={sidebarCategory}
                  onChange={(e) => {
                    setSidebarCategory(e.target.value);
                    setSidebarCollection('all');
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-red-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">{t.allCategories}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'ku' ? c.name_ku || c.name : lang === 'ar' ? c.name_ar || c.name : c.name_en || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  {t.collection}
                </label>
                <select
                  value={sidebarCollection}
                  onChange={(e) => setSidebarCollection(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-red-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">{t.allCollections}</option>
                  {relevantCollections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              {(sidebarCategory !== 'all' || sidebarCollection !== 'all') && (
                <button
                  onClick={() => {
                    setSidebarCategory('all');
                    setSidebarCollection('all');
                  }}
                  className="w-full py-1 text-center text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>پاککردنەوەی فلتەرەکان (Reset)</span>
                </button>
              )}
            </div>

            {/* Scrollable Thumbnails List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              {filteredModels.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  {t.noResultsFound}
                </div>
              ) : (
                filteredModels.map((model, idx) => {
                  const isSelected = idx === currentIndex;
                  return (
                    <div
                      key={model.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-red-50 border-2 border-red-500 shadow-xs'
                          : 'hover:bg-slate-50 border border-transparent opacity-85 hover:opacity-100'
                      }`}
                    >
                      {model.image ? (
                        <img
                          src={model.image}
                          alt={model.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex flex-col items-center justify-center text-slate-400 p-0.5">
                          <ImageOff className="w-4 h-4" />
                          <span className="text-[7px] font-bold mt-0.5 leading-none">بێ وێنە</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-red-700' : 'text-slate-800'}`}>
                          {model.name}
                        </h5>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-black text-red-600">
                            {model.salePrice?.toLocaleString()} {t.currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </aside>
        </div>
      )}

      {/* 2. FULLSCREEN HERO MODEL & BOTTOM INFO BAR (مۆدێلە گەورەکە بە ستایلی مۆرف) */}
      <main className={`flex-1 overflow-hidden flex flex-col relative transition-all ${
        isFullscreen 
          ? 'bg-slate-950 border-0 rounded-none' 
          : 'bg-white border border-slate-200 rounded-2xl shadow-xs'
      }`}>
        
        {activeModel ? (
          <div className="flex-1 flex flex-col h-full relative">
            
            {/* Top Toolbar Overlay: Filter Button, Ashley Logo Badge, Controls & Fullscreen */}
            <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
              
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Small Filter Button (کە کلیک لەسەری کرا فلتەر و شت دەکرێتەوە) */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-md text-xs font-bold transition-all backdrop-blur-md active:scale-95 cursor-pointer ${
                    isFullscreen
                      ? 'bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20'
                      : 'bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90'
                  }`}
                  title="فلتەر و لیستی مۆدێلەکان"
                >
                  <Filter className="w-3.5 h-3.5 text-red-600" />
                  <span>فلتەر و مۆدێلەکان</span>
                  {filteredModels.length > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {currentIndex + 1} / {filteredModels.length}
                    </span>
                  )}
                </button>

                {/* Corner Ashley Logo Badge */}
                <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl shadow-xs backdrop-blur-md ${
                  isFullscreen
                    ? 'bg-slate-900/80 border border-white/10 text-white'
                    : 'bg-white/90 border border-slate-200/80 text-slate-900'
                }`}>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Ashley Outlet"
                      className="h-5 max-w-[100px] object-contain rounded"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-linear-to-br from-red-600 to-rose-700 rounded-md flex items-center justify-center text-white font-black text-xs shrink-0">
                      A
                    </div>
                  )}
                  <div className="flex items-center gap-1 leading-none">
                    <span className="font-extrabold text-xs tracking-tight">
                      ASHLEY
                    </span>
                    <span className="bg-red-600 text-white text-[8px] font-bold px-1 py-0.2 rounded-xs uppercase">
                      OUTLET
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls (Play/Pause, Fullscreen, Print) */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                
                {/* Auto Play / Pause */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-2 rounded-xl shadow-md backdrop-blur-md transition-all ${
                    isPlaying 
                      ? 'bg-red-600 text-white shadow-red-500/20' 
                      : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'
                  }`}
                  title={isPlaying ? t.pause : t.autoPlay}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-md backdrop-blur-md transition-all"
                  title="Full Screen / فوول سکرین"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                {/* Direct Print A4 button */}
                <button
                  onClick={() => onPrintSingle(activeModel)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md text-xs font-bold transition-all active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-red-500" />
                  <span>{t.print}</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => onEditModel(activeModel)}
                    className="p-1.5 bg-white hover:bg-slate-50 text-blue-600 rounded-xl border border-slate-200 shadow-sm transition-all"
                    title={t.edit}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                {isAdmin && onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="p-1.5 sm:p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all"
                    title={t.slideshowSettings}
                  >
                    <Sliders className="w-3.5 h-3.5 text-red-600" />
                  </button>
                )}

              </div>

            </div>

            {/* Giant Furniture Image Stage in Frosted Glass with Dynamic Shimmer Sweep */}
            <div 
              className="flex-1 relative flex flex-col items-center justify-center p-2.5 sm:p-4 overflow-hidden touch-pan-y select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              
              {/* Frosted Glass Frame with Dynamic CSS Variables */}
              <div 
                className="glass-image-frame w-full h-full flex items-center justify-center p-3 sm:p-6 relative"
                style={{
                  '--morph-duration': `${transitionTime}s`,
                  '--shimmer-interval': `${shimmerTime}s`
                }}
              >
                
                {/* Dynamic Shimmer Reflection Sweep */}
                <div 
                  className="glass-shimmer-sweep" 
                  style={{ animationDuration: `${shimmerTime}s` }}
                />

                {/* Morph Image or Explicit No Image Banner */}
                {activeModel.image ? (
                  <img
                    key={activeModel.id}
                    src={activeModel.image}
                    alt={activeModel.name}
                    style={{ animationDuration: `${transitionTime}s` }}
                    className="animate-morph-image max-h-full max-w-full object-contain drop-shadow-xl z-10 select-none pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-white/75 backdrop-blur-md rounded-3xl border border-slate-200/90 text-slate-400 shadow-lg z-10 select-none max-w-xs text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400 shadow-inner">
                      <ImageOff className="w-8 h-8" />
                    </div>
                    <span className="text-base font-bold text-slate-700">{t.noImage || 'وێنەی نییە'}</span>
                    <span className="text-xs text-slate-400 mt-1">ئەم مۆدێلە لە ئێستادا وێنەی نییە</span>
                  </div>
                )}
              </div>

              {/* Previous Arrow (Touch-friendly 44px+ hit area for iPad & tablets) */}
              <button
                onClick={goToPrev}
                className="absolute start-3 sm:start-5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl border border-slate-200/80 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 hover:scale-105 z-20 touch-manipulation cursor-pointer"
                title={t.previous}
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 rtl:rotate-180" />
              </button>

              {/* Next Arrow (Touch-friendly 44px+ hit area for iPad & tablets) */}
              <button
                onClick={goToNext}
                className="absolute end-3 sm:end-5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl border border-slate-200/80 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 hover:scale-105 z-20 touch-manipulation cursor-pointer"
                title={t.next}
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 rtl:rotate-180" />
              </button>

              {/* Touch & Tablet Interactive Pagination Indicator */}
              {filteredModels.length > 1 && (
                <div className="absolute bottom-2.5 sm:bottom-3 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
                  <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-auto border border-white/10">
                    {filteredModels.length <= 12 ? (
                      filteredModels.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={`rounded-full transition-all duration-300 cursor-pointer ${
                            idx === currentIndex
                              ? 'w-5 h-2 bg-red-500 shadow-xs'
                              : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                          }`}
                          aria-label={`Slide ${idx + 1}`}
                        />
                      ))
                    ) : (
                      <span className="text-[11px] font-mono font-bold text-white tracking-wider flex items-center gap-1">
                        <span className="text-red-400 font-extrabold">{currentIndex + 1}</span>
                        <span className="text-slate-400">/</span>
                        <span>{filteredModels.length}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM INFORMATION BAR (Morph Transition) */}
            <div 
              key={activeModel.id}
              style={{ animationDuration: `${transitionTime}s` }}
              className={`animate-morph-content p-3 sm:p-3.5 border-t backdrop-blur-xl shadow-lg shrink-0 ${
                isFullscreen 
                  ? 'bg-slate-900/90 border-white/10 text-white' 
                  : 'bg-white/95 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Left: Category, Title, Stock, Notes */}
                <div className="flex-1 min-w-0">
                  
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase mb-0.5">
                    <span>{getCategoryName(activeModel.categoryId)}</span>
                    {getCollectionName(activeModel.collectionId) && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className={isFullscreen ? 'text-slate-300' : 'text-slate-700'}>{getCollectionName(activeModel.collectionId)}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={`text-base sm:text-lg font-black leading-tight ${
                      isFullscreen ? 'text-white' : 'text-slate-900'
                    }`}>
                      {activeModel.name}
                    </h2>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isOutOfStock ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          {t.outOfStock}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          {activeModel.stock} {t.piece}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Notes & Dimensions */}
                  {activeModel.notes && (
                    <p className={`mt-1 text-[11px] sm:text-xs max-w-3xl truncate ${
                      isFullscreen ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {activeModel.notes}
                    </p>
                  )}

                </div>

                {/* Right: Pricing Box in Iraqi Dinar (د.ع) */}
                <div className={`flex items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-s pt-2 sm:pt-0 sm:ps-5 shrink-0 ${
                  isFullscreen ? 'border-white/10' : 'border-slate-200'
                }`}>
                  
                  <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0">
                    {activeModel.originalPrice > 0 && activeModel.originalPrice > activeModel.salePrice && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm text-slate-400 line-through font-semibold">
                          {activeModel.originalPrice.toLocaleString()} {t.currency}
                        </span>
                        {discountPercent > 0 && (
                          <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-sm">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-xl sm:text-2xl font-black text-red-600 leading-none flex items-baseline gap-1">
                      <span>{activeModel.salePrice ? activeModel.salePrice.toLocaleString() : '0'}</span>
                      <span className="text-xs font-bold text-red-600/80">{t.currency}</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            {t.noResultsFound}
          </div>
        )}

      </main>

    </div>
  );
}
