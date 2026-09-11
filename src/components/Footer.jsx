import React from 'react';
import { MapPin, Award } from 'lucide-react';

export default function Footer({ t, lang }) {
  return (
    <footer className="mt-auto bg-white/80 border-t border-slate-100 py-3.5 px-4 sm:px-6 lg:px-8 no-print select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Project Concept Dedication */}
        <div className="text-center md:text-start max-w-2xl">
          <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1 opacity-75">
            <span className="font-bold text-xs tracking-tight text-slate-700">
              {t.brandName}
            </span>
            <span className="bg-red-600 text-white text-[8px] font-bold px-1 py-0.2 rounded-xs uppercase tracking-wider">
              OUTLET
            </span>
            <span className="text-slate-300 text-[10px]">•</span>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-red-500" />
              سلێمانی - Sulaymaniyah
            </span>
          </div>

          {/* Faded & Compact 2-3 Line Description & Darko Haidar Attribution */}
          <p className="text-[10px] text-slate-400 font-normal leading-relaxed">
            {t.footerCreditLine1}
          </p>
          <p className="text-[10px] text-slate-400/90 font-normal mt-0.5 leading-relaxed">
            {t.footerCreditLine2}
          </p>
        </div>

        {/* Right note / Tag */}
        <div className="flex flex-col items-center md:items-end text-[10px] text-slate-400 font-normal opacity-70">
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <Award className="w-3 h-3 text-red-600" />
            Ashley Furniture Outlet Official
          </span>
          <span className="mt-0.5">
            © {new Date().getFullYear()} هه‌موو مافه‌كان پارێزراون
          </span>
        </div>

      </div>
    </footer>
  );
}
