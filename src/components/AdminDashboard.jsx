import React, { useMemo } from 'react';
import { Boxes, PackageCheck, FolderTree, BadgePercent, ImageOff, CircleDollarSign, PackageX } from 'lucide-react';
import { getStatusColor } from '../utils/statusColors';

const L = (lang, ku, ar, en) => (lang === 'ar' ? ar : lang === 'en' ? en : ku);
const fmt = (n) => Number(n || 0).toLocaleString();

const statusOf = (m) => m.itemType || (m.sku && m.sku !== m.name ? m.sku : '');

function StatCard({ tone, icon: Icon, label, value, hint }) {
  const tones = {
    dark: 'bg-[#3f3f46] text-white',
    mint: 'bg-[#e4faf5] text-slate-900',
    pink: 'bg-[#fde8f3] text-slate-900',
    white: 'bg-white text-slate-900'
  };
  return (
    <div className={`rounded-3xl p-4 sm:p-5 ${tones[tone]} shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}>
      <div className="flex items-center gap-2.5">
        <Icon className={`w-5 h-5 ${tone === 'dark' ? 'text-white/90' : 'text-slate-600'}`} />
        <span className={`text-[14px] font-bold ${tone === 'dark' ? 'text-white/90' : 'text-slate-700'}`}>{label}</span>
      </div>
      <div className="mt-4 text-[28px] sm:text-[32px] font-black font-mono leading-none tracking-tight">{value}</div>
      <div className={`mt-2 text-[12px] font-semibold ${tone === 'dark' ? 'text-white/70' : 'text-slate-500'}`}>{hint}</div>
    </div>
  );
}

/**
 * Overview above the catalog (admin only). Read-only: every number is computed from the same
 * models / categories / collections the rest of the app already loaded.
 */
export default function AdminDashboard({
  lang = 'ku',
  t = {},
  models = [],
  categories = [],
  collections = [],
  customStatuses = [],
  statusColors = {}
}) {
  const stats = useMemo(() => {
    const total = models.length;
    const inStockModels = models.filter(m => Number(m.stock) > 0).length;
    const units = models.reduce((s, m) => s + (Number(m.stock) > 0 ? Number(m.stock) : 0), 0);
    const discounted = models.filter(m =>
      Number(m.salePrice) > 0 && Number(m.originalPrice) > Number(m.salePrice)
    ).length;
    const noImage = models.filter(m => !m.image).length;
    const noPrice = models.filter(m => !(Number(m.originalPrice) > 0) && !(Number(m.salePrice) > 0)).length;
    const outOfStock = total - inStockModels;

    const catName = (c) => (lang === 'ku' ? c.name_ku : lang === 'ar' ? c.name_ar : c.name_en) || c.name;
    const perCategory = categories
      .map(c => ({ id: c.id, name: catName(c), count: models.filter(m => m.categoryId === c.id).length }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const perStatus = customStatuses
      .map(st => ({ name: st, color: getStatusColor(st, statusColors), count: models.filter(m => statusOf(m) === st).length }))
      .filter(s => s.count > 0);
    const known = perStatus.reduce((s, x) => s + x.count, 0);
    if (total - known > 0) perStatus.push({ name: L(lang, 'بێ دۆخ', 'بدون حالة', 'No status'), color: '#cbd5e1', count: total - known });

    return { total, inStockModels, units, discounted, noImage, noPrice, outOfStock, perCategory, perStatus };
  }, [models, categories, customStatuses, statusColors, lang]);

  const maxCat = Math.max(1, ...stats.perCategory.map(c => c.count));
  const stockPct = stats.total ? Math.round((stats.inStockModels / stats.total) * 100) : 0;

  // donut geometry
  const R = 46;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segments = stats.perStatus.map(s => {
    const len = stats.total ? (s.count / stats.total) * C : 0;
    const seg = { ...s, len, offset: -acc };
    acc += len;
    return seg;
  });

  const attention = [
    { icon: ImageOff, label: L(lang, 'بێ وێنە', 'بدون صورة', 'No image'), value: stats.noImage, color: 'text-amber-600 bg-amber-50' },
    { icon: CircleDollarSign, label: L(lang, 'بێ نرخ', 'بدون سعر', 'No price'), value: stats.noPrice, color: 'text-rose-600 bg-rose-50' },
    { icon: PackageX, label: t.outOfStock || L(lang, 'تەواوبووە', 'نفد', 'Out of stock'), value: stats.outOfStock, color: 'text-slate-600 bg-slate-100' }
  ];

  return (
    <section className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          tone="dark"
          icon={Boxes}
          label={t.totalModels || L(lang, 'کۆی مۆدێل', 'إجمالي الموديلات', 'Total models')}
          value={fmt(stats.total)}
          hint={`${fmt(stats.inStockModels)} ${L(lang, 'بەردەستن', 'متوفر', 'available')}`}
        />
        <StatCard
          tone="mint"
          icon={PackageCheck}
          label={L(lang, 'کۆی عەدەد', 'إجمالي القطع', 'Units in stock')}
          value={fmt(stats.units)}
          hint={`${stockPct}% ${L(lang, 'ی مۆدێلەکان بەردەستن', 'من الموديلات متوفرة', 'of models available')}`}
        />
        <StatCard
          tone="pink"
          icon={FolderTree}
          label={L(lang, 'کەتەگۆری', 'التصنيفات', 'Categories')}
          value={fmt(categories.length)}
          hint={`${fmt(collections.length)} ${L(lang, 'کۆمەڵە', 'مجموعة', 'collections')}`}
        />
        <StatCard
          tone="white"
          icon={BadgePercent}
          label={L(lang, 'بە داشکاندن', 'بتخفيض', 'On discount')}
          value={fmt(stats.discounted)}
          hint={L(lang, 'مۆدێل نرخی کۆن و نوێیان هەیە', 'موديل بسعر قديم وجديد', 'models with old and new price')}
        />
      </div>

      <div className="grid md:grid-cols-[1.4fr_1fr] gap-3 sm:gap-4">
        {/* Models per category */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h3 className="text-[16px] font-extrabold text-slate-900 mb-4">
            {L(lang, 'مۆدێل بەپێی کەتەگۆری', 'الموديلات حسب التصنيف', 'Models by category')}
          </h3>
          {stats.perCategory.length === 0 ? (
            <div className="text-sm text-slate-400 py-6 text-center">{t.noResultsFound}</div>
          ) : (
            <ul className="space-y-3">
              {stats.perCategory.map(c => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="w-28 sm:w-36 shrink-0 text-[13px] font-semibold text-slate-700 truncate" title={c.name}>{c.name}</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#8f84e3]" style={{ width: `${Math.max(4, (c.count / maxCat) * 100)}%` }} />
                  </div>
                  <span className="w-10 text-end text-[13px] font-black font-mono text-slate-800">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Status donut */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h3 className="text-[16px] font-extrabold text-slate-900 mb-3">
            {t.itemStatus || L(lang, 'دۆخی کاڵا', 'حالة الصنف', 'Item status')}
          </h3>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
            <div className="relative w-[132px] h-[132px] shrink-0 mx-auto sm:mx-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="#f1f5f9" strokeWidth="14" />
                {segments.map(s => (
                  <circle
                    key={s.name}
                    cx="60" cy="60" r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="14"
                    strokeDasharray={`${Math.max(0, s.len - 2)} ${C - Math.max(0, s.len - 2)}`}
                    strokeDashoffset={s.offset}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-[24px] font-black font-mono leading-none">{stockPct}%</div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-1">{L(lang, 'بەردەست', 'متوفر', 'available')}</div>
                </div>
              </div>
            </div>
            <ul className="flex-1 min-w-0 space-y-2">
              {stats.perStatus.map(s => (
                <li key={s.name} className="flex items-center gap-2 text-[13px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 truncate font-semibold text-slate-700">{s.name}</span>
                  <span className="font-black font-mono text-slate-800">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Needs attention */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {attention.map(a => (
          <div key={a.label} className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${a.color}`}>
              <a.icon className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xl font-black font-mono leading-none text-slate-900">{fmt(a.value)}</div>
              <div className="text-[12px] font-semibold text-slate-500 mt-1 truncate">{a.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
