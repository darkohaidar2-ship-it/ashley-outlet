import React from 'react';
import { ArrowUpDown, Tag, Search, Flame, X, Check } from 'lucide-react';
import { getStatusColor, getStatusBadgeStyle } from '../utils/statusColors';

export default function FilterBar({
  t,
  lang,
  categories = [],
  collections = [],
  selectedCategory,
  setSelectedCategory,
  selectedCollection,
  setSelectedCollection,
  selectedStatus = 'all',
  setSelectedStatus,
  customStatuses = ['ستۆک', 'یەدەگ', 'ئاوتلێت'],
  statusColors = {},
  models = [],
  totalCount = 0,
  filteredCount = 0,
  sortBy = 'name-asc',
  setSortBy,
  searchQuery = '',
  setSearchQuery,
  campaign = 'all',
  setCampaign,
  bfCount = 0,
  outletCount = 0,
  embedded = false
}) {
  // Collections that belong to current category
  const relevantCollections = selectedCategory === 'all'
    ? collections
    : collections.filter(c => c.categoryId === selectedCategory);

  const getCategoryName = (cat) => {
    if (lang === 'ku') return cat.name_ku || cat.name;
    if (lang === 'ar') return cat.name_ar || cat.name;
    return cat.name_en || cat.name;
  };

  return (
    <div className={`no-print ${embedded ? 'py-1' : 'w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3'}`}>
      
      {/* 1. TOP TOOLBAR: Search Box + Campaign Switcher + Sort Dropdown */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        
        {/* Search Input Bar (Placed directly under the wheel as requested) */}
        {setSearchQuery && (
          <div className="relative flex-1 min-w-[240px] max-w-lg">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="search"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ku' ? '🔍 گەڕانی دەستی بۆ ناوی مۆدێل، کۆد، کەتەگۆری...' : 'Search by model name or code...'}
              className="w-full ps-10 pe-9 py-2 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-blue-500 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 end-2.5 my-auto w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
                title="پاککردنەوە"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Campaign Switcher (هەمووی / ئاوتلێت / بلاک فرایدەی) */}
        {setCampaign && (
          <div className="flex items-center p-0.5 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => {
                setCampaign('all');
                if (setSelectedCategory) setSelectedCategory('all');
                if (setSelectedCollection) setSelectedCollection('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                campaign === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="هەموو کاڵاکان"
            >
              <span>هەمووی</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                campaign === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCampaign('outlet');
                if (setSelectedCategory) setSelectedCategory('all');
                if (setSelectedCollection) setSelectedCollection('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                campaign === 'outlet'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="بەشەکانی ئاوتلێت"
            >
              <span>🏷️ بەشەکانی ئاوتلێت</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                campaign === 'outlet' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {outletCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCampaign('black_friday');
                if (setSelectedCategory) setSelectedCategory('all');
                if (setSelectedCollection) setSelectedCollection('all');
                if (setSelectedStatus) setSelectedStatus('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                campaign === 'black_friday'
                  ? 'bg-gradient-to-r from-neutral-950 to-black text-orange-400 shadow-sm ring-1 ring-orange-500/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="سێتەکانی بلاک فرایدەی"
            >
              <Flame className={`w-3.5 h-3.5 ${campaign === 'black_friday' ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-slate-400'}`} />
              <span>👑 سێتەکانی بلاک فرایدەی</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                campaign === 'black_friday' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {bfCount}
              </span>
            </button>
          </div>
        )}

        {/* Sort Selector Dropdown */}
        {setSortBy && (
          <div className="shrink-0 flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl ps-3 pe-2 py-1.5 hover:border-slate-300 shadow-2xs transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={t.sortBy || 'سۆرت'}
              className="bg-transparent text-xs font-normal text-slate-700 outline-none cursor-pointer pe-1 py-0.5"
            >
              <option value="name-asc">{t.sortAZ || 'A ➔ Z (ئەلفوبێ)'}</option>
              <option value="name-desc">{t.sortZA || 'Z ➔ A (پێچەوانە)'}</option>
              <option value="price-asc">{t.sortPriceLow || 'نرخ: کەم بۆ زۆر'}</option>
              <option value="price-desc">{t.sortPriceHigh || 'نرخ: زۆر بۆ کەم'}</option>
              <option value="discount-desc">{t.sortDiscount || 'بەرزترین داشکاندن'}</option>
              <option value="stock-desc">{t.sortStock || 'زۆرترین عدد'}</option>
              <option value="newest">{t.sortNewest || 'نوێترین'}</option>
            </select>
          </div>
        )}

      </div>

      {/* 2. DEDICATED CATEGORY FILTER CHIPS: Strictly Separates Outlet from Black Friday Sets */}
      {setSelectedCategory && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <span className="text-[11px] font-normal text-slate-500 shrink-0 flex items-center gap-1 px-1">
            <span>{campaign === 'black_friday' ? 'سێتەکانی بلاک فرایدەی:' : 'بەشەکانی ئاوتلێت:'}</span>
          </span>

          {/* All button */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              if (setSelectedCollection) setSelectedCollection('all');
            }}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-normal transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? (campaign === 'black_friday' ? 'bg-amber-400 text-black shadow-xs font-normal' : 'bg-slate-900 text-white shadow-xs font-normal')
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{campaign === 'black_friday' ? 'هەموو سێتەکان' : (campaign === 'outlet' ? 'هەموو ئاوتلێت' : 'هەمووی')}</span>
          </button>

          {/* Categories tailored to campaign */}
          {(campaign === 'black_friday'
            ? [
                { id: 'cat-1789155949761', name: 'سێتی دانیشتن' },
                { id: 'cat-1789142347391', name: 'سێتی کۆڕنەر' },
                { id: 'cat-1792925556263', name: 'سێتی نووستن' },
                { id: 'cat-dining-room', name: 'سێتی نانخواردن' },
                { id: 'cat-sehpa', name: 'سێتی تەپڵەک و سێپایە' },
                { id: 'cat-tv-vitrine', name: 'سێتی فاترین و تیڤی' }
              ]
            : [
                { id: 'cat-1789155949761', name: 'دانیشتن / قەنەفە' },
                { id: 'cat-1789142347391', name: 'کۆڕنەر' },
                { id: 'cat-1792925556263', name: 'ژووری نووستن' },
                { id: 'cat-sehpa', name: 'سێپایە' },
                { id: 'cat-tv-vitrine', name: 'فاترین و تیڤی' }
              ]
          ).map((c) => {
            const isCatSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(isCatSelected ? 'all' : c.id);
                  if (setSelectedCollection) setSelectedCollection('all');
                }}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-normal transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCatSelected
                    ? (campaign === 'black_friday' ? 'bg-amber-400 text-black shadow-xs ring-1 ring-amber-500' : 'bg-red-600 text-white shadow-xs')
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. SUB-BAR: Active Collections (if category selected) & Status Filter Chips */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-200/60">
        
        {/* Status Filters Strip (دۆخی کاڵا: ستۆک، ئاوتلێت، یەدەگ...) - ONLY for Outlet, completely hidden in Black Friday */}
        {campaign !== 'black_friday' && setSelectedStatus && customStatuses && customStatuses.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-wrap">
            <span className="text-[11px] font-black text-slate-500 shrink-0 flex items-center gap-1 px-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>دۆخی کاڵا:</span>
            </span>

            {/* All Statuses Button */}
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>هەموو</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedStatus === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {totalCount}
              </span>
            </button>

            {/* Each Status Pill */}
            {customStatuses.map((st) => {
              const isSelected = selectedStatus === st;
              const count = models.filter(m => (m.itemType || (m.sku && m.sku !== m.name ? m.sku : '')) === st).length;
              const color = getStatusColor(st, statusColors);

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(isSelected ? 'all' : st)}
                  style={isSelected ? getStatusBadgeStyle(st, statusColors) : {}}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'shadow-xs ring-2 ring-black/10'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" 
                    style={{ backgroundColor: color }} 
                  />
                  <span>{st}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-black/10 text-inherit' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Collections in the SAME row if a category is selected */}
        {relevantCollections.length > 0 && selectedCategory !== 'all' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-slate-400 text-xs font-semibold">سێتەکان:</span>
            {relevantCollections.map((col) => {
              const isColSelected = selectedCollection === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollection(isColSelected ? 'all' : col.id)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    isColSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {col.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Active Filtered Count Indicator */}
        <div className="text-[11px] font-bold text-slate-500 ms-auto">
          <span>دەرئەنجام:</span>{' '}
          <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-black">
            {filteredCount}
          </span>{' '}
          <span>مۆدێل</span>
        </div>

      </div>

    </div>
  );
}
