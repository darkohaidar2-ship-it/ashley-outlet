import React from 'react';
import { Check, ArrowUp, ArrowDown, Equal } from 'lucide-react';
import { getRowKeys } from '../utils/modelExtractor';
import { getCategoryColor } from '../utils/categoryColors';

// How well the row matched what the user typed (reason comes from rankExcelRowsDetailed)
const MATCH_BADGES = {
  'code-exact': { label: 'کۆدەکە ڕێک دەگرێتەوە', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'code-prefix': { label: 'سەرەتای کۆد ڕێکە', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  'model-exact': { label: 'مۆدێل ڕێکە', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  'model-prefix': { label: 'مۆدێل نزیکە', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  'code-part': { label: 'بەشێک لە کۆد', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  words: { label: 'لە ناو/وەسفدا دۆزرایەوە', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  close: { label: 'هاوشێوە (هەمان زنجیرە)', cls: 'bg-slate-100 text-slate-500 border-slate-200' }
};

/**
 * One Excel row, shown the way a human reads it:
 *   [Category]  12000·67   ← the model number in its TWO parts (model_name_en + the tail from name_en)
 *   Right-Arm Facing Sofa  ← the real description
 *   original name_en line (small) so nothing is hidden
 */
export default function ExcelRowCard({ row, reason = '', currentPrice = 0, onPick }) {
  const keys = getRowKeys(row);
  const parsed = keys.parsed || {};
  const color = getCategoryColor(row.category || '');

  const rawModel = String(row.rawModel || '').trim();
  const fullCode = keys.code || '';
  const head = parsed.head || fullCode;
  const tail = parsed.tail || '';

  // Title: the human part of name_en; for "Model - Category - Desc" rows the model name leads
  let title = parsed.desc || '';
  if (parsed.layout === 'model-category' && parsed.modelFromName) {
    title = `${parsed.modelFromName}${parsed.desc ? ' · ' + parsed.desc : ''}`;
  }
  const hasTitle = title && title.toLowerCase() !== String(row.category || '').toLowerCase();

  const price = Number(String(row.price || '0').replace(/[^0-9.\-]/g, '')) || 0;
  const cur = Number(currentPrice) || 0;
  const diff = price > 0 && cur > 0 ? price - cur : null;
  const badge = MATCH_BADGES[reason];

  return (
    <div
      className="group relative flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 pl-5 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md rounded-2xl transition-all overflow-hidden"
      dir="ltr"
    >
      {/* category colour accent */}
      <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: color }} />

      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Row 1: category · model number (two parts) · match badge */}
        <div className="flex flex-wrap items-center gap-1.5">
          {row.category && (
            <span
              className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border"
              style={{ color, borderColor: color + '55', backgroundColor: color + '14' }}
            >
              {row.category}
            </span>
          )}

          {head ? (
            <span className="inline-flex items-center font-mono text-[13px] font-black rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
              <span className="px-2 py-0.5 text-slate-500" title="model_name_en">{head}</span>
              {tail && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border-s border-emerald-200" title="variant (from name_en)">
                  {tail}
                </span>
              )}
            </span>
          ) : rawModel ? (
            <span className="font-mono text-[13px] font-black text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50">
              {rawModel}
            </span>
          ) : null}

          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`} dir="rtl">
              {badge.label}
            </span>
          )}
        </div>

        {/* Row 2: human description */}
        <div className="text-[13px] font-semibold text-slate-900 leading-snug break-words">
          {hasTitle ? title : <span className="text-slate-400 font-medium italic">وەسفی نییە لە شیتەکەدا</span>}
        </div>

        {/* Row 3: untouched originals, small */}
        <div className="text-[10.5px] text-slate-400 font-mono leading-snug break-words">
          {rawModel && <span>model_name_en: <span className="text-slate-500">{rawModel}</span> · </span>}
          name_en: <span className="text-slate-500">{row.rawDesc || '-'}</span>
        </div>
      </div>

      {/* Price + action */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <div className="text-start sm:text-end">
          <div className="font-mono font-black text-emerald-700 text-xl leading-none">${price || 0}</div>
          {diff !== null && (
            <div
              className={`mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold font-mono ${
                diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-sky-600' : 'text-slate-400'
              }`}
              title="جیاوازی لەگەڵ نرخی ئێستای کاتەلۆگ"
            >
              {diff > 0 ? <ArrowUp className="w-3 h-3" /> : diff < 0 ? <ArrowDown className="w-3 h-3" /> : <Equal className="w-3 h-3" />}
              {diff === 0 ? 'وەک نرخی ئێستا' : `${diff > 0 ? '+' : '-'}$${Math.abs(diff)}`}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onPick && onPick(row)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Check className="w-4 h-4" />
          <span>وەرگرتنی ئەم نرخە</span>
        </button>
      </div>
    </div>
  );
}
