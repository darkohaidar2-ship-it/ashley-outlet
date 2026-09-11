import React from 'react';

export default function FilterBar({
  t,
  lang,
  categories,
  collections,
  selectedCategory,
  setSelectedCategory,
  selectedCollection,
  setSelectedCollection,
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 no-print">
      {/* Single Unified Horizontal Pill Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        
        {/* All Pill with Count */}
        <button
          onClick={() => {
            setSelectedCategory('all');
            setSelectedCollection('all');
          }}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>{t.allCategories}</span>
          <span className={`ms-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
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
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-red-600 text-white shadow-xs'
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
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isColSelected
                      ? 'bg-red-100 text-red-700 font-bold border border-red-200'
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
    </div>
  );
}
