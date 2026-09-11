import React from 'react';
import { X, Printer, CheckCircle2, AlertCircle, Tag, Layers, FileText, ImageOff } from 'lucide-react';

export default function ProductModal({
  model,
  t,
  categoryName,
  collectionName,
  logoUrl,
  onClose,
  onPrint,
  onOpenSlideshow
}) {
  if (!model) return null;

  const discountPercent = model.originalPrice && model.originalPrice > model.salePrice
    ? Math.round(((model.originalPrice - model.salePrice) / model.originalPrice) * 100)
    : 0;

  const isOutOfStock = !model.stock || model.stock <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn no-print">
      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Large Image */}
        <div className="relative md:w-1/2 bg-slate-100 min-h-[260px] md:min-h-full flex items-center justify-center overflow-hidden">
          {model.image ? (
            <img
              src={model.image}
              alt={model.name}
              className="w-full h-full object-cover"
            />
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
            <div className="absolute top-4 start-4 bg-red-600 text-white font-black text-sm px-3 py-1.5 rounded-xl shadow-lg">
              {discountPercent}% {t.saveDiscount}
            </div>
          )}

          <button
            onClick={onClose}
            className="md:hidden absolute top-4 end-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-700 shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side: Details */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
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
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
              <span>{categoryName}</span>
              {collectionName && (
                <>
                  <span>•</span>
                  <span className="text-red-600 font-bold">{collectionName}</span>
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

            {/* Stock Count */}
            <div className="mt-4 flex items-center gap-2">
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

          {/* Print Trigger Button */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onPrint(model)}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
            >
              <Printer className="w-5 h-5 text-red-500" />
              <span>{t.print}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
