import React from 'react';
import { ArrowUpDown, Tag } from 'lucide-react';
import { getStatusColor, getStatusBadgeStyle } from '../utils/statusColors';

export default function FilterBar({
  t,
  lang,
  categories,
  collections,
  selectedCategory,
  setSelectedCategory,
  selectedCollection,
  setSelectedCollection,
  selectedStatus = 'all',
  setSelectedStatus,
  customStatuses = ['ستۆک', 'یەدەگ', 'ئاوتلێت'],
  statusColors = {},
  models = [],
  totalCount,
  filteredCount,
  sortBy = 'name-asc',
  setSortBy,
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
    <div className={`no-print ${embedded ? 'py-1' : 'w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4'}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Single Unified Horizontal Pill Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0 w-full sm:w-auto">
        
        {/* All Pill with Count */}
        <button
          onClick={() => {
            setSelectedCategory('all');
            setSelectedCollection('all');
          }}
          className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.6)]'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>{t.allCategories}</span>
          <span className={`ms-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            selectedCategory === 'all' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            {totalCount}
          </span>
        </button>

        {/* Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedCollection('all');
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.6)]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {getCategoryName(cat)}
            </button>
          );
        })}

        {/* Collections in the SAME row if a category is selected */}
        {relevantCollections.length > 0 && selectedCategory !== 'all' && (
          <>
            <span className="text-slate-300 mx-0.5">•</span>
            {relevantCollections.map((col) => {
              const isColSelected = selectedCollection === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollection(isColSelected ? 'all' : col.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    isColSelected
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                  }`}
                >
                  {col.name}
                </button>
              );
            })}
          </>
        )}
        </div>

        {/* Sort Selector Dropdown */}
        {setSortBy && (
          <div className="shrink-0 flex items-center gap-1.5 bg-white border border-slate-200 rounded-full ps-3 pe-2 py-1.5 hover:border-slate-300 transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={t.sortBy || 'سۆرت'}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pe-1 py-0.5"
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

      {/* Status Filters Strip (دۆخی کاڵا: ستۆک، ئاوتلێت، یەدەگ...) */}
      {setSelectedStatus && customStatuses && customStatuses.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-slate-200/70 scrollbar-none">
          <span className="text-[11px] font-black text-slate-500 shrink-0 flex items-center gap-1 px-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>دۆخی کاڵا:</span>
          </span>

          {/* All Statuses Button */}
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
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
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
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
    </div>
  );
}
