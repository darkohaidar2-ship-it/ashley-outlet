import React, { useMemo } from 'react';
import { getOptimizedImageUrl } from '../utils/imageUrl';

const COPY = {
  ku: {
    title: 'ئەلبوومی مۆبلیاتی Ashley Outlet',
    sub: 'هەموو مۆدێلەکان، نرخ و بەردەستبوون لە یەک شوێن. گەڕان بکە، فلتەر بکە و ڕاستەوخۆ چاپی بکە.',
    models: 'مۆدێل',
    inStock: 'بەردەست',
    categories: 'کەتەگۆری',
    collections: 'کۆمەڵە'
  },
  ar: {
    title: 'ألبوم أثاث Ashley Outlet',
    sub: 'كل الموديلات والأسعار والتوفر في مكان واحد. ابحث، صفّي، واطبع مباشرة.',
    models: 'موديل',
    inStock: 'متوفر',
    categories: 'تصنيف',
    collections: 'مجموعة'
  },
  en: {
    title: 'Ashley Outlet furniture album',
    sub: 'Every model, price and stock level in one place. Search, filter and print straight away.',
    models: 'Models',
    inStock: 'In stock',
    categories: 'Categories',
    collections: 'Collections'
  }
};

/**
 * Storefront hero (viewer mode). Everything shown is real catalog data:
 * the numbers are live counts and the picture is one of the catalog's own models.
 */
export default function StoreHero({ 
  lang = 'ku', 
  models = [], 
  categories = [], 
  collections = [], 
  campaign = 'black_friday',
  onOpenModel 
}) {
  const isBF = campaign === 'black_friday';
  const c = COPY[lang] || COPY.ku;

  const bfTitle = lang === 'ku' 
    ? '🔥 کەمپەینی گەورەی BLACK FRIDAY' 
    : lang === 'ar' 
    ? '🔥 عروض الجمعة السوداء BLACK FRIDAY' 
    : '🔥 BLACK FRIDAY EXCLUSIVE DEALS';

  const bfSub = lang === 'ku'
    ? 'سێت و مۆدێلە هەڵبژێردراوەکانی ئاشڵی بە داشکاندنی ناوازە و دیزاینی تایبەت.'
    : lang === 'ar'
    ? 'تشكيلات وموديلات آشلي المختارة بخصومات حصرية وتصاميم مميزة.'
    : 'Selected Ashley furniture sets & models with exclusive Black Friday promotional pricing.';

  const featured = useMemo(() => {
    const withImage = models.filter(m => m.image && Number(m.stock) > 0);
    const pool = withImage.length ? withImage : models.filter(m => m.image);
    if (!pool.length) return null;
    return [...pool].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))[0];
  }, [models]);

  const inStock = models.filter(m => Number(m.stock) > 0).length;
  const stats = [
    [models.length, c.models],
    [inStock, c.inStock],
    [categories.length, c.categories],
    [collections.length, c.collections]
  ];

  return (
    <section className="no-print max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      <div className={`relative overflow-hidden rounded-[28px] text-white transition-all duration-500 ${
        isBF
          ? 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-black border-2 border-orange-500/40 shadow-2xl shadow-orange-950/40'
          : 'bg-blue-600 shadow-md'
      }`}>
        {/* Glow Effects */}
        {isBF ? (
          <>
            <div className="absolute -end-20 -top-20 w-[420px] h-[420px] rounded-full bg-orange-600/20 blur-3xl pointer-events-none" />
            <div className="absolute start-1/3 -bottom-32 w-[380px] h-[380px] rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute -end-24 -top-24 w-[420px] h-[420px] rounded-full bg-white/10" />
            <div className="absolute end-24 -bottom-40 w-[360px] h-[360px] rounded-full bg-white/[0.07]" />
          </>
        )}

        <div className="relative grid md:grid-cols-[1.25fr_1fr] items-center gap-6 p-6 sm:p-8 lg:p-10">
          <div>
            {isBF && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-black uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span>LIMITED TIME CAMPAIGN 2026</span>
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-black leading-[1.2] tracking-tight">
              {isBF ? bfTitle : c.title}
            </h1>
            <p className={`mt-3 text-sm sm:text-[15px] leading-relaxed max-w-xl ${isBF ? 'text-neutral-300' : 'text-blue-100'}`}>
              {isBF ? bfSub : c.sub}
            </p>

            <div className="mt-6 grid grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-2.5">
              {stats.map(([value, label]) => (
                <div 
                  key={label} 
                  className={`sm:min-w-[88px] rounded-2xl px-2.5 sm:px-4 py-2.5 transition-all ${
                    isBF 
                      ? 'bg-neutral-900/90 border border-orange-500/30 text-white' 
                      : 'bg-white/10 border border-white/15'
                  }`}
                >
                  <div className={`text-xl sm:text-2xl font-black font-mono leading-none ${isBF ? 'text-orange-400' : 'text-white'}`}>
                    {Number(value).toLocaleString()}
                  </div>
                  <div className={`mt-1 text-[11px] font-semibold ${isBF ? 'text-neutral-400' : 'text-blue-100'}`}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {featured && (
            <button
              type="button"
              onClick={() => onOpenModel && onOpenModel(featured)}
              className="hidden md:block justify-self-end w-full max-w-[340px] text-start group cursor-pointer"
              title={featured.name}
            >
              <div className={`aspect-[4/3] rounded-3xl overflow-hidden ${
                isBF 
                  ? 'bg-neutral-900 ring-4 ring-orange-500/30' 
                  : 'bg-white/10 ring-4 ring-white/20'
              }`}>
                <img
                  src={getOptimizedImageUrl(featured.image, 'card')}
                  alt={featured.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="mt-2.5 px-1 text-[13px] font-bold text-white/95 line-clamp-1">{featured.name}</div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
