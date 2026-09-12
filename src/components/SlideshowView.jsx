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
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  Download,
  FolderArchive,
  FileText
} from 'lucide-react';
import { downloadAllImagesAsZip, downloadModelImage } from '../services/imageExportService';

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
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [showZenUnlock, setShowZenUnlock] = useState(false);
  const zenUnlockTimer = useRef(null);
  const hideControlsTimer = useRef(null);
  const containerRef = useRef(null);
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, text: '' });

  // Download all slideshow images in a ZIP named after each model
  const handleDownloadAllImages = async () => {
    setIsExportingImages(true);
    setExportProgress({ current: 0, total: 0, text: 'ئامادەکاری...' });
    try {
      const targetList = filteredModels.length > 0 ? filteredModels : models;
      const count = await downloadAllImagesAsZip(targetList, (current, total) => {
        setExportProgress({ current, total, text: `${current} / ${total}` });
      });
      alert(`بە سەرکەوتوویی ${count} وێنە لە ناو فایلی ZIP بە ناوی مۆدێلەکان خەزن کرا!`);
    } catch (err) {
      alert(err.message || 'هەڵەیەک ڕوویدا لە کاتی داگرتنی وێنەکان');
    } finally {
      setIsExportingImages(false);
    }
  };

  // Screen interaction handler: shows lock button temporarily in Zen mode
  const handleScreenInteraction = () => {
    if (zenMode) {
      setShowZenUnlock(true);
      if (zenUnlockTimer.current) clearTimeout(zenUnlockTimer.current);
      zenUnlockTimer.current = setTimeout(() => {
        setShowZenUnlock(false);
      }, 3800);
      return;
    }
    resetControlsVisibility();
  };

  // Auto-hide controls in Ambient / Zen mode, fullscreen, or during autoplay
  const resetControlsVisibility = () => {
    if (zenMode) {
      handleScreenInteraction();
      return;
    }

    setIsControlsVisible(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (isPlaying || isFullscreen) {
      hideControlsTimer.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3800);
    }
  };

  useEffect(() => {
    if (zenMode) {
      setIsControlsVisible(false);
      setShowZenUnlock(false);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      if (zenUnlockTimer.current) clearTimeout(zenUnlockTimer.current);
    } else {
      setShowZenUnlock(false);
      resetControlsVisibility();
    }
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      if (zenUnlockTimer.current) clearTimeout(zenUnlockTimer.current);
    };
  }, [isPlaying, isFullscreen, zenMode]);

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
  const stage1Time = Math.max(0.5, parseFloat(settings?.stage1Time) || 3.0);
  const zoomMotionTime = Math.max(0.5, parseFloat(settings?.zoomMotionTime) || 5.0);
  const stage3Time = Math.max(0.5, parseFloat(settings?.stage3Time) || 4.0);
  const zoomScaleRatio = Math.max(1.05, Math.min(2.5, parseFloat(settings?.zoomScaleRatio) || 1.28));
  const dwellTime = stage1Time + zoomMotionTime + stage3Time;
  const transitionTime = Math.max(0.1, parseFloat(settings?.slideshowTransitionTime) || 1.0);
  const shimmerTime = Math.max(1, parseFloat(settings?.slideshowShimmerTime) || 7.0);

  // 3-Stage Cinematic Presentation State: 1 = Initial Full, 2 = Pan & Zoom across details, 3 = Ending Full
  const [cinemaStage, setCinemaStage] = useState(1);

  // Multi-touch Pinch to Zoom & Pan State (up to 4.5x)
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPinchingRef = useRef(false);
  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);
  const initialPanOffsetRef = useRef({ x: 0, y: 0 });
  const singleTouchStartRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef(0);

  // Preload adjacent images off the main thread to eliminate stutter on Next / Prev
  useEffect(() => {
    if (!filteredModels.length) return;
    const nextIdx1 = (currentIndex + 1) % filteredModels.length;
    const nextIdx2 = (currentIndex + 2) % filteredModels.length;
    const prevIdx = (currentIndex - 1 + filteredModels.length) % filteredModels.length;

    [nextIdx1, nextIdx2, prevIdx].forEach((idx) => {
      const src = filteredModels[idx]?.image;
      if (src) {
        const img = new Image();
        img.src = src;
        if (img.decode) {
          img.decode().catch(() => {});
        }
      }
    });
  }, [currentIndex, filteredModels]);

  // 3-Stage presentation timeline runner
  useEffect(() => {
    // Reset manual zoom and cinema stage on slide change
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setCinemaStage(1);

    const t1 = setTimeout(() => {
      setCinemaStage(2);
    }, stage1Time * 1000);

    const t2 = setTimeout(() => {
      setCinemaStage(3);
    }, (stage1Time + zoomMotionTime) * 1000);

    let nextTimer;
    if (isPlaying && filteredModels.length > 1) {
      nextTimer = setTimeout(() => {
        // Advance only if user isn't actively inspecting the photo with pinch zoom
        if (zoomScale <= 1.05) {
          goToNext();
        }
      }, dwellTime * 1000);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (nextTimer) clearTimeout(nextTimer);
    };
  }, [currentIndex, isPlaying, stage1Time, zoomMotionTime, stage3Time, dwellTime, filteredModels.length]);

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

  // Multi-Touch Start: 2-finger pinch or 1-finger swipe / pan
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialDistanceRef.current = dist;
      initialScaleRef.current = zoomScale;
      initialPanOffsetRef.current = { ...panOffset };
    } else if (e.touches.length === 1) {
      singleTouchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      initialPanOffsetRef.current = { ...panOffset };

      // Double-tap detection: reset zoom or zoom in to 2.5x
      const now = Date.now();
      if (now - lastTapRef.current < 320) {
        if (zoomScale > 1.05) {
          setZoomScale(1);
          setPanOffset({ x: 0, y: 0 });
        } else {
          setZoomScale(2.5);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
    }
  };

  // Multi-Touch Move: handles continuous pinch scaling or pan
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && isPinchingRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (initialDistanceRef.current > 0) {
        const factor = dist / initialDistanceRef.current;
        const newScale = Math.min(4.5, Math.max(1, initialScaleRef.current * factor));
        setZoomScale(newScale);
      }
    } else if (e.touches.length === 1 && zoomScale > 1.05) {
      const deltaX = e.touches[0].clientX - singleTouchStartRef.current.x;
      const deltaY = e.touches[0].clientY - singleTouchStartRef.current.y;
      const maxPanX = (window.innerWidth * (zoomScale - 1)) / 2;
      const maxPanY = (window.innerHeight * (zoomScale - 1)) / 2;
      setPanOffset({
        x: Math.min(maxPanX, Math.max(-maxPanX, initialPanOffsetRef.current.x + deltaX)),
        y: Math.min(maxPanY, Math.max(-maxPanY, initialPanOffsetRef.current.y + deltaY))
      });
    }
  };

  // Multi-Touch End: handles pinch release or swipe navigation
  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      if (isPinchingRef.current) {
        isPinchingRef.current = false;
        if (zoomScale < 1.05) {
          setZoomScale(1);
          setPanOffset({ x: 0, y: 0 });
        }
        return;
      }

      if (zoomScale <= 1.05 && singleTouchStartRef.current) {
        const touch = e.changedTouches[0];
        const deltaX = singleTouchStartRef.current.x - touch.clientX;
        const deltaY = singleTouchStartRef.current.y - touch.clientY;

        if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) {
            goToNext();
          } else {
            goToPrev();
          }
        }
      }
    }
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
        isFullscreen || zenMode
          ? 'fixed inset-0 z-50 h-screen w-screen bg-black p-0' 
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

            {/* Bulk Download All Images Button in Drawer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50/90 shrink-0">
              <button
                onClick={handleDownloadAllImages}
                disabled={isExportingImages}
                className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                title="خەزنکردنی هەموو وێنەکانی کەتەلۆگ لە ناو یەک فایلی ZIP"
              >
                {isExportingImages ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FolderArchive className="w-4 h-4" />
                )}
                <span>{isExportingImages ? exportProgress.text : 'خەزنکردنی هەموو وێنەکان (ZIP)'}</span>
              </button>
            </div>

          </aside>
        </div>
      )}

      {/* 2. FULLSCREEN HERO MODEL & BOTTOM INFO BAR (مۆدێلە گەورەکە بە ستایلی مۆرف) */}
      <main className={`flex-1 overflow-hidden flex flex-col relative transition-all ${
        isFullscreen || zenMode
          ? 'bg-black border-0 rounded-none' 
          : 'bg-white border border-slate-200 rounded-2xl shadow-xs'
      }`}>
        
        {activeModel ? (
          <div className="flex-1 flex flex-col h-full relative">
            
            {/* In Zen Mode: Lock Button that is completely HIDDEN until the screen is touched/tapped */}
            {zenMode && (
              <div 
                className={`absolute top-4 end-4 z-40 transition-all duration-300 transform ${
                  showZenUnlock 
                    ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                    : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZenMode(false);
                    setShowZenUnlock(false);
                    setIsControlsVisible(true);
                  }}
                  className="flex items-center gap-2.5 px-4 py-2 bg-black/85 hover:bg-black text-white rounded-2xl backdrop-blur-xl border border-white/25 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                  title="کرتە بکە بۆ کردنەوەی قفڵ و گەڕانەوە بۆ دۆخی ئاسایی"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-start">
                    <div className="text-xs font-black text-white flex items-center gap-1.5 leading-tight">
                      <span>کردنەوەی قفڵ</span>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">دۆخی ئاسایی</span>
                    </div>
                    <div className="text-[11px] text-amber-300 font-bold leading-tight mt-0.5">
                      outlet کۆتا دانە
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Top Toolbar Overlay: Filter Button, Ashley Logo Badge, Controls & Fullscreen */}
            <div className={`absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none transition-all duration-500 ${
              !zenMode && isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}>
              
              <div className={`flex items-center gap-2 ${!zenMode && isControlsVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                {/* Small Filter Button (کە کلیک لەسەری کرا فلتەر و شت دەکرێتەوە) */}
                <button
                  onClick={() => {
                    setIsFilterOpen(true);
                    resetControlsVisibility();
                  }}
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

              {/* Controls (Play/Pause, Fullscreen, Print, Zen Mode) */}
              <div className={`flex items-center gap-1.5 ${!zenMode && isControlsVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                
                {/* Ambient / Zen Mode Toggle (Showroom luxury mode) */}
                <button
                  onClick={() => {
                    setZenMode(true);
                    setIsControlsVisible(false);
                    setShowZenUnlock(false);
                    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
                  }}
                  className={`p-2 rounded-xl shadow-md backdrop-blur-md transition-all cursor-pointer ${
                    isFullscreen
                      ? 'bg-slate-900/90 text-white border border-white/15 hover:bg-slate-800'
                      : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'
                  }`}
                  title="دۆخی قفڵ و بێدەنگ (outlet کۆتا دانە)"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                </button>

                {/* Auto Play / Pause */}
                <button
                  onClick={() => {
                    setIsPlaying(!isPlaying);
                    resetControlsVisibility();
                  }}
                  className={`p-2 rounded-xl shadow-md backdrop-blur-md transition-all cursor-pointer ${
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
                  onClick={() => {
                    toggleFullscreen();
                    resetControlsVisibility();
                  }}
                  className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-md backdrop-blur-md transition-all cursor-pointer"
                  title="Full Screen / فوول سکرین"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                {/* Direct Print A4 button */}
                <button
                  onClick={() => onPrintSingle(activeModel)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-red-500" />
                  <span>{t.print}</span>
                </button>

                {/* Download Current Model Image */}
                {activeModel?.image && (
                  <button
                    onClick={() => downloadModelImage(activeModel)}
                    className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-purple-600 border border-slate-200 shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                    title="داگرتنی ئەم وێنەیە بە ناوی مۆدێل"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}

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
              onClick={handleScreenInteraction}
              onMouseMove={() => {
                if (!zenMode) resetControlsVisibility();
              }}
              className={`flex-1 relative flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer ${
                zenMode ? 'p-0' : 'p-1 sm:p-2.5'
              }`}
              onTouchStart={(e) => {
                handleTouchStart(e);
                handleScreenInteraction();
              }}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              
              {/* Floating Touchscreen Zoom Indicator & Reset Button */}
              {zoomScale > 1.05 && (
                <div className="absolute top-14 sm:top-16 start-1/2 -translate-x-1/2 z-40 bg-black/85 backdrop-blur-xl text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-3 border border-white/20 shadow-2xl pointer-events-auto animate-fadeIn">
                  <span className="text-amber-400 font-mono">🔍 {zoomScale.toFixed(1)}x</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomScale(1);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className="bg-white/20 hover:bg-white/30 active:scale-95 text-[11px] px-2.5 py-0.5 rounded-full font-bold transition-all cursor-pointer"
                  >
                    دووجار کرتە / ئاسایی
                  </button>
                </div>
              )}

              {/* Frosted Glass Frame with Dynamic CSS Variables */}
              <div 
                className={`w-full h-full flex items-center justify-center relative overflow-hidden ${
                  zenMode ? 'p-0 bg-transparent border-0' : 'glass-image-frame p-1.5 sm:p-3'
                }`}
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

                {/* Luxury Ambient Glow in Zen Mode & Fullscreen (GPU-optimized for butter smooth 60fps) */}
                {(zenMode || isFullscreen) && activeModel?.image && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-25 scale-110 pointer-events-none transition-opacity duration-700 -z-0 gpu-layer"
                    style={{ backgroundImage: `url(${activeModel.image})` }}
                  />
                )}

                {/* Morph Container with separation of slide entry vs internal camera motion */}
                {activeModel.image ? (
                  <div
                    key={activeModel.id}
                    style={{ animationDuration: `${transitionTime}s` }}
                    className="animate-morph-image w-full h-full flex items-center justify-center relative overflow-hidden gpu-layer"
                  >
                    <img
                      src={activeModel.image}
                      alt={activeModel.name}
                      style={
                        zoomScale > 1.05
                          ? {
                              transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomScale})`,
                              transition: isPinchingRef.current ? 'none' : 'transform 0.15s ease-out'
                            }
                          : cinemaStage === 2
                          ? {
                              '--stage-zoom-scale': zoomScaleRatio,
                              animation: `cinematicCameraPan ${zoomMotionTime}s cubic-bezier(0.4, 0, 0.2, 1) forwards`
                            }
                          : cinemaStage === 3
                          ? {
                              transform: 'scale(1) translate3d(0, 0, 0)',
                              transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
                            }
                          : {
                              transform: 'scale(1) translate3d(0, 0, 0)',
                              transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                            }
                      }
                      className={`z-10 select-none transition-all gpu-layer ${
                        isFullscreen || zenMode ? '' : 'drop-shadow-xl'
                      } ${
                        zenMode || isFullscreen
                          ? 'w-full h-full max-h-screen max-w-full object-contain p-2 sm:p-4'
                          : 'max-h-[88vh] max-w-full w-auto h-auto object-contain'
                      }`}
                      draggable={false}
                    />
                  </div>
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
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                  resetControlsVisibility();
                }}
                className={`absolute start-3 sm:start-5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl border border-slate-200/80 backdrop-blur-md flex items-center justify-center transition-all duration-500 active:scale-90 hover:scale-105 z-20 touch-manipulation cursor-pointer ${
                  !zenMode && isControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                title={t.previous}
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 rtl:rotate-180" />
              </button>

              {/* Next Arrow (Touch-friendly 44px+ hit area for iPad & tablets) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                  resetControlsVisibility();
                }}
                className={`absolute end-3 sm:end-5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl border border-slate-200/80 backdrop-blur-md flex items-center justify-center transition-all duration-500 active:scale-90 hover:scale-105 z-20 touch-manipulation cursor-pointer ${
                  !zenMode && isControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                title={t.next}
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 rtl:rotate-180" />
              </button>

              {/* Touch & Tablet Interactive Pagination Indicator */}
              {filteredModels.length > 1 && !zenMode && (
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

            {/* Minimal Floating Corner Tag in Locked Zen Mode */}
            {zenMode ? (
              <div className="absolute bottom-4 start-4 z-30 bg-black/85 backdrop-blur-xl border border-white/20 px-4 py-3 rounded-2xl shadow-2xl text-white select-none pointer-events-none animate-fadeIn max-w-sm sm:max-w-xl">
                <div className="flex items-start justify-between gap-3.5">
                  <div>
                    {/* Outlet Last Piece / Stock Badge & Large Discount Badge */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase tracking-wide shadow-xs">
                        <span>ASHLEY OUTLET</span>
                        <span>•</span>
                        <span className="text-amber-200 font-black">outlet کۆتا دانە</span>
                      </div>

                      {discountPercent > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs sm:text-sm font-black shadow-md border border-white/20">
                          <span>{discountPercent}%</span>
                          <span className="text-[10px] font-bold uppercase">{t.saveDiscount || 'داشکاندن'}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">{activeModel.name}</h3>
                    
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                      <span className="text-red-400 font-bold">{getCategoryName(activeModel.categoryId)}</span>
                      {activeModel.stock > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-300 font-bold">عدد: {activeModel.stock}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-start border-s border-white/20 ps-3.5 ms-1 shrink-0">
                    {activeModel.originalPrice > 0 && activeModel.originalPrice > activeModel.salePrice && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-slate-400 line-through font-medium">
                          {activeModel.originalPrice.toLocaleString()} {t.currency}
                        </span>
                        {discountPercent > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-rose-600 text-white text-[11px] font-black shadow-xs">
                            %{discountPercent}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-lg sm:text-2xl font-black text-red-500 leading-none">
                      {activeModel.salePrice ? activeModel.salePrice.toLocaleString() : '0'} <span className="text-xs font-bold text-white/80">{t.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Notes in Zen Mode (if present) */}
                {activeModel.notes && (
                  <div className="mt-2.5 pt-2 border-t border-white/15">
                    <div className="flex items-start gap-1.5 text-[11px] sm:text-xs leading-relaxed text-slate-200">
                      <span className="text-amber-400 font-black shrink-0 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-400" />
                        <span>{t.notes || 'تێبینی'}:</span>
                      </span>
                      <p className="font-medium whitespace-pre-line text-slate-100/95 leading-relaxed">
                        {activeModel.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Standard BOTTOM INFORMATION BAR (Morph Transition) */
              <div 
                key={activeModel.id}
                style={{ animationDuration: `${transitionTime}s` }}
                className={`animate-morph-content p-3 sm:p-3.5 border-t backdrop-blur-xl shadow-lg shrink-0 transition-all duration-500 ${
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

                    {discountPercent > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs sm:text-sm font-black shadow-md border border-red-500/30">
                        <span>{discountPercent}%</span>
                        <span className="text-[10px] sm:text-xs font-bold uppercase">{t.saveDiscount || 'داشکاندن'}</span>
                      </span>
                    )}

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

                  {/* Notes & Dimensions (Detailed and clear without truncation) */}
                  {activeModel.notes && (
                    <div className={`mt-2 flex items-start gap-2 p-2 rounded-xl text-xs max-w-4xl border transition-colors ${
                      isFullscreen 
                        ? 'bg-white/10 border-white/15 text-slate-100 shadow-sm' 
                        : 'bg-slate-50 border-slate-200/90 text-slate-800'
                    }`}>
                      <span className={`font-black shrink-0 text-[11px] sm:text-xs flex items-center gap-1 ${
                        isFullscreen ? 'text-amber-400' : 'text-red-600'
                      }`}>
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>{t.notes || 'تێبینی'}:</span>
                      </span>
                      <p className="leading-relaxed font-semibold whitespace-pre-line text-[11px] sm:text-xs">
                        {activeModel.notes}
                      </p>
                    </div>
                  )}

                </div>

                {/* Right: Pricing Box in Iraqi Dinar (د.ع) */}
                <div className={`flex items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-s pt-2 sm:pt-0 sm:ps-5 shrink-0 ${
                  isFullscreen ? 'border-white/10' : 'border-slate-200'
                }`}>
                  
                  <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-1">
                    {activeModel.originalPrice > 0 && activeModel.originalPrice > activeModel.salePrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-slate-400 line-through font-semibold">
                          {activeModel.originalPrice.toLocaleString()} {t.currency}
                        </span>
                        {discountPercent > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs sm:text-sm font-black shadow-md border border-red-400/25">
                            <span>{discountPercent}%</span>
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase">{t.saveDiscount || 'داشکاندن'}</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-2xl sm:text-3xl font-black text-red-600 leading-none flex items-baseline gap-1">
                      <span>{activeModel.salePrice ? activeModel.salePrice.toLocaleString() : '0'}</span>
                      <span className="text-xs font-bold text-red-600/80">{t.currency}</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

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
