import React from 'react';
import { Search, X, Layers, SlidersHorizontal } from 'lucide-react';

export default function FilterBar({
  t,
  lang,
  categories,
  collections,
  selectedCategory,
  setSelectedCategory,
  selectedCollection,
  setSelectedCollection,
  searchQuery,
  setSearchQuery,
  totalCount,
  filteredCount
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1 no-print">
      
      {/* 1. Search Bar */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full ps-10 pe-10 py-2.5 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Category Filter Pills (Windows 11 Fluent style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => {
            setSelectedCategory('all');
            setSelectedCollection('all');
          }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {t.allCategories}
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedCollection('all');
              }}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs ${
                isSelected
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {getCategoryName(cat)}
            </button>
          );
        })}
      </div>

      {/* 3. Sub-Collections Bar (If any exist for selected category) */}
      {relevantCollections.length > 0 && (
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1 ps-1">
            <Layers className="w-3.5 h-3.5" />
            {t.filterByCollection}:
          </span>

          <button
            onClick={() => setSelectedCollection('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              selectedCollection === 'all'
                ? 'bg-slate-200 text-slate-900 font-bold'
                : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            {t.allCollections}
          </button>

          {relevantCollections.map((col) => (
            <button
              key={col.id}
              onClick={() => setSelectedCollection(col.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedCollection === col.id
                  ? 'bg-red-100 text-red-700 font-bold border border-red-200'
                  : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {col.name}
            </button>
          ))}
        </div>
      )}

      {/* Quick Summary status */}
      <div className="flex items-center justify-between text-xs text-slate-500 mt-3 px-1">
        <span>
          {t.showing} <strong className="text-slate-800 font-bold">{filteredCount}</strong> / {totalCount}
        </span>
      </div>

    </div>
  );
}
