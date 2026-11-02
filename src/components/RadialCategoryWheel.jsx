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
  Crown,
  Tag
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
 * SVG arc path generator for donut slices with customizable radius
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
  activeTab,
  setActiveTab,
  lang = 'ku'
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Build the unified modules list
  // Black Friday has weight = 2 (Double size as requested!)
  const rawModules = useMemo(() => {
    const colors = [
      '#10b981', // Emerald (Sofa)
      '#f59e0b', // Amber (Corner)
      '#f97316', // Orange (Sehpa)
      '#ec4899', // Pink (Bed room)
      '#8b5cf6', // Purple (Dining room)
      '#06b6d4', // Cyan (TV & Vitrine)
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
        icon: getModuleIcon(cat.id, cat.name_en || cat.name_ku || cat.name),
        weight: 1,
        isOutlet: true // Mark as outlet category
      };
    });

    // Add Stats module (weight 1)
    list.push({
      id: 'module-stats',
      type: 'stats',
      name: lang === 'ku' ? 'ئامارەکان' : lang === 'ar' ? 'الإحصائيات' : 'Stats',
      name_en: 'STATISTICS',
      count: totalCount,
      color: '#3b82f6',
      icon: BarChart3,
      weight: 1,
      isOutlet: false
    });

    // Add Black Friday VIP module with weight = 2 (Double Size & Gold Shimmer!)
    list.push({
      id: 'module-bf',
      type: 'black_friday',
      name: lang === 'ku' ? 'بلاک فرایدەی' : lang === 'ar' ? 'بلاك فرايدي' : 'Black Friday',
      name_en: 'BLACK FRIDAY VIP',
      count: bfCount,
      color: '#ff6b00',
      icon: Flame,
      weight: 2, // 2x double the size!
      isBF: true,
      isOutlet: false
    });

    return list;
  }, [categories, categoryCounts, lang, totalCount, bfCount]);

  // Calculate angles based on weights (Total weight = sum(weight))
  const totalWeight = useMemo(() => {
    return rawModules.reduce((sum, m) => sum + (m.weight || 1), 0);
  }, [rawModules]);

  const gap = 3.2; // degrees gap between wedges
  const innerR = 98;
  const outerR = 212; // generous depth for both icon and text
  const labelR = 265;

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
  }, [rawModules, totalWeight]);

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
    <section className="no-print w-full py-8 sm:py-12 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-[#1b1c24] via-[#14151b] to-[#0c0d11] text-white">
      
      {/* Background Decorative Ambient Radial Glows */}
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 end-1/5 w-[420px] h-[420px] bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 start-1/5 w-[380px] h-[380px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Wheel Container */}
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center relative select-none">
        
        {/* Responsive SVG Wheel */}
        <div className="relative w-full max-w-[580px] sm:max-w-[680px] aspect-square flex items-center justify-center">
          <svg
            viewBox="-350 -350 700 700"
            className="w-full h-full overflow-visible drop-shadow-2xl"
          >
            <defs>
              {/* Native Hardware-Accelerated Metallic Gold Shimmer Pattern */}
              <linearGradient id="gold-shimmer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#cf9b32">
                  <animate attributeName="stop-color" values="#cf9b32; #fceda2; #ffd700; #b8860b; #cf9b32" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="30%" stopColor="#fceda2">
                  <animate attributeName="stop-color" values="#fceda2; #ffd700; #b8860b; #cf9b32; #fceda2" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="60%" stopColor="#ffd700">
                  <animate attributeName="stop-color" values="#ffd700; #b8860b; #cf9b32; #fceda2; #ffd700" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#b8860b">
                  <animate attributeName="stop-color" values="#b8860b; #cf9b32; #fceda2; #ffd700; #b8860b" dur="3s" repeatCount="indefinite" />
                </stop>
              </linearGradient>

              {/* Fire gradient for Black Friday base */}
              <linearGradient id="bf-fire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff7700" />
                <stop offset="40%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#0a0a0c" />
              </linearGradient>

              {/* Hub Shadow */}
              <filter id="hub-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.65" />
              </filter>
            </defs>

            {/* ========================================================
                ERP INFOGRAPHIC TRACKS & DIRECTIONAL ARROWS
                Matches the technical circular ERP reference diagram
               ======================================================== */}
            {/* Outer Circular Track */}
            <circle
              cx="0"
              cy="0"
              r={outerR + 10}
              fill="none"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="1.5"
            />
            {/* Outer Concentric Dash Guide */}
            <circle
              cx="0"
              cy="0"
              r={outerR + 24}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            {/* Inner Circular Track around Central Hub */}
            <circle
              cx="0"
              cy="0"
              r={innerR - 4}
              fill="none"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="1.5"
            />

            {/* Directional Flow Arrows on Tracks (Clockwise loop like ERP) */}
            {modulesWithAngles.map((mod) => {
              const midRad = (mod.midAngle * Math.PI) / 180;
              // Outer arrow position
              const outerArrowX = (outerR + 10) * Math.cos(midRad);
              const outerArrowY = (outerR + 10) * Math.sin(midRad);
              // Inner arrow position
              const innerArrowX = (innerR - 4) * Math.cos(midRad);
              const innerArrowY = (innerR - 4) * Math.sin(midRad);
              const tangentDeg = mod.midAngle + 90;

              // Boundary divider angle (at start of slice)
              const boundAngle = mod.startAngle - (gap / 2);
              const boundRad = (boundAngle * Math.PI) / 180;
              const divInnerX = (innerR - 4) * Math.cos(boundRad);
              const divInnerY = (innerR - 4) * Math.sin(boundRad);
              const divOuterX = (outerR + 10) * Math.cos(boundRad);
              const divOuterY = (outerR + 10) * Math.sin(boundRad);

              return (
                <g key={`track-decor-${mod.id}`} className="pointer-events-none opacity-80">
                  {/* Radial Divider Line between Wedges */}
                  <line
                    x1={divInnerX}
                    y1={divInnerY}
                    x2={divOuterX}
                    y2={divOuterY}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                  />
                  {/* Pin Node at Inner Track */}
                  <circle
                    cx={divInnerX}
                    cy={divInnerY}
                    r={2.5}
                    fill="#1e293b"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                  {/* Pin Node at Outer Track */}
                  <circle
                    cx={divOuterX}
                    cy={divOuterY}
                    r={3}
                    fill="#1e293b"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                  {/* Outer Arrow */}
                  <path
                    d="M -3 -3 L 3 0 L -3 3 Z"
                    transform={`translate(${outerArrowX}, ${outerArrowY}) rotate(${tangentDeg})`}
                    fill="rgba(255, 255, 255, 0.55)"
                  />
                  {/* Inner Arrow */}
                  <path
                    d="M -2.5 -2.5 L 2.5 0 L -2.5 2.5 Z"
                    transform={`translate(${innerArrowX}, ${innerArrowY}) rotate(${tangentDeg})`}
                    fill="rgba(255, 255, 255, 0.45)"
                  />
                </g>
              );
            })}

            {/* Surrounding Slices / Modules (Staggered Animation: 0.20s per segment) */}
            {modulesWithAngles.map((mod) => {
              const midRad = (mod.midAngle * Math.PI) / 180;
              const isHovered = hoveredId === mod.id;
              const isSelected = selectedCategory === mod.id || 
                (mod.type === 'black_friday' && campaign === 'black_friday') ||
                (mod.type === 'stats' && activeTab === 'stats');

              // Center position of slice for Icon + Name text
              const midR = (innerR + outerR) / 2;
              const contentX = midR * Math.cos(midRad);
              const contentY = midR * Math.sin(midRad);

              // Outer label line anchor
              const lineStartR = outerR + 10;
              const lineStartX = lineStartR * Math.cos(midRad);
              const lineStartY = lineStartR * Math.sin(midRad);

              const lineEndX = labelR * Math.cos(midRad);
              const lineEndY = labelR * Math.sin(midRad);

              const IconComponent = mod.icon;
              const wedgePath = createWedgePath(mod.startAngle, mod.endAngle, innerR, outerR);

              // Stagger delay: starts after center circle (0.25s) with 0.20s increments
              const staggerDelay = 0.25 + mod.idx * 0.20;

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
                      transform: isHovered || isSelected ? `translate(${7 * Math.cos(midRad)}px, ${7 * Math.sin(midRad)}px)` : 'none',
                      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {/* Wedge Path */}
                    <path
                      d={wedgePath}
                      fill={mod.isBF ? 'url(#gold-shimmer-grad)' : mod.color}
                      className="transition-all duration-200"
                      style={{
                        filter: isHovered || isSelected || mod.isBF 
                          ? (mod.isBF ? 'drop-shadow(0 0 20px rgba(255,107,0,0.85))' : `drop-shadow(0 0 16px ${mod.color}99)`) 
                          : 'none',
                        opacity: isSelected ? 1 : isHovered ? 0.98 : 0.88
                      }}
                      stroke={mod.isBF ? '#ffd700' : isSelected ? '#ffffff' : 'rgba(255,255,255,0.22)'}
                      strokeWidth={mod.isBF ? 3.5 : isSelected ? 3 : 1.2}
                    />

                    {/* Content INSIDE the Wedge: Icon + Section Name directly inside! */}
                    <foreignObject
                      x={contentX - (mod.isBF ? 62 : 46)}
                      y={contentY - (mod.isBF ? 42 : 34)}
                      width={mod.isBF ? 124 : 92}
                      height={mod.isBF ? 84 : 68}
                      className="pointer-events-none"
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center text-center select-none">
                        
                        {/* Icon */}
                        <div className={`flex items-center justify-center rounded-xl p-1 mb-0.5 ${
                          mod.isBF ? 'text-black drop-shadow-sm' : 'text-white drop-shadow-md'
                        }`}>
                          {mod.isBF ? (
                            <div className="flex items-center gap-0.5">
                              <Crown className="w-5 h-5 fill-amber-300 stroke-black stroke-[2]" />
                              <Flame className="w-5 h-5 fill-orange-600 stroke-black stroke-[2] animate-bounce" />
                            </div>
                          ) : (
                            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
                          )}
                        </div>

                        {/* Category Name Written Directly INSIDE the Wedge */}
                        <div className={`font-black tracking-tight leading-tight px-1 ${
                          mod.isBF 
                            ? 'text-black text-xs sm:text-[13px] font-mono tracking-wider drop-shadow-xs font-black' 
                            : 'text-white text-[11px] sm:text-xs drop-shadow-md'
                        }`}>
                          {mod.name}
                        </div>

                        {/* Extra VIP Tag for Black Friday slice */}
                        {mod.isBF && (
                          <div className="bg-black/90 text-amber-300 text-[8.5px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider mt-0.5 border border-amber-300/40">
                            2X VIP EDITION
                          </div>
                        )}
                      </div>
                    </foreignObject>
                  </g>

                  {/* Outer Connecting Line & Dot */}
                  <line
                    x1={lineStartX}
                    y1={lineStartY}
                    x2={lineEndX}
                    y2={lineEndY}
                    stroke={mod.isBF ? '#ffd700' : mod.color}
                    strokeWidth={isSelected || mod.isBF ? 2.5 : 1.5}
                    strokeDasharray={isSelected ? 'none' : '2 2'}
                    opacity={isSelected || mod.isBF ? 1 : isHovered ? 0.9 : 0.6}
                  />
                  <circle
                    cx={lineEndX}
                    cy={lineEndY}
                    r={isSelected || mod.isBF ? 4.5 : 3}
                    fill={mod.isBF ? '#ffd700' : mod.color}
                  />

                  {/* Outer Indicators: Showing Outlet Badge & Model Counts */}
                  <foreignObject
                    x={lineEndX - 70}
                    y={lineEndY - 16}
                    width={140}
                    height={34}
                    className="overflow-visible pointer-events-none"
                  >
                    <div 
                      className={`px-2.5 py-0.5 rounded-full backdrop-blur-md flex items-center justify-center gap-1.5 transition-all text-center shadow-lg ${
                        mod.isBF
                          ? 'animate-gold-shimmer text-black ring-2 ring-amber-300 scale-105 font-black'
                          : isSelected 
                          ? 'bg-white text-slate-900 ring-2 ring-white scale-105 font-black' 
                          : isHovered
                          ? 'bg-neutral-900/95 text-white ring-1 ring-white/50 scale-105 font-bold'
                          : 'bg-[#181922]/90 text-neutral-200 border border-white/10 font-bold'
                      }`}
                      style={{
                        borderColor: mod.isBF ? undefined : isSelected ? undefined : mod.color
                      }}
                    >
                      {/* Outlet indication tag if this is an outlet category */}
                      {mod.isOutlet && (
                        <span className="text-[9px] bg-blue-600/90 text-white font-extrabold px-1.5 py-0.1 rounded-md">
                          ئاوتلێت
                        </span>
                      )}

                      <span className="text-[10px] sm:text-[11px] truncate leading-tight font-bold">
                        {mod.name}
                      </span>

                      {mod.count !== undefined && (
                        <span 
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-extrabold ${
                            mod.isBF
                              ? 'bg-black text-amber-300'
                              : isSelected ? 'bg-slate-900 text-white' : 'bg-white/20 text-white'
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
