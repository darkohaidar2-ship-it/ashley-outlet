import React from 'react';
import { getStatusBadgeStyle } from '../utils/statusColors';

export default function PrintSheet({
  modelsToPrint,
  categories,
  collections,
  logoUrl,
  statusColors = {},
  t,
  lang
}) {
  if (!modelsToPrint || modelsToPrint.length === 0) return null;

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return '';
    if (lang === 'ku') return cat.name_ku || cat.name;
    if (lang === 'ar') return cat.name_ar || cat.name;
    return cat.name_en || cat.name;
  };

  const getCollectionName = (colId) => {
    const col = collections.find(c => c.id === colId);
    return col ? col.name : '';
  };

  const currentDate = new Date().toLocaleDateString(
    lang === 'ku' ? 'ckb' : lang === 'ar' ? 'ar-IQ' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );

  return (
    <div id="print-container">
      {modelsToPrint.map((model) => {
        const catName = getCategoryName(model.categoryId);
        const colName = getCollectionName(model.collectionId);
        const discountPercent = model.originalPrice && model.originalPrice > model.salePrice
          ? Math.round(((model.originalPrice - model.salePrice) / model.originalPrice) * 100)
          : 0;

        return (
          <div key={model.id} className="print-page">
            
            {/* 1. Header with Ashley Outlet Logo */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Ashley Logo"
                    className="h-12 max-w-[160px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-2xl">
                    A
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                      ASHLEY
                    </span>
                    <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      OUTLET
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium tracking-wide">
                    OFFICIAL PRODUCT SPECIFICATION & PRICING
                  </p>
                </div>
              </div>

              <div className="text-end">
                <div className="text-xs font-bold text-slate-400 uppercase">
                  DATE / بەروار
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {currentDate}
                </div>
              </div>
            </div>

            {/* 2. Furniture High-Quality Photo */}
            <div className="print-image-container my-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative min-h-[280px]">
              {model.image ? (
                <img
                  src={model.image}
                  alt={model.name}
                  className="max-h-full max-w-full object-contain p-2"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <span className="text-xl font-bold text-slate-700">ئەم مۆدێلە وێنەی نییە</span>
                  <span className="text-xs text-slate-400 mt-1">ئەم مۆدێلە لە سیستەمدا بەبێ وێنە تۆمارکراوە</span>
                </div>
              )}
              {discountPercent > 0 && (
                <div className="absolute top-3 start-3 bg-red-600 text-white font-black text-sm px-3 py-1 rounded-lg">
                  {discountPercent}% {t.saveDiscount}
                </div>
              )}
            </div>

            {/* 3. Model Information & Specifications */}
            <div className="space-y-3">
              
              {/* Category & Collection & Item Status */}
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider flex-wrap">
                <span>{catName}</span>
                {colName && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-700">{colName}</span>
                  </>
                )}
                {model.itemType && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span 
                      className="px-2 py-0.5 rounded-md font-bold text-[11px] tracking-normal"
                      style={getStatusBadgeStyle(model.itemType, statusColors)}
                    >
                      {model.itemType}
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                {model.name}
              </h1>

              {/* Notes & Description */}
              {model.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                  <div className="font-bold text-slate-900 mb-1">
                    {t.notes}:
                  </div>
                  <div className="whitespace-pre-line">
                    {model.notes}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Pricing Box (Special Outlet Layout) */}
            <div className="my-2 p-4 bg-slate-50 border-2 border-red-600/30 rounded-2xl flex items-center justify-between">
              
              {/* Stock info */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">
                  {t.stock}
                </div>
                <div className="text-base font-extrabold text-slate-800">
                  {model.stock && model.stock > 0 ? `${model.stock} ${t.piece}` : t.outOfStock}
                </div>
              </div>

              {/* Original Price */}
              {model.originalPrice > 0 && model.originalPrice > model.salePrice && (
                <div className="text-center px-4 border-s border-e border-slate-200">
                  <div className="text-[11px] font-bold text-slate-400 uppercase line-through">
                    {t.originalPrice}
                  </div>
                  <div className="text-base font-bold text-slate-400 line-through">
                    {model.originalPrice.toLocaleString()} {t.currency}
                  </div>
                </div>
              )}

              {/* Outlet Final Price */}
              <div className="text-end">
                <div className="text-xs font-black text-red-600 uppercase tracking-wider">
                  {t.outletPrice}
                </div>
                <div className="text-2xl font-black text-red-600 flex items-baseline justify-end gap-1">
                  <span>{model.salePrice ? model.salePrice.toLocaleString() : '0'}</span>
                  <span className="text-xs font-bold text-red-600/80">{t.currency}</span>
                </div>
              </div>

            </div>

            {/* 5. A4 Footer with Ashley Brand Presence */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-red-600">ASHLEY FURNITURE OUTLET</span>
                <span>•</span>
                <span>OFFICIAL SALES SHEET</span>
              </div>
              <span>PAGE 1 / 1 (A4 FORMAT)</span>
            </div>

          </div>
        );
      })}
    </div>
  );
}
