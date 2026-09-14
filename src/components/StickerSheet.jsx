import React from 'react';
import { getStatusColor, hexToRgba } from '../utils/statusColors';

export default function StickerSheet({
  id,
  className = '',
  stickersToPrint = [],
  categories = [],
  collections = [],
  logoUrl = '',
  statusColors = {},
  t = {},
  lang = 'ku'
}) {
  if (!stickersToPrint || stickersToPrint.length === 0) return null;

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

  const currentDate = new Date().toLocaleDateString(
    lang === 'ku' ? 'ckb' : lang === 'ar' ? 'ar-IQ' : 'en-US',
    { year: 'numeric', month: '2-digit', day: '2-digit' }
  );

  return (
    <div id={id || undefined} className={`sticker-sheet-root ${className}`}>
      {stickersToPrint.map((model, idx) => {
        const catName = getCategoryName(model.categoryId);
        const colName = getCollectionName(model.collectionId);

        const itemStatus =
          model.itemType || (model.sku && model.sku !== model.name ? model.sku : 'ئاوتلێت');
        const themeColor = getStatusColor(itemStatus, statusColors);
        const hasNotes = Boolean(model.notes && model.notes.trim());

        return (
          <div
            key={model.id || idx}
            className="sticker-label-card relative flex flex-col justify-between overflow-hidden p-5 sm:p-6 rounded-2xl shadow-md min-h-[300px]"
            style={{
              backgroundColor: themeColor,
              '--sticker-theme': themeColor,
              color: '#ffffff'
            }}
          >
            {/* Top Bar: Ashley Logo (Left), Item Status (Center), Date (Right) */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/25">
              
              {/* 1. Left Corner: Ashley Outlet Official Logo */}
              <div className="bg-white text-slate-900 px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Ashley"
                    className="h-5 max-w-[85px] object-contain"
                  />
                ) : (
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white font-black text-xs shrink-0"
                    style={{ backgroundColor: themeColor }}
                  >
                    A
                  </div>
                )}
                <div className="flex items-center gap-1 leading-none font-black text-xs tracking-tight">
                  <span>ASHLEY</span>
                  <span
                    className="text-white text-[8px] font-bold px-1 py-0.2 rounded-xs uppercase"
                    style={{ backgroundColor: themeColor }}
                  >
                    OUTLET
                  </span>
                </div>
              </div>

              {/* 2. Top Center: Status / Item Type Badge with matching status colors */}
              <div className="bg-white text-slate-900 px-4 py-1 rounded-full shadow-md flex items-center gap-2 shrink-0 border border-white/50">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: themeColor }}
                />
                <span
                  className="font-black text-sm sm:text-base leading-none tracking-wide uppercase"
                  style={{ color: themeColor }}
                >
                  {itemStatus}
                </span>
              </div>

              {/* 3. Top Right Corner: Small Date */}
              <div className="bg-black/35 text-white/95 text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs text-end shrink-0 leading-tight">
                <span className="opacity-80 block text-[8px]">DATE / بەروار</span>
                <span className="font-mono">{currentDate}</span>
              </div>
            </div>

            {/* Middle Section: Large Model Number */}
            <div className={`bg-white text-slate-900 rounded-2xl p-4 text-center shadow-lg border-2 border-white/60 flex flex-col justify-center items-center ${hasNotes ? 'my-2.5 sm:p-4' : 'flex-1 my-3 sm:py-8'}`}>
              <div className="flex items-center justify-center gap-2 mb-1 text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                <span>{catName || 'مۆبێلی ئاشڵی'}</span>
                {colName && (
                  <>
                    <span>•</span>
                    <span style={{ color: themeColor }}>{colName}</span>
                  </>
                )}
              </div>

              {/* Ultra-Large Model Number Typography */}
              <h2 className={`${hasNotes ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-4xl sm:text-5xl md:text-6xl'} font-black font-mono tracking-wider text-slate-900 leading-tight`}>
                {model.name}
              </h2>
            </div>

            {/* Notes Section: ONLY rendered if model.notes exists and has content */}
            {hasNotes && (
              <div className="mb-2.5 bg-white/95 text-slate-900 rounded-2xl p-3 shadow-md border border-white/40 flex-1 flex flex-col justify-start">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider pb-1 border-b border-slate-200" style={{ color: themeColor }}>
                  <span>تێبینی و تایبەتمەندییەکان / NOTES:</span>
                  {model.stock > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-md font-bold text-[10px]">
                      عدد: {model.stock} دانە
                    </span>
                  )}
                </div>
                <p className="font-bold text-sm sm:text-base text-slate-900 mt-1.5 whitespace-pre-line leading-relaxed">
                  {model.notes}
                </p>
              </div>
            )}

            {/* Bottom Bar: Stock Badge & Ashley Quality Stamp (NO PRICE) */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/20 flex-wrap">
              {model.stock > 0 && !hasNotes ? (
                <div className="bg-white text-slate-900 px-3.5 py-1 rounded-xl shadow-md font-black text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }} />
                  <span>عدد: {model.stock} دانە</span>
                </div>
              ) : (
                <div className="bg-white/20 text-white px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-xs">
                  {colName || catName || 'Ashley Outlet'}
                </div>
              )}

              {/* Ashley Outlet Verification Stamp */}
              <div className="bg-black/30 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-xs flex items-center gap-1.5 ms-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs" />
                <span className="tracking-wide">ORIGINAL ASHLEY QUALITY</span>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
