import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle2, AlertCircle, Tag, Layers, FileText, ImageOff, Share2, Check, Download, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { downloadModelImage } from '../services/imageExportService';
import { getStatusBadgeStyle } from '../utils/statusColors';
import { getOptimizedImageUrl } from '../utils/imageUrl';

export default function ProductModal({
  model,
  models = [],
  onSelectModel,
  t,
  categoryName,
  collectionName,
  logoUrl,
  statusColors = {},
  onClose,
  onPrint,
  onOpenSlideshow
}) {
  const [copied, setCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const currentIndex = models.findIndex(m => m.id === model?.id);
  const hasMultiple = models.length > 1 && currentIndex !== -1 && Boolean(onSelectModel);

  const handlePrev = () => {
    if (!hasMultiple) return;
    const prevIdx = (currentIndex - 1 + models.length) % models.length;
    onSelectModel(models[prevIdx]);
  };

  const handleNext = () => {
    if (!hasMultiple) return;
    const nextIdx = (currentIndex + 1) % models.length;
    onSelectModel(models[nextIdx]);
  };

  // Keyboard Arrow navigation for Album browsing & Escape key handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        if (hasMultiple) {
          if (t?.dir === 'rtl') handlePrev();
          else handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (hasMultiple) {
          if (t?.dir === 'rtl') handleNext();
          else handlePrev();
        }
      } else if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultiple, currentIndex, models, t?.dir, isLightboxOpen]);

  if (!model) return null;

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/?model=${model.id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.warn('Copy link error:', e);
    }
  };

  const discountPercent = model.originalPrice && model.originalPrice > model.salePrice
    ? Math.round(((model.originalPrice - model.salePrice) / model.originalPrice) * 100)
    : 0;

  const isOutOfStock = !model.stock || model.stock <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-5 bg-black/70 backdrop-blur-sm animate-fadeIn no-print">
      <div className="bg-white w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col md:flex-row max-h-[94vh] sm:max-h-[92vh]">
        
        {/* Left Side: Large Uncropped Image with Ambient Glow & Full View Capability */}
        <div className="relative md:w-7/12 lg:w-3/5 bg-slate-900/5 min-h-[300px] sm:min-h-[420px] md:min-h-[580px] flex items-center justify-center overflow-hidden p-3 sm:p-5 group">
          {model.image ? (
            <>
              {/* Soft luxury ambient background glow */}
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-125 pointer-events-none -z-0"
                style={{ backgroundImage: `url(${getOptimizedImageUrl(model.image, 'thumb')})` }}
              />

              <img
                src={getOptimizedImageUrl(model.image, 'hero')}
                alt={model.name}
                className="max-h-[50vh] sm:max-h-[60vh] md:max-h-[78vh] max-w-full w-auto h-auto object-contain z-10 transition-transform duration-300 hover:scale-[1.015] cursor-zoom-in drop-shadow-md select-none"
                decoding="async"
                onClick={() => setIsLightboxOpen(true)}
                title="کرتە بکە بۆ گەورەکردنی تەواوی وێنەکە لەسەر هەموو شاشە"
              />

              {/* Floating Fullscreen / Maximize button */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-3 end-3 z-20 bg-black/60 hover:bg-black/85 text-white px-2.5 py-1.5 rounded-xl backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="گەورەکردنی تەواوی وێنەکە"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">گەورەکردن</span>
              </button>
            </>
          ) : (
            <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50">
              <div className="w-16 h-16 rounded-2xl bg-slate-200/80 flex items-center justify-center mb-3 text-slate-400">
                <ImageOff className="w-8 h-8" />
              </div>
              <span className="text-base font-bold text-slate-700 leading-snug">
                {t.noImage || 'ئەم مۆدێلە وێنەی نییە'}
              </span>
            </div>
          )}

          {discountPercent > 0 && (
            <div className="absolute top-4 start-4 bg-red-600 text-white font-black text-sm px-3 py-1.5 rounded-xl shadow-lg z-20">
              {discountPercent}% {t.saveDiscount}
            </div>
          )}

          {/* Previous / Next Navigation Chevrons for Album Browsing */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute start-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer z-20"
                title={t.previous || 'پێشوو'}
              >
                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute end-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer z-20"
                title={t.next || 'دواتر'}
              >
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>

              {/* Album Position Indicator */}
              <div className="absolute bottom-3 start-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-bold px-2.5 py-0.5 rounded-full z-20 select-none font-mono">
                {currentIndex + 1} / {models.length}
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="md:hidden absolute top-4 end-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-700 shadow-md z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side: Details */}
        <div className="md:w-5/12 lg:w-2/5 p-6 sm:p-7 flex flex-col justify-between overflow-y-auto bg-white">
          <div>
            <div className="flex items-center justify-between mb-3">
              {/* Ashley Brand Header */}
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-6 max-w-[100px] object-contain rounded" />
                ) : (
                  <div className="w-6 h-6 bg-red-600 rounded-md flex items-center justify-center text-white font-black text-xs">
                    A
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs tracking-tight text-slate-900">
                    ASHLEY
                  </span>
                  <span className="bg-red-600 text-white text-[8px] font-bold px-1 py-0.2 rounded-xs uppercase">
                    OUTLET
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2 flex-wrap">
              <span>{categoryName}</span>
              {collectionName && (
                <>
                  <span>•</span>
                  <span className="text-red-600 font-bold">{collectionName}</span>
                </>
              )}
              {model.itemType && (
                <>
                  <span>•</span>
                  <span 
                    className="px-2 py-0.5 rounded-lg font-bold text-xs shadow-2xs"
                    style={getStatusBadgeStyle(model.itemType, statusColors)}
                  >
                    {model.itemType}
                  </span>
                </>
              )}
            </div>

            {/* Model Name */}
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {model.name}
            </h2>

            {/* Price Box */}
            <div className="mt-5 p-4 rounded-2xl bg-red-50/60 border border-red-100">
              <div className="text-xs text-red-600/80 font-bold uppercase tracking-wider mb-1">
                {t.outletPrice}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-red-600">
                  {model.salePrice ? model.salePrice.toLocaleString() : '0'}
                </span>
                <span className="text-sm font-bold text-red-600/80">{t.currency}</span>
                {model.originalPrice > 0 && model.originalPrice > model.salePrice && (
                  <span className="text-sm text-slate-400 line-through font-medium ms-2">
                    {model.originalPrice.toLocaleString()} {t.currency}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Count & Item Status */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">{t.stock}:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  isOutOfStock
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isOutOfStock ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t.outOfStock}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {model.stock} {t.piece}
                    </>
                  )}
                </span>
              </div>

              {model.itemType && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">{t.itemStatus || 'دۆخی کاڵا'}:</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    model.itemType === 'ستۆک'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : model.itemType === 'یەدەگ'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : model.itemType === 'ئاوتلێت'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}>
                    {model.itemType}
                  </span>
                </div>
              )}
            </div>

            {/* Notes & Dimensions */}
            {model.notes && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {t.notes}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-line">
                  {model.notes}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Print, Download Image & Share Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={() => onPrint(model)}
              className="flex-1 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
            >
              <Printer className="w-5 h-5 text-red-500" />
              <span>{t.print}</span>
            </button>
            {model.image && (
              <button
                onClick={() => downloadModelImage(model)}
                className="py-3.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-xs"
                title="داگرتنی وێنەکە بە ناوی مۆدێل"
              >
                <Download className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-slate-700">وێنە</span>
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="py-3.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-xs"
              title="کۆپیکردنی لینکی مۆدێل"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-emerald-700">کۆپی کرا</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-600" />
                  <span className="text-xs text-slate-700">بەستەر</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* FULLSCREEN LIGHTBOX (کە وێنەکە کرتەی لەسەر کرا بە تەواوی گەورە بکرێت بێ هیچ کەتکردنێک) */}
      {isLightboxOpen && model.image && (
        <div 
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-2 sm:p-4 animate-fadeIn select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Top Bar */}
          <div className="absolute top-3 inset-x-3 sm:top-5 sm:inset-x-6 z-20 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2.5 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 text-white shadow-xl">
              <span className="text-xs sm:text-sm font-black">{model.name}</span>
              {hasMultiple && (
                <span className="text-[11px] text-slate-400 font-mono">
                  ({currentIndex + 1} / {models.length})
                </span>
              )}
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadModelImage(model);
                }}
                className="p-2.5 bg-black/75 hover:bg-black/90 text-white rounded-2xl border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-xl flex items-center gap-1.5 text-xs font-bold"
                title="داگرتنی وێنەی کامێرای ئەسڵی (٤-٥ مێگابایت)"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">داگرتن (Full Res)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2.5 bg-black/75 hover:bg-rose-600 text-white rounded-2xl border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-xl"
                title="داخستن (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Centered Giant Image (100% Uncropped with object-contain) */}
          <div 
            className="w-full h-full flex items-center justify-center p-2 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getOptimizedImageUrl(model.image, 'hero')}
              alt={model.name}
              className="max-h-[88vh] max-w-[95vw] w-auto h-auto object-contain drop-shadow-2xl select-none"
              decoding="async"
            />
          </div>

          {/* Next / Prev Chevrons in Lightbox */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute start-3 sm:start-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all shadow-2xl active:scale-90 cursor-pointer z-20"
                title={t.previous || 'پێشوو'}
              >
                <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute end-3 sm:end-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all shadow-2xl active:scale-90 cursor-pointer z-20"
                title={t.next || 'دواتر'}
              >
                <ChevronRight className="w-6 h-6 rtl:rotate-180" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
