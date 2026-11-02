import React, { useState } from 'react';
import { Printer, Edit3, Trash2, Eye, Tag, CheckCircle2, AlertCircle, Tv, ImageOff } from 'lucide-react';
import { getStatusBadgeStyle } from '../utils/statusColors';
import { getOptimizedImageUrl } from '../utils/imageUrl';
import { useCachedImage, preloadAndCacheImage } from '../utils/imageLocalCache';
import ProgressiveImage from './ProgressiveImage';

export default function ProductCard({
  model,
  t,
  categoryName,
  collectionName,
  isAdmin,
  statusColors = {},
  isBlackFriday = false,
  onOpenDetails,
  onOpenSlideshow,
  onPrintSingle,
  onEdit,
  onDelete
}) {
  const [hasImgError, setHasImgError] = useState(false);
  const isBF = isBlackFriday || (model.itemType || model.sku || '').toLowerCase().includes('بلاک فرایدەی');

  const cardImageUrl = getOptimizedImageUrl(model.image, 'card');
  const { src: cachedImgSrc } = useCachedImage(cardImageUrl);

  // Pre-cache full HD hero image on hover so modal opens instantaneously with 0ms delay
  const handlePreloadHero = () => {
    if (model.image) {
      preloadAndCacheImage(getOptimizedImageUrl(model.image, 'hero'));
    }
  };

  const hasDiscount = Boolean(
    model.originalPrice && 
    model.salePrice && 
    Number(model.salePrice) > 0 && 
    Number(model.originalPrice) > Number(model.salePrice)
  );
  const discountPercent = hasDiscount
    ? Math.round(((Number(model.originalPrice) - Number(model.salePrice)) / Number(model.originalPrice)) * 100)
    : 0;

  const isOutOfStock = !model.stock || model.stock <= 0;

  return (
    <div
      onMouseEnter={handlePreloadHero}
      onTouchStart={handlePreloadHero}
      className={`group relative flex flex-col rounded-3xl p-2 transition-all duration-300 ${
        isBF
          ? 'bg-[#141419] border-2 border-orange-500/30 hover:border-orange-500/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_45px_-12px_rgba(255,107,0,0.35)] text-white'
          : 'bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-blue-200 hover:shadow-[0_20px_40px_-20px_rgba(37,99,235,0.35)] text-slate-900'
      }`}
    >

      {/* Image with badges */}
      <div
        onClick={() => onOpenDetails(model)}
        className={`relative aspect-square w-full rounded-[20px] overflow-hidden cursor-pointer flex items-center justify-center ${
          isBF ? 'bg-black/60 border border-orange-500/20' : 'bg-slate-100'
        }`}
      >
        {model.image ? (
          <ProgressiveImage
            src={model.image}
            alt={model.name}
            preset="card"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
            fallbackText={t.noImage || 'ئەم مۆدێلە وێنەی نییە'}
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center select-none ${
            isBF ? 'bg-neutral-900/90 text-neutral-400' : 'bg-slate-50 text-slate-400'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${
              isBF ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-200/70 text-slate-400'
            }`}>
              <ImageOff className="w-6 h-6" />
            </div>
            <span className={`text-xs font-bold leading-snug px-2 ${isBF ? 'text-neutral-300' : 'text-slate-600'}`}>
              {t.noImage || 'ئەم مۆدێلە وێنەی نییە'}
            </span>
          </div>
        )}

        {/* Black Friday badge */}
        {isBF && (
          <div className="absolute top-2.5 start-2.5 bg-gradient-to-r from-orange-600 to-amber-500 text-black font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
            <span>🔥</span>
            <span>BLACK FRIDAY</span>
          </div>
        )}

        {/* Discount badge */}
        {!isBF && discountPercent > 0 && (
          <div className="absolute top-2.5 start-2.5 bg-amber-400 text-slate-900 font-black text-xs px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <span className="font-mono">{discountPercent}%-</span>
            <span className="text-[10px] font-bold opacity-80">داشکاندن</span>
          </div>
        )}

        {/* Stock badge */}
        <div className={`absolute bottom-2.5 start-2.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 ${
          isOutOfStock
            ? 'bg-rose-600 text-white'
            : (isBF ? 'bg-black/80 text-white border border-white/20 shadow-sm' : 'bg-white/90 text-slate-800 shadow-sm')
        }`}>
          {isOutOfStock ? (
            <span>{t.outOfStock || 'تەواوبووە'}</span>
          ) : (
            <>
              <span className={`w-1.5 h-1.5 rounded-full ${isBF ? 'bg-orange-500' : 'bg-emerald-500'}`} />
              <span className={`font-medium text-[10px] ${isBF ? 'text-neutral-400' : 'text-slate-500'}`}>عدد</span>
              <span className="font-extrabold font-mono">{model.stock}</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-2.5 pt-3 pb-1.5 flex-1 flex flex-col justify-between">
        <div>
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold mb-1 flex-wrap ${
            isBF ? 'text-neutral-400' : 'text-slate-400'
          }`}>
            <span className={isBF ? 'text-orange-400/90 font-bold' : ''}>{categoryName}</span>
            {collectionName && (
              <>
                <span className="text-slate-500">/</span>
                <span className={isBF ? 'text-amber-400' : 'text-blue-600'}>{collectionName}</span>
              </>
            )}
            {model.itemType && !isBF && (
              <span
                className="px-2 py-0.5 rounded-full font-bold text-[10px]"
                style={getStatusBadgeStyle(model.itemType, statusColors)}
              >
                {model.itemType}
              </span>
            )}
          </div>

          <h3
            onClick={() => onOpenDetails(model)}
            className={`font-black text-[15px] leading-snug line-clamp-2 transition-colors cursor-pointer tracking-tight ${
              isBF ? 'text-white hover:text-orange-400' : 'text-slate-900 hover:text-blue-600'
            }`}
          >
            {model.name}
          </h3>

          {model.notes && (
            <p className={`mt-1 text-[11px] line-clamp-2 leading-relaxed ${isBF ? 'text-neutral-400' : 'text-slate-500'}`}>
              {model.notes}
            </p>
          )}
        </div>

        {/* Price & actions */}
        <div className={`mt-3 pt-2.5 border-t flex items-end justify-between gap-2 ${
          isBF ? 'border-neutral-800' : 'border-slate-100'
        }`}>
          <div className="min-w-0">
            {hasDiscount ? (
              <>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-medium ${isBF ? 'text-neutral-400' : 'text-slate-400'}`}>کۆن:</span>
                  <span className="text-xs font-bold text-rose-500 line-through font-mono decoration-rose-500">
                    {Number(model.originalPrice).toLocaleString()} {t.currency}
                  </span>
                </div>
                <div className={`text-lg font-black leading-none flex items-baseline gap-1 tracking-tight font-mono ${
                  isBF ? 'text-orange-400' : 'text-emerald-600'
                }`}>
                  <span>{Number(model.salePrice).toLocaleString()}</span>
                  <span className="text-[10px] font-bold opacity-80">{t.currency}</span>
                </div>
              </>
            ) : (
              <div>
                <div className={`text-[10px] font-medium mb-0.5 ${isBF ? 'text-orange-400/80 font-bold' : 'text-slate-400'}`}>
                  {isBF ? 'نرخی بلاک فرایدەی' : (t.price || 'نرخ')}
                </div>
                <div className={`text-lg font-black leading-none flex items-baseline gap-1 tracking-tight font-mono ${
                  isBF ? 'text-orange-400' : 'text-slate-900'
                }`}>
                  <span>
                    {model.originalPrice && Number(model.originalPrice) > 0
                      ? Number(model.originalPrice).toLocaleString()
                      : (model.salePrice && Number(model.salePrice) > 0 ? Number(model.salePrice).toLocaleString() : '—')}
                  </span>
                  {(Number(model.originalPrice) > 0 || Number(model.salePrice) > 0) && (
                    <span className={`text-[10px] font-bold ${isBF ? 'text-orange-400/80' : 'text-slate-500'}`}>{t.currency}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onPrintSingle(model)}
              className={`p-2 active:scale-95 rounded-xl transition-colors cursor-pointer ${
                isBF 
                  ? 'text-neutral-300 hover:text-orange-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800' 
                  : 'text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50'
              }`}
              title={t.print}
            >
              <Printer className="w-4 h-4" />
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(model)}
                  className={`p-2 rounded-xl transition-colors ${
                    isBF 
                      ? 'text-amber-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800' 
                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  }`}
                  title={t.edit}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(model)}
                  className="p-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
