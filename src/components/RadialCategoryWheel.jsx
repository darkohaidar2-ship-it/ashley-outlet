import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sofa, 
  Maximize2, 
  Coffee, 
  Bed, 
  Utensils, 
  Tv, 
  BarChart3, 
  Flame, 
  Sparkles,
  ChevronDown,
  Layers,
  ArrowRight
} from 'lucide-react';

/**
 * Returns an appropriate icon component for a category or module
 */
function getModuleIcon(id, name = '') {
  const n = (name + ' ' + id).toLowerCase();
  if (n.includes('بلاک فرایدەی') || n.includes('black friday')) return Flame;
  if (n.includes('ئامار') || n.includes('stats')) return BarChart3;
  if (n.includes('sofa') || n.includes('قەنەفە') || n.includes('دانیشتن')) return Sofa;
  if (n.includes('corner') || n.includes('کۆرنەر')) return Maximize2;
  if (n.includes('sehpa') || n.includes('سێپایە') || n.includes('مێز')) return Coffee;
  if (n.includes('bed') || n.includes('نووستن') || n.includes('نوستن')) return Bed;
  if (n.includes('dining') || n.includes('نانخواردن')) return Utensils;
  if (n.includes('tv') || n.includes('vitrine') || n.includes('فاترین')) return Tv;
  return Layers;
}

/**
 * Modern SVG arc path generator for donut slices
 */
function createWedgePath(startAngleDeg, endAngleDeg, innerR, outerR) {
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;

  const x1 = outerR * Math.cos(startRad);
  const y1 = outerR * Math.sin(startRad);
  const x2 = outerR * Math.cos(endRad);
  const y2 = outerR * Math.sin(endRad);

  const x3 = innerR * Math.cos(endRad);
  const y3 = innerR * Math.sin(endRad);
  const x4 = innerR * Math.cos(startRad);
  const y4 = innerR * Math.sin(startRad);

  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

export default function RadialCategoryWheel({
  categories = [],
  models = [],
  selectedCategory,
  onSelectCategory,
  campaign,
  setCampaign,
  logoUrl,
  totalCount = 0,
  bfCount = 0,
  outletCount = 0,
  activeTab, // 'categories' | 'stats'
  setActiveTab,
  lang = 'ku'
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger animations after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Compute model counts per category
  const categoryCounts = useMemo(() => {
    const counts = {};
    (models || []).forEach(m => {
      if (m.categoryId) {
        counts[m.categoryId] = (counts[m.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [models]);

  // Build the unified modules list (Categories + Stats + Black Friday)
  const modules = useMemo(() => {
    const colors = [
      '#10b981', // Emerald (Sofa)
      '#f59e0b', // Amber (Corner)
      '#f97316', // Orange (Sehpa)
      '#ec4899', // Pink (Bed room)
      '#8b5cf6', // Purple (Dining room)
      '#06b6d4', // Cyan (TV & Vitrine)
      '#3b82f6', // Blue (Stats)
      '#ef4444'  // Red/Fiery (Black Friday)
    ];

    const list = categories.map((cat, idx) => {
      const name = lang === 'ku' ? (cat.name_ku || cat.name) : lang === 'ar' ? (cat.name_ar || cat.name) : (cat.name_en || cat.name);
      return {
        id: cat.id,
        type: 'category',
        name,
        name_en: cat.name_en || '',
        count: categoryCounts[cat.id] || 0,
        color: colors[idx % colors.length],
        icon: getModuleIcon(cat.id, cat.name_en || cat.name_ku || cat.name)
      };
    });

    // Add Stats module
    list.push({
      id: 'module-stats',
      type: 'stats',
      name: lang === 'ku' ? 'ئامارەکان' : lang === 'ar' ? 'الإحصائيات' : 'ANALYTICS',
      name_en: 'STATISTICS',
      count: totalCount,
      color: '#3b82f6',
      icon: BarChart3
    });

    // Add Black Friday VIP module
    list.push({
      id: 'module-bf',
      type: 'black_friday',
      name: lang === 'ku' ? 'بلاک فرایدەی' : lang === 'ar' ? 'الجمعة السوداء' : 'BLACK FRIDAY',
      name_en: 'BLACK FRIDAY',
      count: bfCount,
      color: '#ff6b00',
      icon: Flame
    });

    return list;
  }, [categories, categoryCounts, lang, totalCount, bfCount]);

  const numSlices = modules.length;
  const anglePerSlice = 360 / (numSlices || 1);
  const gap = 3.5; // Gap degrees between wedges

  const innerR = 100;
  const outerR = 195;
  const labelR = 248;

  const handleModuleClick = (mod) => {
    if (mod.type === 'stats') {
      if (setActiveTab) setActiveTab('stats');
      if (onSelectCategory) onSelectCategory('stats');
    } else if (mod.type === 'black_friday') {
      if (setCampaign) setCampaign('black_friday');
      if (setActiveTab) setActiveTab('categories');
      if (onSelectCategory) onSelectCategory('all');
    } else {
      if (setActiveTab) setActiveTab('categories');
      if (onSelectCategory) {
        // Toggle if clicked again
        onSelectCategory(selectedCategory === mod.id ? 'all' : mod.id);
      }
    }

    // Smooth scroll down to content
    setTimeout(() => {
      const el = document.getElementById('catalog-content-anchor');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <section className="no-print w-full py-6 sm:py-10 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-[#1e2029] via-[#16171f] to-[#0f1015] text-white">
      
      {/* Background Decorative Ambient Radial Glows */}
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 end-1/4 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Wheel Container */}
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center relative select-none">
        
        {/* Responsive SVG Wheel */}
        <div className="relative w-full max-w-[560px] sm:max-w-[640px] aspect-square flex items-center justify-center">
          <svg
            viewBox="-320 -320 640 640"
            className="w-full h-full overflow-visible drop-shadow-2xl"
          >
            <defs>
              {/* Outer decorative dashed circle track */}
              <filter id="hub-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.5" />
              </filter>
            </defs>

            {/* Concentric Guide Circles */}
            <circle
              cx="0"
              cy="0"
              r={outerR + 10}
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <circle
              cx="0"
              cy="0"
              r={outerR + 24}
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="1"
            />

            {/* Surrounding Slices / Modules (Staggered Animation: 0.20s per segment) */}
            {modules.map((mod, idx) => {
              const startAngle = idx * anglePerSlice + gap / 2 - 90;
              const endAngle = (idx + 1) * anglePerSlice - gap / 2 - 90;
              const midAngle = (startAngle + endAngle) / 2;
              const midRad = (midAngle * Math.PI) / 180;

              const isHovered = hoveredId === mod.id;
              const isSelected = selectedCategory === mod.id || 
                (mod.type === 'black_friday' && campaign === 'black_friday') ||
                (mod.type === 'stats' && activeTab === 'stats');

              // Icon position inside wedge
              const iconR = (innerR + outerR) / 2;
              const iconX = iconR * Math.cos(midRad);
              const iconY = iconR * Math.sin(midRad);

              // Outer label line anchor
              const lineStartR = outerR + 10;
              const lineStartX = lineStartR * Math.cos(midRad);
              const lineStartY = lineStartR * Math.sin(midRad);

              const lineEndX = labelR * Math.cos(midRad);
              const lineEndY = labelR * Math.sin(midRad);

              const IconComponent = mod.icon;
              const wedgePath = createWedgePath(startAngle, endAngle, innerR, outerR);

              // Stagger delay: starts after center circle (0.25s) with 0.20s increments
              const staggerDelay = 0.25 + idx * 0.20;

              return (
                <g 
                  key={mod.id}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setHoveredId(mod.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleModuleClick(mod)}
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'scale(1)' : 'scale(0.8)',
                    transformOrigin: '0 0',
                    transition: `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s`
                  }}
                >
                  {/* Wedge Slice with scale lift on hover */}
                  <g 
                    style={{
                      transform: isHovered || isSelected ? `translate(${6 * Math.cos(midRad)}px, ${6 * Math.sin(midRad)}px)` : 'none',
                      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <path
                      d={wedgePath}
                      fill={mod.color}
                      className="transition-all duration-200"
                      style={{
                        filter: isHovered || isSelected ? `drop-shadow(0 0 16px ${mod.color}99)` : 'none',
                        opacity: isSelected ? 1 : isHovered ? 0.95 : 0.85
                      }}
                      stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.2)'}
                      strokeWidth={isSelected ? 3 : 1}
                    />

                    {/* Icon inside Wedge */}
                    <foreignObject
                      x={iconX - 18}
                      y={iconY - 18}
                      width={36}
                      height={36}
                      className="pointer-events-none"
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center text-white drop-shadow-md">
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                      </div>
                    </foreignObject>
                  </g>

                  {/* Outer Connecting Line & Dot */}
                  <line
                    x1={lineStartX}
                    y1={lineStartY}
                    x2={lineEndX}
                    y2={lineEndY}
                    stroke={mod.color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={isSelected ? 'none' : '2 2'}
                    opacity={isSelected ? 1 : isHovered ? 0.9 : 0.6}
                  />
                  <circle
                    cx={lineEndX}
                    cy={lineEndY}
                    r={isSelected ? 4 : 2.5}
                    fill={mod.color}
                  />

                  {/* Outer Name & Count Pill outside the wheel */}
                  <foreignObject
                    x={lineEndX - 65}
                    y={lineEndY - 15}
                    width={130}
                    height={32}
                    className="overflow-visible pointer-events-none"
                  >
                    <div 
                      className={`px-2.5 py-0.5 rounded-full backdrop-blur-md flex items-center justify-center gap-1.5 transition-all text-center shadow-lg ${
                        isSelected 
                          ? 'bg-white text-slate-900 ring-2 ring-white scale-105 font-black' 
                          : isHovered
                          ? 'bg-neutral-900/95 text-white ring-1 ring-white/50 scale-105 font-bold'
                          : 'bg-[#181922]/90 text-neutral-200 border border-white/10 font-bold'
                      }`}
                      style={{
                        borderColor: isSelected ? undefined : mod.color
                      }}
                    >
                      <span className="text-[10px] sm:text-[11px] truncate leading-tight">
                        {mod.name}
                      </span>
                      {mod.count !== undefined && (
                        <span 
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-extrabold ${
                            isSelected ? 'bg-slate-900 text-white' : 'bg-white/20 text-white'
                          }`}
                        >
                          {mod.count}
                        </span>
                      )}
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {/* ========================================================
                CENTER CIRCLE (Appears at 0.25s)
                Ashley Logo + "ashley suli | by darko"
               ======================================================== */}
            <g
              onClick={() => {
                // Clicking center reveals all or resets filter
                if (onSelectCategory) onSelectCategory('all');
                if (setActiveTab) setActiveTab('categories');
                if (setCampaign) setCampaign('all');
              }}
              className="cursor-pointer group"
              style={{
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'scale(1)' : 'scale(0.3)',
                transformOrigin: '0 0',
                transition: 'opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s'
              }}
            >
              {/* Center Drop Shadow & Glow */}
              <circle
                cx="0"
                cy="0"
                r={innerR - 6}
                fill="#ffffff"
                className="transition-all duration-300 group-hover:scale-105"
                filter="url(#hub-glow)"
                stroke="#e2e8f0"
                strokeWidth="4"
              />

              {/* Decorative Subtle Ring */}
              <circle
                cx="0"
                cy="0"
                r={innerR - 12}
                fill="none"
                stroke="rgba(0, 0, 0, 0.06)"
                strokeWidth="1.5"
              />

              {/* Center Content: Ashley Logo + "ashley suli | by darko" */}
              <foreignObject
                x={-(innerR - 14)}
                y={-(innerR - 14)}
                width={(innerR - 14) * 2}
                height={(innerR - 14) * 2}
                className="pointer-events-none"
              >
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 select-none">
                  {/* Ashley Logo */}
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Ashley Logo"
                      className="h-9 sm:h-11 max-w-[120px] object-contain mb-1 transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                      ASHLEY
                    </div>
                  )}

                  {/* Required Subtitle by User: ashley suli | by darko */}
                  <div className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs mt-1">
                    ashley suli | by darko
                  </div>

                  {/* Interactive Hint */}
                  <div className="text-[8.5px] font-bold text-slate-400 mt-1 flex items-center gap-0.5 opacity-80">
                    <span>{selectedCategory && selectedCategory !== 'all' ? 'کرتە بکە بۆ هەمووی' : 'کەتەلۆگی سەرەکی'}</span>
                  </div>
                </div>
              </foreignObject>
            </g>

          </svg>
        </div>

        {/* Dynamic Interactive Callout below Wheel */}
        <div className="mt-4 flex flex-col items-center justify-center text-center">
          {selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'stats' ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-lg animate-fadeIn">
              <span>بەشی هەڵبژێردراو:</span>
              <span className="text-amber-400 font-black">
                {modules.find(m => m.id === selectedCategory)?.name || ''}
              </span>
              <button
                onClick={() => onSelectCategory && onSelectCategory('all')}
                className="ms-1.5 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
              >
                پیشاندانی هەمووی
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>کرتە لەسەر هەر بەشێکی بازنەکە بکە بۆ کردنەوەی کاڵاکانی لە خوارەوە</span>
              <ChevronDown className="w-4 h-4 text-neutral-400 animate-bounce" />
            </div>
          )}
        </div>

      </div>

    </section>
  );
}
