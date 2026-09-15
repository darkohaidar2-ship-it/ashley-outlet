import React from 'react';
import { getStatusBadgeStyle, getStatusColor, hexToRgba } from '../utils/statusColors';
import { getOptimizedImageUrl } from '../utils/imageUrl';

export default function PrintSheet({
  modelsToPrint,
  categories,
  collections,
  logoUrl,
  statusColors = {},
  includeCoverPage = true,
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

  // Selected models with images to showcase on the book cover
  const featuredModelsWithImages = (modelsToPrint || []).filter(m => Boolean(m.image));
  const coverHeroModel = featuredModelsWithImages[0] || modelsToPrint[0];
  const coverThumbnails = featuredModelsWithImages.slice(1, 4);

  // Determine category name if filtered by category
  const uniqueCategoryIds = [...new Set((modelsToPrint || []).map(m => m.categoryId).filter(Boolean))];
  const albumCategoryTitle = uniqueCategoryIds.length === 1 
    ? getCategoryName(uniqueCategoryIds[0])
    : (lang === 'ku' ? 'تەواوی بەشەکان' : lang === 'ar' ? 'جميع الأقسام' : 'All Collections');

  const shouldShowCover = includeCoverPage && modelsToPrint && modelsToPrint.length > 1;

  return (
    <div id="print-container">
      {/* 1. BOOK COVER PAGE (First Page of Album, Book-like design) */}
      {shouldShowCover && (
        <div className="print-cover-page relative overflow-hidden flex flex-col justify-between">
          
          {/* Top Luxury Brand Strip */}
          <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-red-700 via-red-600 to-red-800" />

          {/* Inner Decorative Book Framing */}
          <div className="flex-1 flex flex-col justify-between border-2 border-slate-900/80 rounded-2xl p-6 bg-slate-50/50 relative">
            
            {/* Header: Ashley Logo & Official Monogram */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3.5">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Ashley Outlet"
                    className="h-12 max-w-[170px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-2xl shadow-sm">
                    A
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-black text-2xl tracking-tight text-slate-900">
                      ASHLEY
                    </span>
                    <span className="text-white text-xs font-black px-2 py-0.5 rounded-xs bg-red-600 uppercase tracking-wider">
                      OUTLET
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 tracking-wider mt-1 uppercase">
                    Official Furniture Catalog & Lookbook
                  </p>
                </div>
              </div>

              {/* Established Date & Quality Stamp */}
              <div className="text-end">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  EST. 1945
                </div>
                <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider mt-1 inline-flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs" />
                  <span>AUTHENTIC ORIGINAL</span>
                </div>
              </div>
            </div>

            {/* Curated Hero Furniture Showcase Gallery */}
            <div className="my-2.5 space-y-2 flex-1 flex flex-col justify-center">
              {coverHeroModel && (
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-900 bg-white shadow-sm flex items-center justify-center h-[105mm] max-h-[105mm]">
                  {coverHeroModel.image ? (
                    <img
                      src={getOptimizedImageUrl(coverHeroModel.image, 'print')}
                      alt={coverHeroModel.name}
                      className="max-h-full max-w-full object-contain p-3"
                    />
                  ) : (
                    <div className="text-slate-400 font-bold text-lg">ASHLEY FURNITURE HOMESTORE</div>
                  )}

                  {/* Overlay Tag with Model Name & Category */}
                  <div className="absolute bottom-2.5 inset-x-2.5 bg-slate-900/90 text-white backdrop-blur-xs rounded-xl px-4 py-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
                        {getCategoryName(coverHeroModel.categoryId) || 'مۆبێلی تایبەت'}
                      </span>
                      <h3 className="text-base font-black font-mono leading-tight">
                        {coverHeroModel.name}
                      </h3>
                    </div>
                    {coverHeroModel.salePrice > 0 && (
                      <div className="text-end font-mono font-black text-rose-400 text-sm">
                        {coverHeroModel.salePrice.toLocaleString()} {t.currency || 'د.ع'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Secondary Featured Thumbnails (Row of 3 cards) */}
              {coverThumbnails.length > 0 && (
                <div className="grid grid-cols-3 gap-2 h-[34mm]">
                  {coverThumbnails.map((thumbModel, tIdx) => (
                    <div
                      key={thumbModel.id || tIdx}
                      className="relative rounded-xl overflow-hidden border border-slate-300 bg-white flex items-center justify-center p-1"
                    >
                      <img
                        src={getOptimizedImageUrl(thumbModel.image, 'print')}
                        alt={thumbModel.name}
                        className="max-h-full max-w-full object-contain"
                      />
                      <div className="absolute bottom-1 inset-x-1 bg-black/75 text-white rounded-md text-[9px] font-bold px-1.5 py-0.5 truncate text-center">
                        {thumbModel.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Book Title & Lookbook Heading */}
            <div className="text-center py-2.5 border-t border-b border-slate-200 my-1 bg-white rounded-xl shadow-2xs">
              <div className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-0.5">
                FURNITURE COLLECTION LOOKBOOK • ئەلبوومی فەرمی
              </div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">
                ئەلبوومی مۆبێلی ئاشڵی ئاوتلێت
              </h1>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                کۆلێکشن: <span className="text-slate-900 font-black">{albumCategoryTitle}</span>
              </p>
            </div>

            {/* Specification Summary Grid */}
            <div className="grid grid-cols-4 gap-2 text-center py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <div className="border-e border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">ژمارەی مۆدێلەکان</span>
                <span className="font-black text-slate-900 font-mono text-sm">{modelsToPrint.length} مۆدێل</span>
              </div>
              <div className="border-e border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">بەروار / DATE</span>
                <span className="font-black text-slate-900 font-mono text-sm">{currentDate}</span>
              </div>
              <div className="border-e border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">جۆری چاپ</span>
                <span className="font-black text-red-600 text-sm">A4 ئەلبوومی فەرمی</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">گەڕان و فلتەر</span>
                <span className="font-black text-slate-900 text-sm">{albumCategoryTitle}</span>
              </div>
            </div>

            {/* Book Footer */}
            <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <span className="text-red-600 font-black">ASHLEY HOMESTORE OUTLET</span>
                <span>•</span>
                <span>سلێمانی، عێراق</span>
              </div>
              <div className="bg-slate-900 text-white font-mono px-2.5 py-0.5 rounded-sm font-bold text-[9px]">
                COVER PAGE • بەرگی سەرەکی ئەلبوم
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. INDIVIDUAL PRODUCT SPECIFICATION PAGES */}
      {modelsToPrint.map((model, idx) => {
        const catName = getCategoryName(model.categoryId);
        const colName = getCollectionName(model.collectionId);
        const discountPercent = model.originalPrice && model.originalPrice > model.salePrice
          ? Math.round(((model.originalPrice - model.salePrice) / model.originalPrice) * 100)
          : 0;

        const itemStatus = model.itemType || (model.sku && model.sku !== model.name ? model.sku : '');
        // Determine dynamic theme color based on status (e.g. Purple for Stock, Red for Outlet, Blue for Yedek)
        const themeColor = itemStatus ? getStatusColor(itemStatus, statusColors) : '#dc2626';

        return (
          <div 
            key={model.id} 
            className="print-page relative overflow-hidden"
            style={{
              '--print-page-border': themeColor,
              '--print-page-accent': themeColor,
              borderColor: themeColor,
              borderTopColor: themeColor
            }}
          >
            {/* Top Distinct Status Band for High Visibility from Afar */}
            <div 
              className="absolute top-0 inset-x-0 h-2" 
              style={{ backgroundColor: themeColor }}
            />

            {/* 1. Header with Ashley Outlet Logo & High-Contrast Status Stamp */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 pt-1">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Ashley Logo"
                    className="h-12 max-w-[160px] object-contain rounded-lg"
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-sm"
                    style={{ backgroundColor: themeColor }}
                  >
                    A
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                      ASHLEY
                    </span>
                    <span 
                      className="text-white text-xs font-black px-2 py-0.5 rounded-sm uppercase tracking-wider"
                      style={{ backgroundColor: themeColor }}
                    >
                      OUTLET
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium tracking-wide">
                    OFFICIAL PRODUCT SPECIFICATION & PRICING
                  </p>
                </div>
              </div>

              {/* Status Watermark Stamp & Date */}
              <div className="flex items-center gap-3">
                {itemStatus && (
                  <div 
                    className="px-3.5 py-1.5 rounded-xl border-2 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
                    style={{
                      backgroundColor: hexToRgba(themeColor, 0.12),
                      borderColor: themeColor,
                      color: themeColor
                    }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: themeColor }} />
                    <span className="text-sm font-black">{itemStatus}</span>
                  </div>
                )}

                <div className="text-end ps-2 border-s border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    DATE / بەروار
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {currentDate}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Furniture High-Quality Photo with Themed Border */}
            <div 
              className="print-image-container my-3 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center relative min-h-[280px]"
              style={{
                border: `2px solid ${hexToRgba(themeColor, 0.3)}`
              }}
            >
              {model.image ? (
                <img
                  src={getOptimizedImageUrl(model.image, 'print')}
                  alt={model.name}
                  className="max-h-full max-w-full object-contain p-2"
                  crossOrigin="anonymous"
                  decoding="async"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <span className="text-xl font-bold text-slate-700">ئەم مۆدێلە وێنەی نییە</span>
                  <span className="text-xs text-slate-400 mt-1">ئەم مۆدێلە لە سیستەمدا بەبێ وێنە تۆمارکراوە</span>
                </div>
              )}
              {discountPercent > 0 && (
                <div 
                  className="absolute top-3 start-3 text-white font-black text-sm px-3 py-1 rounded-lg shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  {discountPercent}% {t.saveDiscount}
                </div>
              )}
            </div>

            {/* 3. Model Information & Specifications */}
            <div className="space-y-2.5">
              
              {/* Category, Collection & Item Status */}
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider flex-wrap" style={{ color: themeColor }}>
                <span>{catName}</span>
                {colName && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-700 font-bold">{colName}</span>
                  </>
                )}
                {itemStatus && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span 
                      className="px-2.5 py-0.5 rounded-md font-black text-[11px] tracking-wide"
                      style={getStatusBadgeStyle(itemStatus, statusColors)}
                    >
                      {itemStatus}
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
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                  <div className="font-bold text-slate-900 mb-0.5">
                    {t.notes}:
                  </div>
                  <div className="whitespace-pre-line">
                    {model.notes}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Pricing Box - Luxuriously Themed with Status Color */}
            <div 
              className="my-2 p-4 rounded-2xl flex items-center justify-between transition-colors"
              style={{
                backgroundColor: hexToRgba(themeColor, 0.05),
                border: `2.5px solid ${themeColor}`
              }}
            >
              
              {/* Stock info */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">
                  {t.stock}
                </div>
                <div className="text-base font-extrabold text-slate-900">
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
                <div className="text-xs font-black uppercase tracking-wider" style={{ color: themeColor }}>
                  {itemStatus ? `${t.outletPrice || 'نرخی کۆتایی'} (${itemStatus})` : t.outletPrice}
                </div>
                <div className="text-2xl sm:text-3xl font-black flex items-baseline justify-end gap-1" style={{ color: themeColor }}>
                  <span>{model.salePrice ? model.salePrice.toLocaleString() : '0'}</span>
                  <span className="text-xs font-bold opacity-85">{t.currency}</span>
                </div>
              </div>

            </div>

            {/* 5. A4 Footer with Ashley Brand Presence */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 font-bold">
                <span style={{ color: themeColor }}>ASHLEY FURNITURE OUTLET</span>
                <span>•</span>
                <span>OFFICIAL SALES SHEET</span>
                {itemStatus && (
                  <>
                    <span>•</span>
                    <span style={{ color: themeColor }}>[{itemStatus}]</span>
                  </>
                )}
              </div>
              <span>PAGE {modelsToPrint.length > 1 ? `${idx + 1} OF ${modelsToPrint.length}` : '1 / 1 (A4 FORMAT)'}</span>
            </div>

          </div>
        );
      })}
    </div>
  );
}
