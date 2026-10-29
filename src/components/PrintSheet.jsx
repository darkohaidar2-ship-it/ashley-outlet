import React from 'react';
import { getStatusBadgeStyle, getStatusColor, hexToRgba } from '../utils/statusColors';
import { getCategoryColor } from '../utils/categoryColors';
import { getOptimizedImageUrl } from '../utils/imageUrl';

export default function PrintSheet({
  modelsToPrint,
  categories = [],
  collections = [],
  logoUrl,
  logoSubtitle = 'SULAIMANIYAH',
  statusColors = {},
  categoryColors = {},
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

  // 1. Total models count
  const totalModelsCount = modelsToPrint.length;

  // Current formatted date
  const currentDate = new Date().toLocaleDateString(
    lang === 'ku' ? 'ckb' : lang === 'ar' ? 'ar-IQ' : 'en-US',
    { year: 'numeric', month: '2-digit', day: '2-digit' }
  );

  // 2. Total stock count (کۆی گشتی عدد)
  const totalStockCount = modelsToPrint.reduce((sum, m) => sum + (parseInt(m.stock) || 0), 0);

  // 3. Status types present in this print list
  const getModelStatus = (m) => m.itemType || (m.sku && m.sku !== m.name ? m.sku : '') || 'ئاوتلێت';
  const statusesInAlbum = [...new Set(modelsToPrint.map(getModelStatus).filter(Boolean))];
  const primaryStatus = statusesInAlbum.length === 1 ? statusesInAlbum[0] : (statusesInAlbum.join(' • ') || 'ئاوتلێت');
  const primaryStatusColor = statusesInAlbum.length === 1 ? getStatusColor(statusesInAlbum[0], statusColors) : '#dc2626';

  // 4. Category detection & identity for the print album
  const categoryIdsInAlbum = [...new Set(modelsToPrint.map(m => m.categoryId).filter(Boolean))];
  const singleCategory = categoryIdsInAlbum.length === 1 
    ? categories.find(c => c.id === categoryIdsInAlbum[0]) 
    : (categoryIdsInAlbum.length > 0 ? categories.find(c => c.id === categoryIdsInAlbum[0]) : null);
  const isSingleCategoryAlbum = categoryIdsInAlbum.length === 1;

  // Primary category theme color
  const primaryCategoryColor = singleCategory
    ? getCategoryColor(singleCategory, categoryColors)
    : '#059669';

  // Overall cover theme color:
  // If printing a single category (e.g. Outlet - Bedroom), cover accents adopt the category color!
  // If multiple categories are mixed, cover accents adopt the status color (e.g. Red for Outlet).
  const coverThemeColor = isSingleCategoryAlbum ? primaryCategoryColor : primaryStatusColor;

  // Category name for cover page banner
  const primaryCategoryName = singleCategory
    ? (lang === 'ku' ? (singleCategory.name_ku || singleCategory.name) : lang === 'ar' ? (singleCategory.name_ar || singleCategory.name) : (singleCategory.name_en || singleCategory.name))
    : (categoryIdsInAlbum.length > 1 ? (lang === 'ku' ? 'کۆی گشتی بەشەکان' : lang === 'ar' ? 'جميع الأقسام' : 'ALL CATEGORIES') : '');

  const primaryCategoryEnglish = singleCategory
    ? (singleCategory.name_en && singleCategory.name_en !== primaryCategoryName ? singleCategory.name_en : '')
    : (categoryIdsInAlbum.length > 1 ? 'ALL CATEGORIES' : '');

  const shouldShowCover = includeCoverPage && modelsToPrint && modelsToPrint.length > 1;

  return (
    <div id="print-container">
      {/* 1. BOOK COVER PAGE (First Page of Album, Pure White Background with Distinct Theme Color) */}
      {shouldShowCover && (
        <div 
          className="print-cover-page bg-white relative overflow-hidden flex flex-col justify-between" 
          style={{ 
            borderColor: coverThemeColor, 
            borderTopColor: coverThemeColor,
            '--cover-accent': coverThemeColor 
          }}
        >
          {/* Top Luxury Accent Strip with Theme Color */}
          <div className="absolute top-0 inset-x-0 h-3.5" style={{ backgroundColor: coverThemeColor }} />

          {/* Inner Decorative Book Framing with Theme Color */}
          <div 
            className="flex-1 flex flex-col justify-between border-2 rounded-2xl p-6 sm:p-8 bg-white relative mt-2" 
            style={{ borderColor: coverThemeColor }}
          >
            {/* Top Corner Decorative Geometric Accents */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: coverThemeColor }} />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: coverThemeColor }} />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: coverThemeColor }} />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: coverThemeColor }} />
            
            {/* Top: Ashley Official Logo (لەسەرەوە لۆگۆی فەرمی ئاشڵی) */}
            <div className="flex flex-col items-center justify-center text-center pb-5 border-b-2" style={{ borderColor: hexToRgba(coverThemeColor, 0.25) }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Ashley Logo"
                  className="h-20 max-w-[280px] object-contain rounded-lg drop-shadow-2xs mb-2"
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-md mb-2"
                  style={{ backgroundColor: coverThemeColor }}
                >
                  A
                </div>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="h-px w-10" style={{ backgroundColor: coverThemeColor, opacity: 0.6 }} />
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: coverThemeColor }}>
                  ESTABLISHED 1945 • HOMESTORE & OUTLET
                </span>
                <span className="h-px w-10" style={{ backgroundColor: coverThemeColor, opacity: 0.6 }} />
              </div>
            </div>

            {/* Center: Huge Typography ASHLEY / ئـاشـڵـی, Status & Category */}
            <div className="my-auto py-8 text-center flex flex-col items-center justify-center">
              
              <div 
                className="inline-block px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4 border" 
                style={{ 
                  color: coverThemeColor, 
                  borderColor: coverThemeColor, 
                  backgroundColor: hexToRgba(coverThemeColor, 0.06) 
                }}
              >
                OFFICIAL COLLECTION • کەتەلۆگی فەرمی
              </div>

              {/* Huge Bold Title: ASHLEY / ئـاشـڵـی */}
              <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-widest text-slate-900 leading-none my-1 font-sans">
                ASHLEY
              </h1>
              <h2 className="text-5xl sm:text-6xl font-black tracking-wider mt-2 mb-6 font-sans" style={{ color: coverThemeColor }}>
                ئـاشـڵـی
              </h2>

              {/* Status Badge: ستۆک / ئاوتلێت / یەدەگ */}
              <div 
                className="inline-flex items-center gap-4 px-10 py-3.5 rounded-2xl shadow-md text-white font-black text-3xl sm:text-4xl tracking-widest uppercase mt-2"
                style={{ backgroundColor: primaryStatusColor }}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                <span>{primaryStatus}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </div>

              {/* Category Name under Status Badge (لە ژێریا بە جوانی ناوی کەتەگۆری بنووسرێت) */}
              {primaryCategoryName && (
                <div 
                  className="mt-4 px-8 py-3 rounded-2xl border-2 font-black text-2xl sm:text-3xl tracking-wide flex items-center justify-center gap-3 shadow-xs"
                  style={{
                    color: primaryCategoryColor,
                    borderColor: primaryCategoryColor,
                    backgroundColor: hexToRgba(primaryCategoryColor, 0.08)
                  }}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryCategoryColor }} />
                  <span>{primaryCategoryName}</span>
                  {primaryCategoryEnglish && (
                    <span className="text-base sm:text-lg font-bold opacity-80 font-sans tracking-widest uppercase">
                      ({primaryCategoryEnglish})
                    </span>
                  )}
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryCategoryColor }} />
                </div>
              )}

              {/* Decorative Geometric Seal Divider */}
              <div className="flex items-center justify-center gap-3 w-48 mt-8">
                <div className="h-0.5 flex-1" style={{ backgroundColor: coverThemeColor, opacity: 0.4 }} />
                <div className="w-2.5 h-2.5 rotate-45" style={{ backgroundColor: coverThemeColor }} />
                <div className="h-0.5 flex-1" style={{ backgroundColor: coverThemeColor, opacity: 0.4 }} />
              </div>

            </div>

            {/* Bottom: 3 Required Summary Cards & Footer in Theme Color */}
            <div className="pt-6 border-t-2 space-y-4" style={{ borderColor: hexToRgba(coverThemeColor, 0.25) }}>
              
              {/* 3-Card Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                
                {/* 1. Total Models Count (کۆی گشتی مۆدێلەکان) */}
                <div 
                  className="bg-white p-4 rounded-xl border-2 text-center shadow-2xs relative overflow-hidden"
                  style={{ borderColor: coverThemeColor }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: coverThemeColor }} />
                  <span className="text-xs font-bold uppercase block mb-1 text-slate-600">
                    کۆی گشتی مۆدێلەکان
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 leading-tight my-1">
                    {totalModelsCount}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">مۆدێلی تۆمارکراو</span>
                </div>

                {/* 2. Total Stock Count (کۆی گشتی عدد) */}
                <div 
                  className="bg-white p-4 rounded-xl border-2 text-center shadow-2xs relative overflow-hidden"
                  style={{ borderColor: coverThemeColor }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: coverThemeColor }} />
                  <span className="text-xs font-bold uppercase block mb-1 text-slate-600">
                    کۆی گشتی عدد
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono leading-tight my-1" style={{ color: coverThemeColor }}>
                    {totalStockCount}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">دانە لە کۆگادا</span>
                </div>

                {/* 3. Issue Date (بەروار) */}
                <div 
                  className="bg-white p-4 rounded-xl border-2 text-center shadow-2xs relative overflow-hidden"
                  style={{ borderColor: coverThemeColor }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: coverThemeColor }} />
                  <span className="text-xs font-bold uppercase block mb-1 text-slate-600">
                    بەرواری چاپ / DATE
                  </span>
                  <div className="text-lg sm:text-xl font-black font-mono text-slate-900 leading-tight my-2">
                    {currentDate}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">چاپکراوی فەرمی</span>
                </div>

              </div>

              {/* Bottom Verification Seal & Footer */}
              <div className="pt-2 flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2 text-slate-700">
                  <span style={{ color: coverThemeColor }}>ASHLEY HOMESTORE OUTLET</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">سلێمانی، عێراق</span>
                </div>
                <div 
                  className="text-white font-mono px-3.5 py-1 rounded-md font-bold text-[10px] tracking-wider uppercase"
                  style={{ backgroundColor: coverThemeColor }}
                >
                  ALBUM COVER • لاپەڕەی بەرگ
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 2. INDIVIDUAL PRODUCT SPECIFICATION PAGES */}
      {modelsToPrint.map((model, idx) => {
        const cat = categories.find(c => c.id === model.categoryId);
        const catName = getCategoryName(model.categoryId);
        const colName = getCollectionName(model.collectionId);
        const hasDiscount = Boolean(
          model.originalPrice && 
          model.salePrice && 
          Number(model.salePrice) > 0 && 
          Number(model.originalPrice) > Number(model.salePrice)
        );
        const discountPercent = hasDiscount
          ? Math.round(((Number(model.originalPrice) - Number(model.salePrice)) / Number(model.originalPrice)) * 100)
          : 0;

        const itemStatus = model.itemType || (model.sku && model.sku !== model.name ? model.sku : '');
        // Determine dynamic status color (e.g. Red for Outlet, Purple for Stock, Blue for Yedek)
        const statusColor = itemStatus ? getStatusColor(itemStatus, statusColors) : '#dc2626';
        // Determine dynamic category color (e.g. Emerald for Bedroom, Sapphire for Living Room)
        const modelCatColor = getCategoryColor(cat || model.categoryId, categoryColors);

        return (
          <div 
            key={model.id} 
            className="print-page relative overflow-hidden"
            style={{
              '--print-page-border': modelCatColor,
              '--print-page-accent': modelCatColor,
              borderColor: modelCatColor,
              borderTopColor: modelCatColor
            }}
          >
            {/* Top Distinct Category Accent Band for Instant Department Identification */}
            <div 
              className="absolute top-0 inset-x-0 h-2.5" 
              style={{ backgroundColor: modelCatColor }}
            />

            {/* 1. Header with Ashley Logo & 1 Single Clear Status Stamp */}
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
                    style={{ backgroundColor: modelCatColor }}
                  >
                    A
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                      ASHLEY
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium tracking-wide">
                    {logoSubtitle && (
                      <span className="font-mono font-black text-slate-700 uppercase tracking-widest text-[10.5px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {logoSubtitle}
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span>HOMESTORE & OUTLET</span>
                  </div>
                </div>
              </div>

              {/* Status Watermark Stamp & Date (تەنها لەم بەشە دۆخی کاڵا بە دیاری نیشان دەدرێت) */}
              <div className="flex items-center gap-3">
                {itemStatus && (
                  <div 
                    className="px-4 py-1.5 rounded-xl border-2 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
                    style={{
                      backgroundColor: hexToRgba(statusColor, 0.12),
                      borderColor: statusColor,
                      color: statusColor
                    }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: statusColor }} />
                    <span className="text-sm font-black">{itemStatus}</span>
                  </div>
                )}

                <div className="text-end ps-3 border-s border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    DATE / بەروار
                  </div>
                  <div className="text-xs font-bold text-slate-800 font-mono">
                    {currentDate}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Furniture High-Quality Photo with Category Themed Border */}
            <div 
              className="print-image-container my-3 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center relative min-h-[280px]"
              style={{
                border: `2px solid ${hexToRgba(modelCatColor, 0.25)}`
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
              {hasDiscount && (
                <div 
                  className="absolute top-3 start-3 text-white font-black text-sm px-3 py-1 rounded-lg shadow-sm"
                  style={{ backgroundColor: statusColor }}
                >
                  {discountPercent}% {t.saveDiscount}
                </div>
              )}
            </div>

            {/* 3. Model Information & Specifications */}
            <div className="space-y-2.5">
              
              {/* Category & Collection (لێرەدا وشەی ئاوتلێت دووبارە ناکرێتەوە) */}
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider flex-wrap">
                {catName && (
                  <span 
                    className="px-3 py-1 rounded-lg text-white font-black text-xs shadow-2xs"
                    style={{ backgroundColor: modelCatColor }}
                  >
                    {catName}
                  </span>
                )}
                {colName && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-700 font-bold">{colName}</span>
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

            {/* 4. Pricing Box - Modern Minimalist Luxury Style */}
            <div 
              className="my-3 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between transition-colors bg-slate-50/80 border border-slate-200/90 shadow-2xs"
            >
              
              {/* Stock info - Clean Modern Badge */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-lg">
                  📦
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t.stock || 'بڕی بەردەست'}
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 font-mono">
                    {model.stock && model.stock > 0 ? (
                      <span>{model.stock} {t.piece || 'دانە'}</span>
                    ) : (
                      <span className="text-rose-600 font-bold text-xs">{t.outOfStock || 'نەماوە'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Block */}
              <div className="text-end flex flex-col items-end justify-center">
                
                {hasDiscount ? (
                  <>
                    {/* Old Price in Small Red with Strikethrough (نرخی کۆن بە سووری بچووک) */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10.5px] font-bold text-slate-400">کۆن:</span>
                      <span className="line-through text-rose-600 font-bold text-xs sm:text-sm font-mono decoration-rose-500 decoration-1.5">
                        {Number(model.originalPrice).toLocaleString()} {t.currency}
                      </span>
                      {discountPercent > 0 && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded-md font-mono">
                          %{discountPercent}-
                        </span>
                      )}
                    </div>

                    {/* New Discounted Price in Large Modern Emerald Green (نرخی داشکاندن بە سەوزی گەورە) */}
                    <div className="flex items-baseline justify-end gap-1.5 text-emerald-600">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-700 opacity-90 me-1">
                        {t.outletPrice || 'نرخی نوێ'}:
                      </span>
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-emerald-600">
                        {Number(model.salePrice).toLocaleString()}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-emerald-700">{t.currency}</span>
                    </div>
                  </>
                ) : (
                  /* Single Active Price (ئەگەر داشکاندن نەبێت، تەنها نرخی سەرەکی نیشان دەدرێت بێ سفر دۆلار) */
                  <div className="flex items-baseline justify-end gap-1.5 text-slate-900">
                    <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider me-1">
                      {t.price || 'نرخ'}:
                    </span>
                    <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-slate-900">
                      {model.originalPrice && Number(model.originalPrice) > 0 
                        ? Number(model.originalPrice).toLocaleString() 
                        : (model.salePrice && Number(model.salePrice) > 0 ? Number(model.salePrice).toLocaleString() : '0')}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-600">{t.currency}</span>
                  </div>
                )}

              </div>

            </div>

            {/* 5. A4 Footer (Clean, Modern, No Redundancy) */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 font-bold">
                <span style={{ color: modelCatColor }}>ASHLEY FURNITURE</span>
                <span>•</span>
                <span>OFFICIAL SALES SPECIFICATION</span>
                {catName && (
                  <>
                    <span>•</span>
                    <span style={{ color: modelCatColor }}>[{catName}]</span>
                  </>
                )}
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                PAGE {idx + 1} OF {modelsToPrint.length}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
