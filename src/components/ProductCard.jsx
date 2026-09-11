import React, { useState } from 'react';
import { Printer, Edit3, Trash2, Eye, Tag, CheckCircle2, AlertCircle, Tv, ImageOff } from 'lucide-react';

export default function ProductCard({
  model,
  t,
  categoryName,
  collectionName,
  isAdmin,
  onOpenDetails,
  onOpenSlideshow,
  onPrintSingle,
  onEdit,
  onDelete
}) {
  const [hasImgError, setHasImgError] = useState(false);

  const discountPercent = model.originalPrice && model.originalPrice > model.salePrice
    ? Math.round(((model.originalPrice - model.salePrice) / model.originalPrice) * 100)
    : 0;

  const isOutOfStock = !model.stock || model.stock <= 0;

  return (
    <div className="fluent-card rounded-2xl overflow-hidden flex flex-col group relative">
      
      {/* Image Container with Badges */}
      <div 
        onClick={() => onOpenDetails(model)}
        className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center"
      >
        {model.image && !hasImgError ? (
          <img
            src={model.image}
            alt={model.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setHasImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4 text-center select-none border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/70 flex items-center justify-center mb-2 text-slate-400">
              <ImageOff className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-600 leading-snug px-2">
              {t.noImage || 'ئەم مۆدێلە وێنەی نییە'}
            </span>
          </div>
        )}

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 start-2.5 bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded-lg shadow-sm">
            {discountPercent}%-
          </div>
        )}

        {/* Stock Badge - only if out of stock to reduce clutter */}
        {isOutOfStock && (
          <div className="absolute top-2.5 end-2.5 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-100/95 text-rose-700 border border-rose-200 shadow-xs">
            {t.outOfStock}
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Collection / Category Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mb-0.5">
            <span>{categoryName}</span>
            {collectionName && (
              <>
                <span>•</span>
                <span className="text-red-600/90">{collectionName}</span>
              </>
            )}
          </div>

          {/* Model Name */}
          <h3 
            onClick={() => onOpenDetails(model)}
            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-red-600 transition-colors cursor-pointer"
          >
            {model.name}
          </h3>

          {/* Notes Preview */}
          {model.notes && (
            <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {model.notes}
            </p>
          )}
        </div>

        {/* Price & Action Area */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            {model.originalPrice > 0 && model.originalPrice > model.salePrice && (
              <span className="text-[11px] text-slate-400 line-through block font-medium">
                {model.originalPrice.toLocaleString()} {t.currency}
              </span>
            )}
            <div className="text-sm sm:text-base font-black text-red-600 leading-none flex items-baseline gap-1">
              <span>{model.salePrice ? model.salePrice.toLocaleString() : '0'}</span>
              <span className="text-[10px] font-bold text-red-600/80">{t.currency}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            
            {/* Direct A4 Print Button */}
            <button
              onClick={() => onPrintSingle(model)}
              className="p-2 text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-all"
              title={t.print}
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Admin Buttons (Edit / Delete) */}
            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(model)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title={t.edit}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(model)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
