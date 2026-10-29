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
export default function StoreHero({ lang = 'ku', models = [], categories = [], collections = [], onOpenModel }) {
  const c = COPY[lang] || COPY.ku;

  const featured = useMemo(() => {
    const withImage = models.filter(m => m.image && Number(m.stock) > 0);
    const pool = withImage.length ? withImage : models.filter(m => m.image);
    if (!pool.length) return null;
    // stable pick (same model for a given catalog) - the one with the most stock
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
      <div className="relative overflow-hidden rounded-[28px] bg-blue-600 text-white">
        {/* soft light shape, like the reference diagonal */}
        <div className="absolute -end-24 -top-24 w-[420px] h-[420px] rounded-full bg-white/10" />
        <div className="absolute end-24 -bottom-40 w-[360px] h-[360px] rounded-full bg-white/[0.07]" />

        <div className="relative grid md:grid-cols-[1.25fr_1fr] items-center gap-6 p-6 sm:p-8 lg:p-10">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-black leading-[1.2] tracking-tight">
              {c.title}
            </h1>
            <p className="mt-3 text-sm sm:text-[15px] text-blue-100 leading-relaxed max-w-xl">
              {c.sub}
            </p>

            <div className="mt-6 grid grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-2.5">
              {stats.map(([value, label]) => (
                <div key={label} className="sm:min-w-[88px] rounded-2xl bg-white/10 border border-white/15 px-2.5 sm:px-4 py-2.5">
                  <div className="text-xl sm:text-2xl font-black font-mono leading-none">{Number(value).toLocaleString()}</div>
                  <div className="mt-1 text-[11px] font-semibold text-blue-100">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {featured && (
            <button
              type="button"
              onClick={() => onOpenModel && onOpenModel(featured)}
              className="hidden md:block justify-self-end w-full max-w-[340px] text-start group"
              title={featured.name}
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white/10 ring-4 ring-white/20">
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
