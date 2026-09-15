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

  const shouldShowCover = includeCoverPage && modelsToPrint && modelsToPrint.length > 1;

  return (
    <div id="print-container">
      {/* 1. BOOK COVER PAGE (First Page of Album, Pure White Background with Status Signature Color) */}
      {shouldShowCover && (
        <div 
          className="print-cover-page bg-white relative overflow-hidden flex flex-col justify-between" 
          style={{ 
            borderColor: primaryStatusColor, 
            borderTopColor: primaryStatusColor,
            '--cover-accent': primaryStatusColor 
          }}
        >
          {/* Top Luxury Accent Strip with Status Color */}
          <div className="absolute top-0 inset-x-0 h-3.5" style={{ backgroundColor: primaryStatusColor }} />

          {/* Inner Decorative Book Framing with Status Color */}
          <div 
            className="flex-1 flex flex-col justify-between border-2 rounded-2xl p-6 sm:p-8 bg-white relative mt-2" 
            style={{ borderColor: primaryStatusColor }}
          >
            {/* Top Corner Decorative Geometric Accents */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: primaryStatusColor }} />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: primaryStatusColor }} />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: primaryStatusColor }} />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: primaryStatusColor }} />
            
            {/* Top: Ashley Official Logo (لەسەرەوە لۆگۆی فەرمی ئاشڵی) */}
            <div className="flex flex-col items-center justify-center text-center pb-5 border-b-2" style={{ borderColor: hexToRgba(primaryStatusColor, 0.25) }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Ashley Logo"
                  className="h-20 max-w-[280px] object-contain rounded-lg drop-shadow-2xs mb-2"
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-md mb-2"
                  style={{ backgroundColor: primaryStatusColor }}
                >
                  A
                </div>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="h-px w-10" style={{ backgroundColor: primaryStatusColor, opacity: 0.6 }} />
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: primaryStatusColor }}>
                  ESTABLISHED 1945 • HOMESTORE & OUTLET
                </span>
                <span className="h-px w-10" style={{ backgroundColor: primaryStatusColor, opacity: 0.6 }} />
              </div>
            </div>

            {/* Center: Huge Typography ASHLEY / ئـاشـڵـی and Status Only (ستۆک / ئاوتلێت / یەدەگ) */}
            <div className="my-auto py-8 text-center flex flex-col items-center justify-center">
              
              <div 
                className="inline-block px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4 border" 
                style={{ 
                  color: primaryStatusColor, 
                  borderColor: primaryStatusColor, 
                  backgroundColor: hexToRgba(primaryStatusColor, 0.06) 
                }}
              >
                OFFICIAL COLLECTION • کەتەلۆگی فەرمی
              </div>

              {/* Huge Bold Title: ASHLEY / ئـاشـڵـی */}
              <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-widest text-slate-900 leading-none my-1 font-sans">
                ASHLEY
              </h1>
              <h2 className="text-5xl sm:text-6xl font-black tracking-wider mt-2 mb-6 font-sans" style={{ color: primaryStatusColor }}>
                ئـاشـڵـی
              </h2>

              {/* Status Badge: Only ستۆک / ئاوتلێت / یەدەگ */}
              <div 
                className="inline-flex items-center gap-4 px-10 py-3.5 rounded-2xl shadow-md text-white font-black text-3xl sm:text-4xl tracking-widest uppercase mt-2"
                style={{ backgroundColor: primaryStatusColor }}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                <span>{primaryStatus}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </div>

              {/* Decorative Geometric Seal Divider */}
              <div className="flex items-center justify-center gap-3 w-48 mt-8">
                <div className="h-0.5 flex-1" style={{ backgroundColor: primaryStatusColor, opacity: 0.4 }} />
                <div className="w-2.5 h-2.5 rotate-45" style={{ backgroundColor: primaryStatusColor }} />
                <div className="h-0.5 flex-1" style={{ backgroundColor: primaryStatusColor, opacity: 0.4 }} />
              </div>

            </div>

            {/* Bottom: 3 Required Summary Cards & Footer in Status Color */}
            <div className="pt-6 border-t-2 space-y-4" style={{ borderColor: hexToRgba(primaryStatusColor, 0.25) }}>
              
              {/* 3-Card Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                
                {/* 1. Total Models Count (کۆی گشتی مۆدێلەکان) */}
                <div 
                  className="bg-white p-4 rounded-xl border-2 text-center shadow-2xs relative overflow-hidden"
                  style={{ borderColor: primaryStatusColor }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: primaryStatusColor }} />
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
                  style={{ borderColor: primaryStatusColor }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: primaryStatusColor }} />
                  <span className="text-xs font-bold uppercase block mb-1 text-slate-600">
                    کۆی گشتی عدد
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono leading-tight my-1" style={{ color: primaryStatusColor }}>
                    {totalStockCount}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">دانە لە کۆگادا</span>
                </div>

                {/* 3. Issue Date (بەروار) */}
                <div 
                  className="bg-white p-4 rounded-xl border-2 text-center shadow-2xs relative overflow-hidden"
                  style={{ borderColor: primaryStatusColor }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: primaryStatusColor }} />
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
                  <span style={{ color: primaryStatusColor }}>ASHLEY HOMESTORE OUTLET</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">سلێمانی، عێراق</span>
                </div>
                <div 
                  className="text-white font-mono px-3.5 py-1 rounded-md font-bold text-[10px] tracking-wider uppercase"
                  style={{ backgroundColor: primaryStatusColor }}
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
