import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageUrl';

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
 * Borderless, Expansive & Delicate Radial Wheel Component
 * (بەبێ سنور، گەورە و فراوان، بەش بەش ناسک و جوان)
 */
function SingleWheel({
  wheelId,
  title,
  icon: TitleIcon,
  headerBadge,
  badgeTone = 'red',
  modules = [],
  selectedCategory,
  onSelectCategory,
  isWheelActive,
  onActivateWheel,
  logoUrl,
  centerHubType = 'outlet', // 'outlet' | 'bf'
  centerCount = 0
}) {
  const [hoveredId, setHoveredId] = useState(null);

  // Precision delicate geometry
  const gap = 2.8; // Sleek delicate gap between slices
  const innerR = 96;
  const outerR = 232;

  // Calculate angles
  const totalWeight = modules.reduce((sum, m) => sum + (m.weight || 1), 0);
  let currentAngle = -90; // Start at 12 o'clock

  const modulesWithAngles = modules.map((mod, idx) => {
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

  return (
    <div className="relative flex flex-col items-center justify-center w-full transition-all duration-300">
      
      {/* Delicate Floating Header (بێ سنور و چوارچێوە) */}
      <div 
        onClick={onActivateWheel}
        className="w-full max-w-[560px] flex items-center justify-between gap-3 mb-3 px-3 cursor-pointer group select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110 ${
            badgeTone === 'gold' 
              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-amber-500/20' 
              : 'bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-red-500/20'
          }`}>
            <TitleIcon className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 truncate">
            <span>{title}</span>
          </h3>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-mono font-black shrink-0 border backdrop-blur-md shadow-xs transition-transform group-hover:scale-105 ${
          badgeTone === 'gold'
            ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
        }`}>
          {headerBadge}
        </div>
      </div>

      {/* Large SVG Wheel Canvas (گەورە بەبێ سنور) */}
      <div className="relative w-full max-w-[520px] sm:max-w-[580px] lg:max-w-[640px] xl:max-w-[700px] 2xl:max-w-[740px] aspect-square flex items-center justify-center">
        <svg
          viewBox="-280 -280 560 560"
          className="w-full h-full overflow-visible drop-shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
        >
          <defs>
            {/* Ambient Hub Shadow */}
            <filter id={`hub-shadow-${wheelId}`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#000000" floodOpacity="0.55" />
            </filter>
          </defs>

          {/* Delicate Inner Ring Guide */}
          <circle
            cx="0"
            cy="0"
            r={innerR - 5}
            fill="none"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="1.2"
          />

          {/* Slices: Crisp Pure WHITE + Deep BLACK Icons & Text + Delicate Color Stroke */}
          {modulesWithAngles.map((mod) => {
            const midRad = (mod.midAngle * Math.PI) / 180;
            const isHovered = hoveredId === mod.id;
            const isSelected = isWheelActive && selectedCategory === mod.id;

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
                onClick={() => {
                  onActivateWheel();
                  onSelectCategory(selectedCategory === mod.id ? 'all' : mod.id);
                }}
              >
                {/* Wedge Group with delicate smooth lift */}
                <g 
                  style={{
                    transform: isHovered || isSelected ? `translate(${8 * Math.cos(midRad)}px, ${8 * Math.sin(midRad)}px)` : 'none',
                    transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* WHITE Wedge Interior (ناسک و جوان) */}
                  <path
                    d={wedgePath}
                    fill="#ffffff"
                    className="transition-all duration-200"
                    style={{
                      filter: isSelected 
                        ? `drop-shadow(0 0 20px ${mod.borderColor || '#ffd700'})` 
                        : isHovered 
                        ? 'drop-shadow(0 0 14px rgba(255,255,255,0.75))' 
                        : 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))',
                      opacity: isSelected ? 1 : isHovered ? 0.99 : 0.96
                    }}
                    stroke={isSelected ? '#0f172a' : (mod.borderColor || '#cbd5e1')}
                    strokeWidth={isSelected ? 3.5 : isHovered ? 2.8 : 2}
                  />

                  {/* Content INSIDE Wedge: Deep BLACK Text & Deep BLACK Icon */}
                  <foreignObject
                    x={contentX - 48}
                    y={contentY - 37}
                    width={96}
                    height={74}
                    className="pointer-events-none"
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center text-center select-none font-sans">
                      
                      {/* Deep Black Icon */}
                      <div className="flex items-center justify-center mb-0.5 text-slate-950 transition-transform">
                        <IconComponent className="w-6 h-6 sm:w-6.5 sm:h-6.5 stroke-[2.3]" />
                      </div>

                      {/* Deep Black Category Name */}
                      <div className="text-slate-950 font-black text-[12px] sm:text-[13px] leading-tight px-1 tracking-tight">
                        {mod.name}
                      </div>

                      {/* Delicate Pill Badge showing count */}
                      <div 
                        className="text-[9.5px] font-mono font-black px-2 py-0.2 rounded-full mt-0.5 text-white shadow-2xs"
                        style={{ backgroundColor: mod.badgeColor || '#0f172a' }}
                      >
                        {mod.badgeText}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              </g>
            );
          })}

          {/* Central Hub Disc */}
          <g
            onClick={() => {
              onActivateWheel();
              onSelectCategory('all');
            }}
            className="cursor-pointer group"
          >
            {/* Center Circle */}
            <circle
              cx="0"
              cy="0"
              r={innerR - 6}
              fill={centerHubType === 'bf' ? '#0f1118' : '#ffffff'}
              className="transition-all duration-300 group-hover:scale-105"
              filter={`url(#hub-shadow-${wheelId})`}
              stroke={centerHubType === 'bf' ? '#ffd700' : '#e2e8f0'}
              strokeWidth={3.5}
            />

            {/* Inner Ring Guide */}
            <circle
              cx="0"
              cy="0"
              r={innerR - 12}
              fill="none"
              stroke={centerHubType === 'bf' ? 'rgba(255,215,0,0.35)' : 'rgba(0,0,0,0.08)'}
              strokeWidth="1.2"
            />

            {/* Center Hub Content */}
            <foreignObject
              x={-(innerR - 14)}
              y={-(innerR - 14)}
              width={(innerR - 14) * 2}
              height={(innerR - 14) * 2}
              className="pointer-events-none"
            >
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 select-none font-sans">
                {centerHubType === 'bf' ? (
                  <>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Crown className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    </div>
                    <div className="text-[13px] sm:text-[14px] font-black text-amber-300 tracking-wider leading-none">
                      BLACK FRIDAY
                    </div>
                    <div className="font-mono text-[8.5px] font-black uppercase tracking-wider text-amber-400 bg-neutral-900/90 px-2 py-0.5 rounded border border-amber-300/30 mt-1">
                      2026 SETS
                    </div>
                    <div className="text-[9px] font-bold text-neutral-300 mt-1">
                      {centerCount} سێت
                    </div>
                  </>
                ) : (
                  <>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Ashley Logo"
                        className="h-8 sm:h-9 max-w-[100px] object-contain mb-0.5 transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-xl font-black text-slate-900 tracking-tight leading-none mb-0.5">
                        ASHLEY
                      </div>
                    )}
                    <div className="font-mono text-[8px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-0.5">
                      ashley suli | darko
                    </div>
                    <div className="text-[9px] font-bold text-slate-600 mt-1">
                      {centerCount} مۆدێل
                    </div>
                  </>
                )}
              </div>
            </foreignObject>
          </g>

        </svg>
      </div>

    </div>
  );
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
  // Extract top showcase images for ambient background slideshow
  const showcaseImages = useMemo(() => {
    if (!models || models.length === 0) return [];
    return models
      .filter(m => m.image && typeof m.image === 'string' && m.image.startsWith('http'))
      .map(m => getOptimizedImageUrl(m.image, 'hero'))
      .slice(0, 16);
  }, [models]);

  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (showcaseImages.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % showcaseImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [showcaseImages.length]);

  // Counts per category for Outlet vs Black Friday
  const { outletCounts, bfCounts } = useMemo(() => {
    const oCounts = {};
    const bCounts = {};
    (models || []).forEach(m => {
      const isBF = (m.itemType || m.sku || '').toLowerCase().includes('بلاک فرایدەی') || 
                   (m.itemType || m.sku || '').toLowerCase().includes('black friday');
      if (m.categoryId) {
        if (isBF) {
          bCounts[m.categoryId] = (bCounts[m.categoryId] || 0) + 1;
        } else {
          oCounts[m.categoryId] = (oCounts[m.categoryId] || 0) + 1;
        }
      }
    });
    return { outletCounts: oCounts, bfCounts: bCounts };
  }, [models]);

  // 1. OUTLET WHEEL MODULES (Excludes Dining room, as requested)
  const outletModules = useMemo(() => {
    return [
      {
        id: 'cat-1789155949761',
        name: lang === 'ku' ? 'قەنەفە' : 'Sofa',
        icon: Sofa,
        weight: 1,
        borderColor: '#0d9488', // Emerald
        badgeColor: '#0f766e',
        badgeText: `${outletCounts['cat-1789155949761'] || 0} مۆدێل`
      },
      {
        id: 'cat-1789142347391',
        name: lang === 'ku' ? 'کۆرنەر' : 'Corner',
        icon: Maximize2,
        weight: 1,
        borderColor: '#ea580c', // Orange
        badgeColor: '#c2410c',
        badgeText: `${outletCounts['cat-1789142347391'] || 0} مۆدێل`
      },
      {
        id: 'cat-sehpa',
        name: lang === 'ku' ? 'سێپایە' : 'Sehpa',
        icon: Coffee,
        weight: 1,
        borderColor: '#d97706', // Amber
        badgeColor: '#b45309',
        badgeText: `${outletCounts['cat-sehpa'] || 0} مۆدێل`
      },
      {
        id: 'cat-1792925556263',
        name: lang === 'ku' ? 'ژووری نووستن' : 'Bed room',
        icon: Bed,
        weight: 1,
        borderColor: '#db2777', // Rose
        badgeColor: '#be185d',
        badgeText: `${outletCounts['cat-1792925556263'] || 0} مۆدێل`
      },
      {
        id: 'cat-tv-vitrine',
        name: lang === 'ku' ? 'فاترین و تیڤی' : 'TV & Vitrine',
        icon: Tv,
        weight: 1,
        borderColor: '#0284c7', // Sky
        badgeColor: '#0369a1',
        badgeText: `${outletCounts['cat-tv-vitrine'] || 0} مۆدێل`
      },
      {
        id: 'module-stats',
        name: lang === 'ku' ? 'ئامارەکان' : 'Stats',
        icon: BarChart3,
        weight: 1,
        borderColor: '#6366f1', // Indigo
        badgeColor: '#4338ca',
        badgeText: `${outletCount} کاڵا`
      }
    ];
  }, [lang, outletCounts, outletCount]);

  // 2. BLACK FRIDAY SETS MODULES (Delicate Vibrant Colors + White Interior)
  const bfModules = useMemo(() => {
    return [
      {
        id: 'cat-1789155949761',
        name: lang === 'ku' ? 'سێتی سۆفا' : 'Sofa Sets',
        icon: Sofa,
        weight: 1,
        borderColor: '#f59e0b', // Vibrant Gold
        badgeColor: '#b45309',
        badgeText: `${bfCounts['cat-1789155949761'] || 0} سێت`
      },
      {
        id: 'cat-1789142347391',
        name: lang === 'ku' ? 'سێتی کۆڕنەر' : 'Corner Sets',
        icon: Maximize2,
        weight: 1,
        borderColor: '#ff6b00', // Flame
        badgeColor: '#c2410c',
        badgeText: `${bfCounts['cat-1789142347391'] || 0} سێت`
      },
      {
        id: 'cat-sehpa',
        name: lang === 'ku' ? 'سێتی تەپڵەک' : 'Sehpa Sets',
        icon: Coffee,
        weight: 1,
        borderColor: '#8b5cf6', // Royal Purple
        badgeColor: '#6d28d9',
        badgeText: `${bfCounts['cat-sehpa'] || 0} سێت`
      },
      {
        id: 'cat-1792925556263',
        name: lang === 'ku' ? 'سێتی نووستن' : 'Bedroom Sets',
        icon: Bed,
        weight: 1,
        borderColor: '#e11d48', // Ruby Red
        badgeColor: '#be123c',
        badgeText: `${bfCounts['cat-1792925556263'] || 0} سێت`
      },
      {
        id: 'cat-dining-room',
        name: lang === 'ku' ? 'سێتی نانخواردن' : 'Dining Sets',
        icon: Utensils,
        weight: 1,
        borderColor: '#10b981', // Royal Emerald
        badgeColor: '#047857',
        badgeText: `${bfCounts['cat-dining-room'] || 0} سێت`
      },
      {
        id: 'cat-tv-vitrine',
        name: lang === 'ku' ? 'سێتی فاترین' : 'TV & Vitrine',
        icon: Tv,
        weight: 1,
        borderColor: '#06b6d4', // Sapphire Cyan
        badgeColor: '#0e7490',
        badgeText: `${bfCounts['cat-tv-vitrine'] || 0} سێت`
      }
    ];
  }, [lang, bfCounts]);

  const handleSelect = (newCampaign, catId) => {
    if (setCampaign) setCampaign(newCampaign);
    if (onSelectCategory) onSelectCategory(catId);
    if (setActiveTab) setActiveTab('categories');

    // Smooth scroll down to catalog content
    setTimeout(() => {
      const el = document.getElementById('catalog-content-anchor');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-content-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="no-print w-full min-h-[92vh] lg:min-h-screen py-8 px-3 sm:px-6 lg:px-12 relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#2a2e3a] via-[#21242d] to-[#181a22] text-white select-none">
      
      {/* 1. Ambient Gray Atmospheric Lighting (ڕەساسی مۆدێرن و ناسک) */}
      <div 
        className="absolute inset-0 pointer-events-none select-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 25%, rgba(148, 163, 184, 0.18) 0%, transparent 65%)'
        }}
      />

      {/* 2. Soft Ambient Blurred Furniture Slideshow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        {showcaseImages.map((imgUrl, i) => {
          const isActive = i === slideIdx;
          return (
            <div
              key={imgUrl + i}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-20 scale-105' : 'opacity-0 scale-100'
              }`}
              style={{
                transitionProperty: 'opacity, transform',
                transitionDuration: isActive ? '1200ms, 6000ms' : '1000ms, 1000ms'
              }}
            >
              <img
                src={imgUrl}
                alt="Showcase Ambient"
                className="w-full h-full object-cover filter blur-3xl brightness-[0.6] contrast-[1.1]"
                loading="lazy"
              />
            </div>
          );
        })}
        {/* Soft Gray Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2e3a]/80 via-transparent to-[#181a22]/90" />
      </div>

      {/* 3. Expansive Full-Size Dual Wheels (بێ سنور، گەورە و فراوان) */}
      <div className="relative z-10 max-w-[1850px] w-full mx-auto flex-1 flex flex-col justify-between">
        
        {/* Wheels Grid: Both wheels proudly floating side-by-side without confining borders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-20 items-center justify-items-center flex-1 my-auto w-full">
          
          {/* Outlet Wheel (بەشەکانی ئاوتلێت - بێ سنور و گەورە) */}
          <SingleWheel
            wheelId="outlet"
            title="بەشەکانی ئاوتلێت"
            icon={Sofa}
            headerBadge={`${outletCount} مۆدێل`}
            badgeTone="red"
            modules={outletModules}
            selectedCategory={selectedCategory}
            onSelectCategory={(catId) => handleSelect('outlet', catId)}
            isWheelActive={campaign === 'outlet'}
            onActivateWheel={() => {
              if (setCampaign) setCampaign('outlet');
              if (onSelectCategory) onSelectCategory('all');
            }}
            logoUrl={logoUrl}
            centerHubType="outlet"
            centerCount={outletCount}
          />

          {/* Black Friday Sets Wheel (سێتەکانی بلاک فرایدەی - بێ سنور و گەورە) */}
          <SingleWheel
            wheelId="black_friday"
            title="سێتەکانی بلاک فرایدەی"
            icon={Crown}
            headerBadge={`${bfCount} سێت`}
            badgeTone="gold"
            modules={bfModules}
            selectedCategory={selectedCategory}
            onSelectCategory={(catId) => handleSelect('black_friday', catId)}
            isWheelActive={campaign === 'black_friday'}
            onActivateWheel={() => {
              if (setCampaign) setCampaign('black_friday');
              if (onSelectCategory) onSelectCategory('all');
            }}
            logoUrl={logoUrl}
            centerHubType="bf"
            centerCount={bfCount}
          />

        </div>

        {/* 4. Bottom Animated Indicator (ئاماژەی جوڵاو بۆ کردنەوەی کاڵاکان لە خوارەوە) */}
        <div className="mt-4 flex flex-col items-center justify-center">
          <button
            onClick={scrollToCatalog}
            className="group flex flex-col items-center gap-1.5 cursor-pointer text-white/80 hover:text-white transition-all transform hover:scale-105 active:scale-95"
          >
            <div className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full backdrop-blur-xl border text-xs font-black shadow-xl transition-all ${
              selectedCategory && selectedCategory !== 'all'
                ? (campaign === 'black_friday' ? 'bg-amber-500/25 border-amber-400/50 text-amber-200' : 'bg-red-500/25 border-red-400/50 text-red-200')
                : 'bg-white/15 hover:bg-white/25 border-white/25 text-white'
            }`}>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>
                {selectedCategory && selectedCategory !== 'all'
                  ? `بەشی ${(campaign === 'black_friday' ? bfModules : outletModules).find(m => m.id === selectedCategory)?.name || ''} لە خوارەوە کرایەوە`
                  : 'بینینی مۆدێلەکان لە خوارەوە'}
              </span>
              <ChevronDown className="w-4 h-4 text-white group-hover:translate-y-1 transition-transform animate-bounce" />
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping mt-0.5" />
          </button>
        </div>

      </div>

    </section>
  );
}
