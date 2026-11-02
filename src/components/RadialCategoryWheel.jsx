import React, { useState, useMemo } from 'react';
import { 
  Sofa, 
  Maximize2, 
  Coffee, 
  Bed, 
  Utensils, 
  Tv, 
  BarChart3, 
  Flame, 
  Crown,
  ChevronDown
} from 'lucide-react';

/**
 * SVG arc path generator for donut slices
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

/**
 * SVG arc path generator between two angles with radius r
 */
function describeArc(cx, cy, r, startAngleDeg, endAngleDeg) {
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const angleDiff = ((endAngleDeg - startAngleDeg) % 360 + 360) % 360;
  const largeArc = angleDiff > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export default function RadialCategoryWheel({
  categories = [],
  models = [],
  selectedCategory,
  onSelectCategory,
  campaign = 'outlet',
  setCampaign,
  logoUrl,
  totalCount = 0,
  bfCount = 0,
  outletCount = 0,
  activeTab,
  setActiveTab,
  lang = 'ku'
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const isBFMode = campaign === 'black_friday';

  // Compute model counts per category for Black Friday vs Outlet
  const categoryCounts = useMemo(() => {
    const counts = {};
    (models || []).forEach(m => {
      const isBF = (m.itemType || m.sku || '').toLowerCase().includes('بلاک فرایدەی') || 
                   (m.itemType || m.sku || '').toLowerCase().includes('black friday');
      if (isBFMode ? isBF : !isBF) {
        if (m.categoryId) {
          counts[m.categoryId] = (counts[m.categoryId] || 0) + 1;
        }
      }
    });
    return counts;
  }, [models, isBFMode]);

  // Build the dynamic modules list:
  // Black Friday: Shows the 6 specific Set Categories (including Dining Room!)
  // Outlet: Shows the Outlet Categories (NO Dining Room, since Dining has 0 outlet models!)
  const rawModules = useMemo(() => {
    if (isBFMode) {
      return [
        {
          id: 'cat-1789155949761',
          name: lang === 'ku' ? 'سێتی سۆفا' : 'Sofa Sets',
          count: categoryCounts['cat-1789155949761'] || 0,
          color: '#1a1922',
          icon: Sofa,
          weight: 1,
          isBF: true
        },
        {
          id: 'cat-1789142347391',
          name: lang === 'ku' ? 'سێتی کۆڕنەر' : 'Corner Sets',
          count: categoryCounts['cat-1789142347391'] || 0,
          color: '#1c1722',
          icon: Maximize2,
          weight: 1,
          isBF: true
        },
        {
          id: 'cat-sehpa',
          name: lang === 'ku' ? 'سێتی تەپڵەک' : 'Sehpa Sets',
          count: categoryCounts['cat-sehpa'] || 0,
          color: '#1c1b18',
          icon: Coffee,
          weight: 1,
          isBF: true
        },
        {
          id: 'cat-1792925556263',
          name: lang === 'ku' ? 'سێتی نووستن' : 'Bedroom Sets',
          count: categoryCounts['cat-1792925556263'] || 0,
          color: '#211818',
          icon: Bed,
          weight: 1,
          isBF: true
        },
        {
          id: 'cat-dining-room',
          name: lang === 'ku' ? 'سێتی نانخواردن' : 'Dining Sets',
          count: categoryCounts['cat-dining-room'] || 0,
          color: '#1f1a14',
          icon: Utensils,
          weight: 1,
          isBF: true
        },
        {
          id: 'cat-tv-vitrine',
          name: lang === 'ku' ? 'سێتی فاترین' : 'TV & Vitrine Sets',
          count: categoryCounts['cat-tv-vitrine'] || 0,
          color: '#1b171f',
          icon: Tv,
          weight: 1,
          isBF: true
        }
      ];
    }

    // OUTLET MODE: 5 Outlet categories + Stats module (Excludes Dining Room!)
    return [
      {
        id: 'cat-1789155949761',
        name: lang === 'ku' ? 'قەنەفە' : 'Sofa',
        count: categoryCounts['cat-1789155949761'] || 0,
        color: '#0d9488',
        icon: Sofa,
        weight: 1,
        isOutlet: true
      },
      {
        id: 'cat-1789142347391',
        name: lang === 'ku' ? 'کۆرنەر' : 'Corner',
        count: categoryCounts['cat-1789142347391'] || 0,
        color: '#f59e0b',
        icon: Maximize2,
        weight: 1,
        isOutlet: true
      },
      {
        id: 'cat-sehpa',
        name: lang === 'ku' ? 'سێپایە' : 'Sehpa',
        count: categoryCounts['cat-sehpa'] || 0,
        color: '#ea580c',
        icon: Coffee,
        weight: 1,
        isOutlet: true
      },
      {
        id: 'cat-1792925556263',
        name: lang === 'ku' ? 'ژووری نووستن' : 'Bed room',
        count: categoryCounts['cat-1792925556263'] || 0,
        color: '#db2777',
        icon: Bed,
        weight: 1,
        isOutlet: true
      },
      {
        id: 'cat-tv-vitrine',
        name: lang === 'ku' ? 'فاترین و تیڤی' : 'TV & Vitrine',
        count: categoryCounts['cat-tv-vitrine'] || 0,
        color: '#0284c7',
        icon: Tv,
        weight: 1,
        isOutlet: true
      },
      {
        id: 'module-stats',
        type: 'stats',
        name: lang === 'ku' ? 'ئامارەکان' : 'Stats',
        count: outletCount,
        color: '#4f46e5',
        icon: BarChart3,
        weight: 1,
        isOutlet: false
      }
    ];
  }, [isBFMode, categoryCounts, lang, outletCount]);

  const totalWeight = useMemo(() => {
    return rawModules.reduce((sum, m) => sum + (m.weight || 1), 0);
  }, [rawModules]);

  const gap = 3.6; // Clean gap between wedges
  const innerR = 100;
  const outerR = 216; // Generous depth for icon and text

  const modulesWithAngles = useMemo(() => {
    let currentAngle = -90; // Start at top 12 o'clock
    return rawModules.map((mod, idx) => {
      const span = (mod.weight / totalWeight) * 360;
      const startAngle = currentAngle + gap / 2;
      const endAngle = currentAngle + span - gap / 2;
      const midAngle = currentAngle + span / 2;
      currentAngle += span;

      return {
        ...mod,
        idx,
        span,
        startAngle,
        endAngle,
        midAngle
      };
    });
  }, [rawModules, totalWeight, gap]);

  // Outlet bracket arc boundaries
  const outletArcData = useMemo(() => {
    const outlets = modulesWithAngles.filter(m => m.isOutlet);
    if (outlets.length === 0) return null;
    const first = outlets[0];
    const last = outlets[outlets.length - 1];
    const startAngle = first.startAngle - (gap / 2);
    const endAngle = last.endAngle + (gap / 2);
    const midAngle = (startAngle + endAngle) / 2;
    return {
      startAngle,
      endAngle,
      midAngle,
      count: outlets.reduce((sum, o) => sum + (o.count || 0), 0)
    };
  }, [modulesWithAngles, gap]);

  const handleModuleClick = (mod) => {
    if (mod.type === 'stats') {
      if (setActiveTab) setActiveTab('stats');
      if (onSelectCategory) onSelectCategory('stats');
    } else {
      if (setActiveTab) setActiveTab('categories');
      if (onSelectCategory) {
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
    <section className="no-print w-full pt-6 pb-10 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-[#161720] via-[#121318] to-[#0a0a0d] text-white">
      
      {/* Background Decorative Ambient Radial Glows */}
      <div className={`absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
        isBFMode ? 'bg-orange-600/10' : 'bg-blue-600/10'
      }`} />
      <div className={`absolute top-1/4 end-1/5 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
        isBFMode ? 'bg-amber-500/10' : 'bg-red-600/10'
      }`} />

      {/* Main Wheel Container */}
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center relative select-none">
        
        {/* Apple-grade Liquid Glass Segmented World Switcher */}
        <div className="flex items-center p-1 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_10px_35px_-5px_rgba(0,0,0,0.7)] mb-6 z-10">
          <button
            type="button"
            onClick={() => {
              if (setCampaign) setCampaign('outlet');
              if (onSelectCategory) onSelectCategory('all');
            }}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-black transition-all duration-300 flex items-center gap-2 cursor-pointer ${
              !isBFMode 
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-[0_0_25px_rgba(239,68,68,0.65)] ring-2 ring-red-400/60 scale-102' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>🏷️ بەشەکانی ئاوتلێت</span>
            <span className={`text-[10.5px] font-mono font-black px-2 py-0.5 rounded-full ${!isBFMode ? 'bg-black/30 text-white' : 'bg-white/10 text-neutral-300'}`}>
              {outletCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (setCampaign) setCampaign('black_friday');
              if (onSelectCategory) onSelectCategory('all');
            }}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-black transition-all duration-300 flex items-center gap-2 cursor-pointer ${
              isBFMode 
                ? 'bg-gradient-to-r from-neutral-950 via-black to-neutral-950 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] ring-2 ring-amber-400 scale-102 border border-amber-300/50' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Crown className={`w-4 h-4 shrink-0 ${isBFMode ? 'text-amber-300 animate-bounce' : 'text-neutral-400'}`} />
            <span>سێتەکانی بلاک فرایدەی</span>
            <span className={`text-[10.5px] font-mono font-black px-2 py-0.5 rounded-full ${isBFMode ? 'bg-amber-400 text-black' : 'bg-white/10 text-neutral-300'}`}>
              {bfCount}
            </span>
          </button>
        </div>

        {/* Responsive Animated SVG Wheel with Apple Spring Morphing */}
        <div 
          key={campaign} 
          className="relative w-full max-w-[560px] sm:max-w-[640px] aspect-square flex items-center justify-center animate-apple-spring"
        >
          <svg
            viewBox="-350 -350 700 700"
            className="w-full h-full overflow-visible drop-shadow-2xl"
          >
            <defs>
              {/* Metallic Gold Shimmer Gradient */}
              <linearGradient id="gold-shimmer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#cf9b32">
                  <animate attributeName="stop-color" values="#cf9b32;#fceda2;#ffd700;#b8860b;#cf9b32" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#ffd700">
                  <animate attributeName="stop-color" values="#ffd700;#b8860b;#cf9b32;#fceda2;#ffd700" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#b8860b">
                  <animate attributeName="stop-color" values="#b8860b;#cf9b32;#fceda2;#ffd700;#b8860b" dur="3s" repeatCount="indefinite" />
                </stop>
              </linearGradient>

              {/* Gentle Water Reflection Ripple Gradient for Outlet Strokes */}
              <linearGradient id="water-ripple-red" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444">
                  <animate attributeName="stop-color" values="#ef4444;#fca5a5;#ef4444;#dc2626;#ef4444" dur="4s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#ff9999">
                  <animate attributeName="stop-color" values="#ff9999;#ffffff;#ef4444;#ff9999" dur="4s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#dc2626">
                  <animate attributeName="stop-color" values="#dc2626;#ef4444;#fca5a5;#dc2626" dur="4s" repeatCount="indefinite" />
                </stop>
              </linearGradient>

              {/* Hub Shadow */}
              <filter id="hub-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.75" />
              </filter>
            </defs>

            {/* Subtle Inner Hub Track Guide */}
            <circle
              cx="0"
              cy="0"
              r={innerR - 4}
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.2"
            />

            {/* Subtle Divider Lines between Wedges */}
            {modulesWithAngles.map((mod) => {
              const boundAngle = mod.startAngle - (gap / 2);
              const boundRad = (boundAngle * Math.PI) / 180;
              const divInnerX = (innerR - 2) * Math.cos(boundRad);
              const divInnerY = (innerR - 2) * Math.sin(boundRad);
              const divOuterX = (outerR + 4) * Math.cos(boundRad);
              const divOuterY = (outerR + 4) * Math.sin(boundRad);

              return (
                <line
                  key={`divider-${mod.id}`}
                  x1={divInnerX}
                  y1={divInnerY}
                  x2={divOuterX}
                  y2={divOuterY}
                  stroke="rgba(255, 255, 255, 0.14)"
                  strokeWidth="1"
                  className="pointer-events-none"
                />
              );
            })}

            {/* Delicate Connecting Hairline & Title Badge for Outlet Mode */}
            {!isBFMode && outletArcData && (() => {
              const startRad = (outletArcData.startAngle * Math.PI) / 180;
              const endRad = (outletArcData.endAngle * Math.PI) / 180;
              const midRad = (outletArcData.midAngle * Math.PI) / 180;
              const guideR = outerR + 14;

              const labelX = (guideR + 24) * Math.cos(midRad);
              const labelY = (guideR + 24) * Math.sin(midRad);

              return (
                <g key="outlet-delicate-bracket" className="select-none">
                  {/* Delicate Thin Connecting Hairline across all Outlet Strokes */}
                  <path
                    d={describeArc(0, 0, guideR, outletArcData.startAngle, outletArcData.endAngle)}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.75"
                  />
                  <circle cx={guideR * Math.cos(startRad)} cy={guideR * Math.sin(startRad)} r="2.5" fill="#ef4444" />
                  <circle cx={guideR * Math.cos(endRad)} cy={guideR * Math.sin(endRad)} r="2.5" fill="#ef4444" />
                  <line
                    x1={guideR * Math.cos(midRad)}
                    y1={guideR * Math.sin(midRad)}
                    x2={(guideR + 14) * Math.cos(midRad)}
                    y2={(guideR + 14) * Math.sin(midRad)}
                    stroke="#ef4444"
                    strokeWidth="1"
                    opacity="0.8"
                  />

                  {/* Single Unified "بەشی ئاوتلێت" Badge */}
                  <foreignObject
                    x={labelX - 70}
                    y={labelY - 14}
                    width={140}
                    height={28}
                    className="overflow-visible pointer-events-auto cursor-pointer"
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory('all');
                    }}
                  >
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-[#1a0a0d]/90 hover:bg-red-950 text-red-300 hover:text-white rounded-full border border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.35)] backdrop-blur-md transition-all hover:scale-105 active:scale-95">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                      <span className="text-[11px] font-black tracking-wide">بەشی ئاوتلێت</span>
                      <span className="text-[9px] font-mono opacity-80 font-bold bg-red-900/60 text-red-200 px-1.5 py-0.2 rounded-full">
                        {outletCount}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })()}

            {/* Surrounding Slices / Modules */}
            {modulesWithAngles.map((mod) => {
              const midRad = (mod.midAngle * Math.PI) / 180;
              const isHovered = hoveredId === mod.id;
              const isSelected = selectedCategory === mod.id || (mod.type === 'stats' && activeTab === 'stats');

              const midR = (innerR + outerR) / 2;
              const contentX = midR * Math.cos(midRad);
              const contentY = midR * Math.sin(midRad);

              const IconComponent = mod.icon;
              const wedgePath = createWedgePath(mod.startAngle, mod.endAngle, innerR, outerR);

              return (
                <g 
                  key={mod.id}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setHoveredId(mod.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleModuleClick(mod)}
                >
                  {/* Wedge Slice with scale lift on hover */}
                  <g 
                    style={{
                      transform: isHovered || isSelected ? `translate(${8 * Math.cos(midRad)}px, ${8 * Math.sin(midRad)}px)` : 'none',
                      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {/* Wedge Path */}
                    <path
                      d={wedgePath}
                      fill={mod.isBF ? mod.color : mod.color}
                      className="transition-all duration-200"
                      style={{
                        filter: isHovered || isSelected || mod.isBF 
                          ? (mod.isBF ? 'drop-shadow(0 0 16px rgba(245,158,11,0.5))' : `drop-shadow(0 0 14px ${mod.color}99)`) 
                          : 'none',
                        opacity: isSelected ? 1 : isHovered ? 0.98 : 0.88
                      }}
                      stroke={
                        mod.isBF 
                          ? (isSelected ? '#ffffff' : isHovered ? '#ffd700' : 'rgba(255,215,0,0.5)')
                          : isSelected 
                          ? '#ffffff' 
                          : mod.isOutlet 
                          ? 'url(#water-ripple-red)' 
                          : 'rgba(255,255,255,0.22)'
                      }
                      strokeWidth={mod.isBF ? (isSelected ? 3 : 2) : (isSelected ? 3 : mod.isOutlet ? 2 : 1.2)}
                    />

                    {/* Content INSIDE the Wedge: Icon + Section Name directly inside! */}
                    <foreignObject
                      x={contentX - 48}
                      y={contentY - 36}
                      width={96}
                      height={72}
                      className="pointer-events-none"
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center text-center select-none">
                        
                        {/* Icon */}
                        <div className={`flex items-center justify-center rounded-xl p-1 mb-0.5 ${
                          mod.isBF ? 'text-amber-300 drop-shadow-md' : 'text-white drop-shadow-md'
                        }`}>
                          <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                        </div>

                        {/* Category Name Written Directly INSIDE the Wedge */}
                        <div className={`font-black tracking-tight leading-tight px-1 ${
                          mod.isBF 
                            ? 'text-amber-200 text-xs sm:text-[12.5px] drop-shadow-sm' 
                            : 'text-white text-[11px] sm:text-xs drop-shadow-md'
                        }`}>
                          {mod.name}
                        </div>

                        {/* Sub-tag inside wedge: Shows Count */}
                        <div className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-full mt-0.5 ${
                          mod.isBF 
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-300/30' 
                            : mod.isOutlet 
                            ? 'bg-red-600/90 text-white shadow-2xs' 
                            : 'bg-white/20 text-white'
                        }`}>
                          {mod.isBF ? `${mod.count} سێت` : `${mod.count} مۆدێل`}
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                </g>
              );
            })}

            {/* ========================================================
                CENTER CIRCLE (Hub)
                In Black Friday: VIP Gold Crest
                In Outlet: Ashley Logo + "ashley suli | by darko"
               ======================================================== */}
            <g
              onClick={() => {
                if (onSelectCategory) onSelectCategory('all');
                if (setActiveTab) setActiveTab('categories');
              }}
              className="cursor-pointer group"
            >
              {/* Center Disk */}
              <circle
                cx="0"
                cy="0"
                r={innerR - 6}
                fill={isBFMode ? '#0a0a0d' : '#ffffff'}
                className="transition-all duration-300 group-hover:scale-105"
                filter="url(#hub-glow)"
                stroke={isBFMode ? '#ffd700' : '#e2e8f0'}
                strokeWidth={isBFMode ? 3.5 : 4}
              />

              {/* Decorative Subtle Ring */}
              <circle
                cx="0"
                cy="0"
                r={innerR - 12}
                fill="none"
                stroke={isBFMode ? 'rgba(255,215,0,0.25)' : 'rgba(0, 0, 0, 0.06)'}
                strokeWidth="1.5"
              />

              {/* Center Content */}
              <foreignObject
                x={-(innerR - 14)}
                y={-(innerR - 14)}
                width={(innerR - 14) * 2}
                height={(innerR - 14) * 2}
                className="pointer-events-none"
              >
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 select-none">
                  {isBFMode ? (
                    <>
                      <div className="flex items-center gap-1 mb-0.5">
                        <Crown className="w-5 h-5 text-amber-300 fill-amber-300 animate-bounce" />
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                      </div>
                      <div className="text-sm sm:text-base font-black text-amber-300 tracking-wider leading-none">
                        BLACK FRIDAY
                      </div>
                      <div className="font-mono text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-amber-400/90 bg-neutral-900/90 px-2 py-0.5 rounded-md border border-amber-300/30 shadow-2xs mt-1">
                        👑 2026 FULL SETS
                      </div>
                      <div className="text-[8px] font-bold text-neutral-400 mt-1">
                        {selectedCategory && selectedCategory !== 'all' ? 'کرتە بۆ هەموو سێتەکان' : `${bfCount} سێتی تەواو`}
                      </div>
                    </>
                  ) : (
                    <>
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Ashley Logo"
                          className="h-8 sm:h-10 max-w-[110px] object-contain mb-0.5 transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none mb-0.5">
                          ASHLEY
                        </div>
                      )}
                      <div className="font-mono text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs mt-0.5">
                        ashley suli | by darko
                      </div>
                      <div className="text-[8px] font-bold text-slate-400 mt-1">
                        {selectedCategory && selectedCategory !== 'all' ? 'کرتە بۆ هەموو ئاوتلێت' : `${outletCount} کاڵای ئاوتلێت`}
                      </div>
                    </>
                  )}
                </div>
              </foreignObject>
            </g>

          </svg>
        </div>

        {/* Dynamic Status Callout below Wheel */}
        <div className="mt-4 flex flex-col items-center justify-center text-center">
          {selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'stats' ? (
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold shadow-lg animate-fadeIn ${
              isBFMode 
                ? 'bg-neutral-900/90 border-amber-400/40 text-amber-200' 
                : 'bg-white/10 border-white/20 text-white'
            }`}>
              <span>بەشی هەڵبژێردراو:</span>
              <span className={`font-black ${isBFMode ? 'text-amber-400' : 'text-amber-400'}`}>
                {rawModules.find(m => m.id === selectedCategory)?.name || ''}
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
              <span>{isBFMode ? 'کرتە لەسەر هەر سێتێک بکە بۆ بینینی کاڵاکانی لە خوارەوە' : 'کرتە لەسەر هەر بەشێکی بازنەکە بکە بۆ فلتەرکردنی خوارەوە'}</span>
              <ChevronDown className="w-4 h-4 text-neutral-400 animate-bounce" />
            </div>
          )}
        </div>

      </div>

    </section>
  );
}
