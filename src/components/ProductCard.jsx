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
  onOpenDetails,
  onOpenSlideshow,
  onPrintSingle,
  onEdit,
  onDelete
}) {
  const [hasImgError, setHasImgError] = useState(false);

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
      className="group relative flex flex-col bg-white rounded-3xl border border-slate-200/80 p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-blue-200 hover:shadow-[0_20px_40px_-20px_rgba(37,99,235,0.35)] transition-[box-shadow,border-color] duration-300"
    >

      {/* Image with badges */}
      <div
        onClick={() => onOpenDetails(model)}
        className="relative aspect-square w-full bg-slate-100 rounded-[20px] overflow-hidden cursor-pointer flex items-center justify-center"
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
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4 text-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/70 flex items-center justify-center mb-2 text-slate-400">
              <ImageOff className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-600 leading-snug px-2">
              {t.noImage || 'ئەم مۆدێلە وێنەی نییە'}
            </span>
          </div>
        )}

        {/* Discount badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 start-2.5 bg-amber-400 text-slate-900 font-black text-xs px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <span className="font-mono">{discountPercent}%-</span>
            <span className="text-[10px] font-bold opacity-80">داشکاندن</span>
          </div>
        )}

        {/* Stock badge */}
        <div className={`absolute bottom-2.5 start-2.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 ${
          isOutOfStock
            ? 'bg-rose-600 text-white'
            : 'bg-white/90 text-slate-800 shadow-sm'
        }`}>
          {isOutOfStock ? (
            <span>{t.outOfStock || 'تەواوبووە'}</span>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-slate-500 font-medium text-[10px]">عدد</span>
              <span className="font-extrabold font-mono">{model.stock}</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-2.5 pt-3 pb-1.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1 flex-wrap">
            <span>{categoryName}</span>
            {collectionName && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-blue-600">{collectionName}</span>
              </>
            )}
            {model.itemType && (
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
            className="font-extrabold text-slate-900 text-[15px] leading-snug line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer tracking-tight"
          >
            {model.name}
          </h3>

          {model.notes && (
            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {model.notes}
            </p>
          )}
        </div>

        {/* Price & actions */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {hasDiscount ? (
              <>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">کۆن:</span>
                  <span className="text-xs font-bold text-rose-600 line-through font-mono decoration-rose-500">
                    {Number(model.originalPrice).toLocaleString()} {t.currency}
                  </span>
                </div>
                <div className="text-lg font-black text-emerald-600 leading-none flex items-baseline gap-1 tracking-tight font-mono">
                  <span>{Number(model.salePrice).toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-emerald-700/80">{t.currency}</span>
                </div>
              </>
            ) : (
              <div>
                <div className="text-[10px] text-slate-400 font-medium mb-0.5">
                  {t.price || 'نرخ'}
                </div>
                <div className="text-lg font-black text-slate-900 leading-none flex items-baseline gap-1 tracking-tight font-mono">
                  <span>
                    {model.originalPrice && Number(model.originalPrice) > 0
                      ? Number(model.originalPrice).toLocaleString()
                      : (model.salePrice && Number(model.salePrice) > 0 ? Number(model.salePrice).toLocaleString() : '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">{t.currency}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onPrintSingle(model)}
              className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 active:scale-95 rounded-xl transition-colors cursor-pointer"
              title={t.print}
            >
              <Printer className="w-4 h-4" />
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(model)}
                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  title={t.edit}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(model)}
                  className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
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
