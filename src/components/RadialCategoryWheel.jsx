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
 * Single Responsive Radial Wheel Component
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

  const gap = 3.6; // Gap between slices
  const innerR = 88;
  const outerR = 205;

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
    <div className={`relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-3xl transition-all duration-300 backdrop-blur-md ${
      isWheelActive 
        ? (centerHubType === 'bf' 
            ? 'bg-black/60 border border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/30' 
            : 'bg-black/60 border border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)] ring-1 ring-red-400/30')
        : 'bg-black/35 border border-white/10 hover:border-white/20'
    }`}>
      
      {/* Wheel Clean Header: Icon + Title + Count Badge */}
      <div 
        onClick={onActivateWheel}
        className="w-full flex items-center justify-between gap-3 mb-2 px-2 cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
            badgeTone === 'gold' 
              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black' 
              : 'bg-gradient-to-br from-red-500 to-rose-700 text-white'
          }`}>
            <TitleIcon className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 truncate">
            {title}
          </h3>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-mono font-black shrink-0 shadow-xs border ${
          badgeTone === 'gold'
            ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
            : 'bg-red-500/20 border-red-500/50 text-red-300'
        }`}>
          {headerBadge}
        </div>
      </div>

      {/* SVG Wheel Canvas (Generous Scale) */}
      <div className="relative w-full max-w-[460px] sm:max-w-[500px] xl:max-w-[540px] aspect-square flex items-center justify-center">
        <svg
          viewBox="-260 -260 520 520"
          className="w-full h-full overflow-visible drop-shadow-2xl"
        >
          <defs>
            {/* Shimmer gradient */}
            <linearGradient id={`gold-shimmer-${wheelId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cf9b32" />
              <stop offset="50%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#b8860b" />
            </linearGradient>

            {/* Hub shadow */}
            <filter id={`hub-shadow-${wheelId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Inner boundary track */}
          <circle
            cx="0"
            cy="0"
            r={innerR - 4}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.2"
          />

          {/* Slices: Crisp WHITE Interior + Deep BLACK Icons & Deep BLACK Text */}
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
                {/* Wedge Group with hover lift */}
                <g 
                  style={{
                    transform: isHovered || isSelected ? `translate(${8 * Math.cos(midRad)}px, ${8 * Math.sin(midRad)}px)` : 'none',
                    transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* WHITE Wedge Interior */}
                  <path
                    d={wedgePath}
                    fill="#ffffff"
                    className="transition-all duration-200"
                    style={{
                      filter: isSelected 
                        ? `drop-shadow(0 0 18px ${mod.borderColor || '#ffd700'})` 
                        : isHovered 
                        ? 'drop-shadow(0 0 12px rgba(255,255,255,0.7))' 
                        : 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
                      opacity: isSelected ? 1 : isHovered ? 0.99 : 0.95
                    }}
                    stroke={isSelected ? '#000000' : (mod.borderColor || '#cbd5e1')}
                    strokeWidth={isSelected ? 3.8 : isHovered ? 3 : 2}
                  />

                  {/* Content INSIDE Wedge: BLACK Text & BLACK Icon */}
                  <foreignObject
                    x={contentX - 44}
                    y={contentY - 34}
                    width={88}
                    height={68}
                    className="pointer-events-none"
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center text-center select-none font-sans">
                      
                      {/* Deep Black Icon */}
                      <div className="flex items-center justify-center mb-0.5 text-slate-950 transition-transform">
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                      </div>

                      {/* Deep Black Category Name */}
                      <div className="text-slate-950 font-black text-[11.5px] sm:text-[12.5px] leading-tight px-1 tracking-tight">
                        {mod.name}
                      </div>

                      {/* Pill Badge showing count */}
                      <div 
                        className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full mt-0.5 text-white shadow-2xs"
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
              fill={centerHubType === 'bf' ? '#0a0a0d' : '#ffffff'}
              className="transition-all duration-300 group-hover:scale-105"
              filter={`url(#hub-shadow-${wheelId})`}
              stroke={centerHubType === 'bf' ? '#ffd700' : '#e2e8f0'}
              strokeWidth={centerHubType === 'bf' ? 3.5 : 3.5}
            />

            {/* Inner Ring */}
            <circle
              cx="0"
              cy="0"
              r={innerR - 11}
              fill="none"
              stroke={centerHubType === 'bf' ? 'rgba(255,215,0,0.3)' : 'rgba(0,0,0,0.06)'}
              strokeWidth="1.2"
            />

            {/* Center Hub Content */}
            <foreignObject
              x={-(innerR - 13)}
              y={-(innerR - 13)}
              width={(innerR - 13) * 2}
              height={(innerR - 13) * 2}
              className="pointer-events-none"
            >
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-1.5 select-none font-sans">
                {centerHubType === 'bf' ? (
                  <>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Crown className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    </div>
                    <div className="text-xs sm:text-[13px] font-black text-amber-300 tracking-wider leading-none">
                      BLACK FRIDAY
                    </div>
                    <div className="font-mono text-[8px] font-black uppercase tracking-wider text-amber-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-amber-300/30 mt-0.5">
                      2026 SETS
                    </div>
                    <div className="text-[8.5px] font-bold text-neutral-300 mt-1">
                      {centerCount} سێت
                    </div>
                  </>
                ) : (
                  <>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Ashley Logo"
                        className="h-7 sm:h-8 max-w-[90px] object-contain mb-0.5 transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-lg font-black text-slate-900 tracking-tight leading-none mb-0.5">
                        ASHLEY
                      </div>
                    )}
                    <div className="font-mono text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-0.5">
                      ashley suli | darko
                    </div>
                    <div className="text-[8.5px] font-bold text-slate-600 mt-1">
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
  // Extract top showcase images for ambient blurred background slideshow
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
        borderColor: '#0d9488', // Emerald border
        badgeColor: '#0f766e',
        badgeText: `${outletCounts['cat-1789155949761'] || 0} مۆدێل`
      },
      {
        id: 'cat-1789142347391',
        name: lang === 'ku' ? 'کۆرنەر' : 'Corner',
        icon: Maximize2,
        weight: 1,
        borderColor: '#ea580c', // Orange border
        badgeColor: '#c2410c',
        badgeText: `${outletCounts['cat-1789142347391'] || 0} مۆدێل`
      },
      {
        id: 'cat-sehpa',
        name: lang === 'ku' ? 'سێپایە' : 'Sehpa',
        icon: Coffee,
        weight: 1,
        borderColor: '#d97706', // Amber border
        badgeColor: '#b45309',
        badgeText: `${outletCounts['cat-sehpa'] || 0} مۆدێل`
      },
      {
        id: 'cat-1792925556263',
        name: lang === 'ku' ? 'ژووری نووستن' : 'Bed room',
        icon: Bed,
        weight: 1,
        borderColor: '#db2777', // Rose border
        badgeColor: '#be185d',
        badgeText: `${outletCounts['cat-1792925556263'] || 0} مۆدێل`
      },
      {
        id: 'cat-tv-vitrine',
        name: lang === 'ku' ? 'فاترین و تیڤی' : 'TV & Vitrine',
        icon: Tv,
        weight: 1,
        borderColor: '#0284c7', // Sky border
        badgeColor: '#0369a1',
        badgeText: `${outletCounts['cat-tv-vitrine'] || 0} مۆدێل`
      },
      {
        id: 'module-stats',
        name: lang === 'ku' ? 'ئامارەکان' : 'Stats',
        icon: BarChart3,
        weight: 1,
        borderColor: '#6366f1', // Indigo border
        badgeColor: '#4338ca',
        badgeText: `${outletCount} کاڵا`
      }
    ];
  }, [lang, outletCounts, outletCount]);

  // 2. BLACK FRIDAY SETS MODULES (Vibrant Colors + White Interior + Black Text/Icons)
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
        borderColor: '#ff6b00', // Vibrant Flame
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
    <section className="no-print w-full min-h-[88vh] lg:min-h-[94vh] py-6 px-3 sm:px-6 relative flex flex-col justify-between overflow-hidden bg-[#0c0d12] text-white select-none">
      
      {/* 1. Ambient Blurred Slideshow in Background (پشتەوەی سلاید شۆوی کاڵ و تەڵخ) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        {showcaseImages.map((imgUrl, i) => {
          const isActive = i === slideIdx;
          return (
            <div
              key={imgUrl + i}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-35 scale-105' : 'opacity-0 scale-100'
              }`}
              style={{
                transitionProperty: 'opacity, transform',
                transitionDuration: isActive ? '1200ms, 6000ms' : '1000ms, 1000ms'
              }}
            >
              <img
                src={imgUrl}
                alt="Showcase Ambient"
                className="w-full h-full object-cover filter blur-2xl brightness-[0.45] contrast-[1.1]"
                loading="lazy"
              />
            </div>
          );
        })}
        {/* Soft Vignette Overlay to ensure perfect contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0b0b0e]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      </div>

      {/* 2. Side-by-Side Dual Wheels Container (Expansive & Responsive) */}
      <div className="relative z-10 max-w-[1700px] w-full mx-auto flex-1 flex flex-col justify-between">
        
        {/* Wheels Grid: Both wheels proudly side-by-side filling the screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-12 items-center justify-items-center flex-1 my-auto w-full">
          
          {/* Outlet Wheel */}
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

          {/* Black Friday Sets Wheel */}
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

        {/* 3. Bottom Animated Indicator (ئاماژەی جوڵاو بۆ کردنەوەی کاڵاکان لە خوارەوە) */}
        <div className="mt-4 flex flex-col items-center justify-center">
          <button
            onClick={scrollToCatalog}
            className="group flex flex-col items-center gap-1.5 cursor-pointer text-white/80 hover:text-white transition-all transform hover:scale-105 active:scale-95"
          >
            <div className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full backdrop-blur-xl border text-xs font-black shadow-xl transition-all ${
              selectedCategory && selectedCategory !== 'all'
                ? (campaign === 'black_friday' ? 'bg-amber-500/20 border-amber-400/50 text-amber-200' : 'bg-red-500/20 border-red-400/50 text-red-200')
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
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
