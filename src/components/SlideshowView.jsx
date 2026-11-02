import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  FileText,
  ArrowUpDown,
  Tag,
  MoreHorizontal
} from 'lucide-react';
import { downloadAllImagesAsZip, downloadModelImage } from '../services/imageExportService';
import { getStatusBadgeStyle } from '../utils/statusColors';
import { getOptimizedImageUrl } from '../utils/imageUrl';

export default function SlideshowView({
  models,
  allModels,
  categories,
  collections,
  t,
  lang,
  isAdmin,
  logoUrl,
  settings = {},
  statusColors = {},
  customStatuses = ['ستۆک', 'یەدەگ', 'ئاوتلێت'],
  sortBy = 'name-asc',
  setSortBy,
  onPrintSingle,
  onEditModel,
  onOpenSettings,
  initialIndex = 0
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sidebarCategory, setSidebarCategory] = useState('all');
  const [sidebarCollection, setSidebarCollection] = useState('all');
  const [sidebarStatus, setSidebarStatus] = useState('all');
  const [localSort, setLocalSort] = useState(sortBy || 'name-asc');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const touchStartTimeRef = useRef(0);
  const thumbStripRef = useRef(null);
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

  useEffect(() => {
    if (sortBy) setLocalSort(sortBy);
  }, [sortBy]);

  const handleSortChange = (newSort) => {
    setLocalSort(newSort);
    if (setSortBy) setSortBy(newSort);
    setCurrentIndex(0);
  };

  // Filter & Sort models
  const filteredModels = useMemo(() => {
    const list = models.filter((model) => {
      if (sidebarCategory !== 'all' && model.categoryId !== sidebarCategory) {
        return false;
      }
      if (sidebarCollection !== 'all' && model.collectionId !== sidebarCollection) {
        return false;
      }
      if (sidebarStatus !== 'all') {
        const itemType = model.itemType || (model.sku && model.sku !== model.name ? model.sku : '');
        if (itemType !== sidebarStatus) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (localSort === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '', undefined, { numeric: true, sensitivity: 'base' });
      }
      if (localSort === 'price-asc') {
        const pA = a.salePrice || a.originalPrice || 0;
        const pB = b.salePrice || b.originalPrice || 0;
        return pA - pB;
      }
      if (localSort === 'price-desc') {
        const pA = a.salePrice || a.originalPrice || 0;
        const pB = b.salePrice || b.originalPrice || 0;
        return pB - pA;
      }
      if (localSort === 'discount-desc') {
        const dA = a.originalPrice && a.salePrice && Number(a.salePrice) > 0 && a.originalPrice > a.salePrice ? ((a.originalPrice - a.salePrice) / a.originalPrice) : 0;
        const dB = b.originalPrice && b.salePrice && Number(b.salePrice) > 0 && b.originalPrice > b.salePrice ? ((b.originalPrice - b.salePrice) / b.originalPrice) : 0;
        return dB - dA;
      }
      if (localSort === 'stock-desc') {
        return (b.stock || 0) - (a.stock || 0);
      }
      if (localSort === 'newest') {
        return (b.id || '').localeCompare(a.id || '');
      }
      // Default: 'name-asc' (A to Z)
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [models, sidebarCategory, sidebarCollection, sidebarStatus, localSort]);

  // Keep index within bounds when filtering
  useEffect(() => {
    if (currentIndex >= filteredModels.length) {
      setCurrentIndex(0);
    }
  }, [filteredModels.length, currentIndex]);

  const activeModel = filteredModels[currentIndex] || filteredModels[0];
  const isBF = Boolean(
    (activeModel?.itemType || activeModel?.sku || '').toLowerCase().includes('بلاک فرایدەی') ||
    (activeModel?.itemType || activeModel?.sku || '').toLowerCase().includes('black friday')
  );

  // Dynamic timing controls (under Admin settings control)
  const stage1Time = Math.max(0.5, parseFloat(settings?.stage1Time) || 3.0);
  const zoomMotionTime = Math.max(0.5, parseFloat(settings?.zoomMotionTime) || 5.0);
  const stage3Time = Math.max(0.5, parseFloat(settings?.stage3Time) || 4.0);
  const zoomScaleRatio = settings?.zoomScaleRatio !== undefined 
    ? Math.max(1.0, Math.min(2.5, parseFloat(settings.zoomScaleRatio))) 
    : 1.0;
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
        img.decoding = 'async';
        img.src = getOptimizedImageUrl(src, 'hero');
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
      touchStartTimeRef.current = Date.now();
      setDragX(0);
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
    } else if (e.touches.length === 1 && zoomScale <= 1.05) {
      // Live feedback: the picture follows the finger while swiping
      const dx = e.touches[0].clientX - singleTouchStartRef.current.x;
      const dy = e.touches[0].clientY - singleTouchStartRef.current.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) setDragX(dx * 0.55);
    }
  };

  // Multi-Touch End: handles pinch release or swipe navigation
  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      setDragX(0);
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

        const quickFlick = Date.now() - touchStartTimeRef.current < 280 && Math.abs(deltaX) > 24;
        if ((Math.abs(deltaX) > 45 || quickFlick) && Math.abs(deltaX) > Math.abs(deltaY)) {
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

  const discountPercent = activeModel?.originalPrice && activeModel?.salePrice && Number(activeModel.salePrice) > 0 && Number(activeModel.originalPrice) > Number(activeModel.salePrice)
    ? Math.round(((Number(activeModel.originalPrice) - Number(activeModel.salePrice)) / Number(activeModel.originalPrice)) * 100)
    : 0;

  const isOutOfStock = !activeModel?.stock || activeModel.stock <= 0;
  const ghostBtn = isFullscreen
    ? 'bg-slate-900/90 text-white border border-white/15 hover:bg-slate-800'
    : 'bg-white/95 text-slate-800 hover:bg-white border border-slate-200';

  // Price logic: a model without a real discount shows ONE normal price (never a big "0")
  const priceOriginal = Number(activeModel?.originalPrice) || 0;
  const priceSale = Number(activeModel?.salePrice) || 0;
  const hasDiscountPrice = priceSale > 0 && priceOriginal > priceSale;
  const mainPrice = hasDiscountPrice ? priceSale : (priceOriginal > 0 ? priceOriginal : priceSale);

  // Thumbnail strip: only a window around the current slide is rendered (fast with hundreds of models)
  const stripItems = useMemo(() => {
    const start = Math.max(0, currentIndex - 20);
    const end = Math.min(filteredModels.length, currentIndex + 21);
    return filteredModels.slice(start, end).map((m, i) => ({ m, idx: start + i }));
  }, [filteredModels, currentIndex]);

  useEffect(() => {
    const el = thumbStripRef.current?.querySelector('[data-active="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [currentIndex, filteredModels.length]);

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
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
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
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
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
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">{t.allCollections}</option>
                  {relevantCollections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>دۆخی کاڵا</span>
                </label>
                <select
                  value={sidebarStatus}
                  onChange={(e) => {
                    setSidebarStatus(e.target.value);
                    setCurrentIndex(0);
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">هەموو دۆخەکان ({models.length})</option>
                  {customStatuses.map((st) => {
                    const count = models.filter(m => (m.itemType || (m.sku && m.sku !== m.name ? m.sku : '')) === st).length;
                    return (
                      <option key={st} value={st}>
                        {st} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  {t.sortBy || 'ڕیزبەندی / سۆرت'}
                </label>
                <select
                  value={localSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="name-asc">{t.sortAZ || 'A ➔ Z (ئەلفوبێ)'}</option>
                  <option value="name-desc">{t.sortZA || 'Z ➔ A (پێچەوانە)'}</option>
                  <option value="price-asc">{t.sortPriceLow || 'نرخ: کەم بۆ زۆر'}</option>
                  <option value="price-desc">{t.sortPriceHigh || 'نرخ: زۆر بۆ کەم'}</option>
                  <option value="discount-desc">{t.sortDiscount || 'بەرزترین داشکاندن'}</option>
                  <option value="stock-desc">{t.sortStock || 'زۆرترین عدد'}</option>
                  <option value="newest">{t.sortNewest || 'نوێترین'}</option>
                </select>
              </div>

              {(sidebarCategory !== 'all' || sidebarCollection !== 'all' || sidebarStatus !== 'all' || localSort !== 'name-asc') && (
                <button
                  onClick={() => {
                    setSidebarCategory('all');
                    setSidebarCollection('all');
                    setSidebarStatus('all');
                    handleSortChange('name-asc');
                  }}
                  className="w-full py-1 text-center text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
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
                          ? 'bg-blue-50 border-2 border-blue-500 shadow-xs'
                          : 'hover:bg-slate-50 border border-transparent opacity-85 hover:opacity-100'
                      }`}
                    >
                      {model.image ? (
                        <img
                          src={getOptimizedImageUrl(model.image, 'thumb')}
                          alt={model.name}
                          decoding="async"
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex flex-col items-center justify-center text-slate-400 p-0.5">
                          <ImageOff className="w-4 h-4" />
                          <span className="text-[7px] font-bold mt-0.5 leading-none">بێ وێنە</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                          {model.name}
                        </h5>
                        <div className="flex items-center justify-between mt-1 gap-1 flex-wrap">
                          <span className="text-xs font-black text-slate-900">
                            {(() => {
                              const so = Number(model.salePrice) || 0;
                              const oo = Number(model.originalPrice) || 0;
                              const pr = so > 0 && oo > so ? so : (oo > 0 ? oo : so);
                              return pr > 0 ? `${pr.toLocaleString()} ${t.currency}` : '—';
                            })()}
                          </span>
                          {model.itemType && (
                            <span 
                              className="text-[9px] font-black px-1.5 py-0.2 rounded shadow-2xs"
                              style={getStatusBadgeStyle(model.itemType, statusColors)}
                            >
                              {model.itemType}
                            </span>
                          )}
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
          ? (isBF ? 'bg-[#09090c] border-0 rounded-none' : 'bg-black border-0 rounded-none')
          : (isBF ? 'bg-gradient-to-b from-[#16161d] to-[#0c0c10] border-2 border-orange-500/40 rounded-2xl shadow-2xl ring-1 ring-amber-400/20' : 'bg-white border border-slate-200 rounded-2xl shadow-xs')
      }`}>
        
        {/* Autoplay progress: fills over the time this slide stays on screen */}
        {isPlaying && !zenMode && filteredModels.length > 1 && (
          <div className="absolute top-0 inset-x-0 h-1 z-30 bg-slate-900/5 overflow-hidden pointer-events-none">
            <div
              key={`${currentIndex}-${dwellTime}`}
              className={`h-full ${isBF ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400' : 'bg-blue-600'} origin-left rtl:origin-right`}
              style={{ animation: `slideProgress ${dwellTime}s linear forwards` }}
            />
          </div>
        )}

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
                  <div className={`w-8 h-8 rounded-xl ${isBF ? 'bg-orange-500 text-black' : 'bg-blue-600 text-white'} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-start">
                    <div className="text-xs font-black text-white flex items-center gap-1.5 leading-tight">
                      <span>کردنەوەی قفڵ</span>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">دۆخی ئاسایی</span>
                    </div>
                    <div className={`text-[11px] font-bold leading-tight mt-0.5 ${isBF ? 'text-orange-400' : 'text-amber-300'}`}>
                      {isBF ? '🔥 VIP BLACK FRIDAY' : 'outlet کۆتا دانە'}
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
                    isBF
                      ? 'bg-neutral-950/90 hover:bg-neutral-900 text-white border border-orange-500/40 ring-1 ring-amber-400/30'
                      : isFullscreen
                      ? 'bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20'
                      : 'bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90'
                  }`}
                  title="فلتەر و لیستی مۆدێلەکان"
                >
                  <Filter className={`w-3.5 h-3.5 ${isBF ? 'text-orange-400' : 'text-blue-600'}`} />
                  <span>فلتەر و مۆدێلەکان</span>
                  {filteredModels.length > 0 && (
                    <span className={`${isBF ? 'bg-orange-500 text-black' : 'bg-blue-600 text-white'} text-[10px] font-black px-1.5 py-0.2 rounded-full`}>
                      {currentIndex + 1} / {filteredModels.length}
                    </span>
                  )}
                </button>

                {/* Corner Ashley Logo Badge */}
                {isBF ? (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-xl bg-neutral-950/90 border border-orange-500/50 ring-1 ring-amber-400/40 text-white">
                    <span className="text-xs">👑</span>
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="font-extrabold text-xs tracking-tight text-white">
                        ASHLEY
                      </span>
                      <span className="animate-gold-shimmer text-black text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider">
                        VIP BLACK FRIDAY
                      </span>
                    </div>
                  </div>
                ) : (
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
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md flex items-center justify-center text-white font-black text-xs shrink-0">
                        A
                      </div>
                    )}
                    <div className="flex items-center gap-1 leading-none">
                      <span className="font-extrabold text-xs tracking-tight">
                        ASHLEY
                      </span>
                      <span className="bg-blue-600 text-white text-[8px] font-bold px-1 py-0.2 rounded-xs uppercase">
                        OUTLET
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls: Play / Fullscreen / Print + "More" menu */}
              <div className={`flex items-center gap-1.5 ${!zenMode && isControlsVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>

                <button
                  onClick={() => {
                    setIsPlaying(!isPlaying);
                    resetControlsVisibility();
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-md backdrop-blur-md transition-all cursor-pointer text-xs font-bold ${
                    isPlaying ? 'bg-blue-600 text-white' : ghostBtn
                  }`}
                  title={isPlaying ? t.pause : t.autoPlay}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="hidden md:inline">{isPlaying ? t.pause : t.autoPlay}</span>
                </button>

                <button
                  onClick={() => {
                    toggleFullscreen();
                    resetControlsVisibility();
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-md backdrop-blur-md transition-all cursor-pointer text-xs font-bold ${ghostBtn}`}
                  title="Full Screen / فوول سکرین"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span className="hidden md:inline">{isFullscreen ? 'بچووککردنەوە' : 'شاشەی تەواو'}</span>
                </button>

                <button
                  onClick={() => onPrintSingle(activeModel)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95 cursor-pointer text-xs font-bold"
                  title="چاپکردن (PRINT)"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden md:inline">چاپ</span>
                </button>

                {/* More: lock mode, download picture, edit, settings */}
                <div className="relative">
                  <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={`p-2 rounded-xl shadow-md backdrop-blur-md transition-all cursor-pointer ${ghostBtn}`}
                    title="زیاتر"
                    aria-label="More"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isMoreOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMoreOpen(false)} />
                      <div className="absolute end-0 top-full mt-2 w-60 z-50 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-1.5">
                        <button
                          onClick={() => {
                            setIsMoreOpen(false);
                            setZenMode(true);
                            setIsControlsVisible(false);
                            setShowZenUnlock(false);
                            if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-[13px] font-semibold text-start cursor-pointer"
                        >
                          <Lock className="w-4 h-4 text-amber-500" />
                          <span>دۆخی قفڵ و بێدەنگ</span>
                        </button>

                        {activeModel?.image && (
                          <button
                            onClick={() => {
                              setIsMoreOpen(false);
                              downloadModelImage(activeModel);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-[13px] font-semibold text-start cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-blue-600" />
                            <span>داگرتنی ئەم وێنەیە</span>
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setIsMoreOpen(false);
                              onEditModel(activeModel);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-[13px] font-semibold text-start cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4 text-blue-600" />
                            <span>{t.edit}</span>
                          </button>
                        )}

                        {isAdmin && onOpenSettings && (
                          <button
                            onClick={() => {
                              setIsMoreOpen(false);
                              onOpenSettings();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-[13px] font-semibold text-start cursor-pointer"
                          >
                            <Sliders className="w-4 h-4 text-blue-600" />
                            <span>{t.slideshowSettings}</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

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
                  zenMode ? 'p-0 bg-transparent border-0' : (isBF ? 'vip-bf-frame p-1.5 sm:p-3' : 'glass-image-frame p-1.5 sm:p-3')
                }`}
                style={{
                  '--morph-duration': `${transitionTime}s`,
                  '--shimmer-interval': `${shimmerTime}s`,
                  transform: dragX ? `translate3d(${dragX}px, 0, 0)` : undefined,
                  opacity: dragX ? 1 - Math.min(0.35, Math.abs(dragX) / 600) : undefined,
                  transition: dragX ? 'none' : 'transform 0.25s ease-out, opacity 0.25s ease-out'
                }}
              >
                
                {/* Dynamic Shimmer Reflection Sweep */}
                <div 
                  className="glass-shimmer-sweep" 
                  style={{ animationDuration: `${shimmerTime}s` }}
                />

                {/* Black Friday Warm Backlight Ambient Glow */}
                {isBF && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 via-amber-500/10 to-transparent blur-3xl pointer-events-none -z-0" />
                )}

                {/* Luxury Ambient Glow in Zen Mode & Fullscreen (GPU-optimized for butter smooth 60fps) */}
                {(zenMode || isFullscreen) && activeModel?.image && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-25 scale-110 pointer-events-none transition-opacity duration-700 -z-0 gpu-layer"
                    style={{ backgroundImage: `url(${getOptimizedImageUrl(activeModel.image, 'thumb')})` }}
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
                      src={getOptimizedImageUrl(activeModel.image, 'hero')}
                      alt={activeModel.name}
                      decoding="async"
                      style={
                        zoomScale > 1.05
                          ? {
                              transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomScale})`,
                              transition: isPinchingRef.current ? 'none' : 'transform 0.15s ease-out'
                            }
                          : cinemaStage === 2 && zoomScaleRatio > 1.01
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
                          ? 'w-full h-full max-h-full max-w-full object-contain p-2 sm:p-4'
                          : 'max-h-full max-w-full w-auto h-auto object-contain'
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
            </div>

            {/* Thumbnail strip: jump straight to any model */}
            {filteredModels.length > 1 && !zenMode && (
              <div className={`shrink-0 overflow-hidden transition-all duration-500 ${isControlsVisible ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} ${
                isFullscreen ? 'bg-slate-900/80 border-t border-white/10' : 'bg-white/90 border-t border-slate-200'
              }`}>
                <div ref={thumbStripRef} className="flex items-center gap-2 overflow-x-auto px-3 py-2 scrollbar-none">
                  {stripItems.map(({ m, idx }) => (
                    <button
                      key={m.id}
                      data-active={idx === currentIndex}
                      onClick={() => setCurrentIndex(idx)}
                      title={m.name}
                      className={`relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        idx === currentIndex
                          ? 'border-blue-600 ring-2 ring-blue-600/30'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      {m.image ? (
                        <img src={getOptimizedImageUrl(m.image, 'thumb')} alt={m.name} decoding="async" loading="lazy" className="w-full h-full object-cover bg-slate-100" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 grid place-items-center text-slate-400">
                          <ImageOff className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Minimal Floating Corner Tag in Locked Zen Mode */}
            {zenMode ? (
              <div className={`absolute bottom-4 start-4 z-30 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl text-white select-none pointer-events-none animate-fadeIn max-w-sm sm:max-w-xl ${
                isBF 
                  ? 'bg-gradient-to-br from-[#121217] via-[#0d0d10] to-black border-2 border-orange-500/50 ring-1 ring-amber-400/40' 
                  : 'bg-black/85 border border-white/20'
              }`}>
                <div className="flex items-start justify-between gap-3.5">
                  <div>
                    {/* Outlet Last Piece / Black Friday VIP Badge */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {isBF ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg animate-gold-shimmer text-black text-[10px] font-black uppercase tracking-wide shadow-md border border-amber-300/50">
                          <span>👑</span>
                          <span>VIP BLACK FRIDAY</span>
                          <span>•</span>
                          <span>ASHLEY</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-wide shadow-xs">
                          <span>ASHLEY OUTLET</span>
                          <span>•</span>
                          <span className="text-amber-200 font-black">outlet کۆتا دانە</span>
                        </div>
                      )}

                      {discountPercent > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-900 text-xs sm:text-sm font-black shadow-md border border-white/20">
                          <span>{discountPercent}%</span>
                          <span className="text-[10px] font-bold uppercase">{t.saveDiscount || 'داشکاندن'}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">{activeModel.name}</h3>
                    
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300 flex-wrap">
                      <span className={`font-bold ${isBF ? 'text-orange-400' : 'text-blue-400'}`}>{getCategoryName(activeModel.categoryId)}</span>
                      {activeModel.stock > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-300 font-bold">عدد: {activeModel.stock}</span>
                        </>
                      )}
                      {activeModel.itemType && !isBF && (
                        <>
                          <span>•</span>
                          <span 
                            className="px-2 py-0.5 rounded-md font-black text-[10.5px] shadow-xs"
                            style={getStatusBadgeStyle(activeModel.itemType, statusColors)}
                          >
                            {activeModel.itemType}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-start border-s border-white/20 ps-3.5 ms-1 shrink-0">
                    {hasDiscountPrice && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-white/60 font-mono font-bold line-through decoration-rose-400">
                          {priceOriginal.toLocaleString()} {t.currency}
                        </span>
                        {discountPercent > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-900 text-[10px] font-black">
                            -%{discountPercent}
                          </span>
                        )}
                      </div>
                    )}
                    <div className={`text-lg sm:text-2xl font-black leading-none font-mono ${
                      isBF ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400' : (hasDiscountPrice ? 'text-emerald-400' : 'text-white')
                    }`}>
                      {mainPrice > 0 ? mainPrice.toLocaleString() : '—'}{' '}
                      {mainPrice > 0 && <span className={`text-xs font-bold ${isBF ? 'text-amber-400' : 'text-white/80'}`}>{t.currency}</span>}
                    </div>
                  </div>
                </div>

                {/* Detailed Notes in Zen Mode (if present) */}
                {activeModel.notes && (
                  <div className="mt-2.5 pt-2 border-t border-white/15">
                    <div className="flex items-start gap-1.5 text-[11px] sm:text-xs leading-relaxed text-slate-200">
                      <span className={`${isBF ? 'text-orange-400' : 'text-amber-400'} font-black shrink-0 flex items-center gap-1`}>
                        <FileText className="w-3 h-3" />
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
                  isBF
                    ? 'bg-gradient-to-r from-neutral-950 via-[#141318] to-black border-orange-500/50 text-white ring-1 ring-amber-400/20'
                    : isFullscreen 
                    ? 'bg-slate-900/90 border-white/10 text-white' 
                    : 'bg-white/95 border-slate-200 text-slate-900'
                }`}
              >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Left: Category, Title, Stock, Notes */}
                <div className="flex-1 min-w-0">
                  
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase mb-0.5 ${
                    isBF ? 'text-orange-400' : 'text-blue-500'
                  }`}>
                    <span>{getCategoryName(activeModel.categoryId)}</span>
                    {getCollectionName(activeModel.collectionId) && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className={isFullscreen || isBF ? 'text-slate-300' : 'text-slate-700'}>{getCollectionName(activeModel.collectionId)}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={`text-base sm:text-lg font-black leading-tight ${
                      isFullscreen || isBF ? 'text-white' : 'text-slate-900'
                    }`}>
                      {activeModel.name}
                    </h2>

                    {isBF && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full animate-gold-shimmer text-black text-[10px] font-black shadow-md border border-amber-300/60 uppercase tracking-wider">
                        <span>👑</span>
                        <span>VIP BLACK FRIDAY</span>
                      </span>
                    )}

                    {!isBF && discountPercent > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-900 text-xs sm:text-sm font-black shadow-md border border-blue-500/30">
                        <span>{discountPercent}%</span>
                        <span className="text-[10px] sm:text-xs font-bold uppercase">{t.saveDiscount || 'داشکاندن'}</span>
                      </span>
                    )}

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      isOutOfStock ? 'bg-rose-100 text-rose-700' : (isBF ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-emerald-100 text-emerald-800')
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

                    {activeModel.itemType && !isBF && (
                      <span 
                        className="text-[10.5px] font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs"
                        style={getStatusBadgeStyle(activeModel.itemType, statusColors)}
                      >
                        {activeModel.itemType}
                      </span>
                    )}
                  </div>

                  {/* Notes & Dimensions (Detailed and clear without truncation) */}
                  {activeModel.notes && (
                    <div className={`mt-2 flex items-start gap-2 p-2 rounded-xl text-xs max-w-4xl border transition-colors ${
                      isBF
                        ? 'bg-neutral-900/90 border-orange-500/30 text-neutral-200 shadow-sm'
                        : isFullscreen 
                        ? 'bg-white/10 border-white/15 text-slate-100 shadow-sm' 
                        : 'bg-slate-50 border-slate-200/90 text-slate-800'
                    }`}>
                      <span className={`font-black shrink-0 text-[11px] sm:text-xs flex items-center gap-1 ${
                        isBF ? 'text-orange-400' : (isFullscreen ? 'text-amber-400' : 'text-blue-600')
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
                  isBF ? 'border-orange-500/30' : (isFullscreen ? 'border-white/10' : 'border-slate-200')
                }`}>
                  
                  <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-1">
                    {hasDiscountPrice && (
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs sm:text-sm font-bold font-mono line-through decoration-rose-500 ${isFullscreen || isBF ? 'text-white/60' : 'text-slate-400'}`}>
                          {priceOriginal.toLocaleString()} {t.currency}
                        </span>
                        {discountPercent > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-400 text-slate-900 text-[11px] font-black">
                            -%{discountPercent}
                          </span>
                        )}
                      </div>
                    )}
                    <div className={`text-2xl sm:text-3xl font-black leading-none flex items-baseline gap-1 font-mono ${
                      isBF
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400'
                        : hasDiscountPrice ? (isFullscreen ? 'text-emerald-400' : 'text-emerald-600') : (isFullscreen ? 'text-white' : 'text-slate-900')
                    }`}>
                      <span>{mainPrice > 0 ? mainPrice.toLocaleString() : '—'}</span>
                      {mainPrice > 0 && <span className={`text-xs font-bold ${isBF ? 'text-amber-400' : 'opacity-70'}`}>{t.currency}</span>}
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
