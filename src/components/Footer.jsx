import React from 'react';
import { MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto bg-white border-t border-slate-100 py-3 px-4 sm:px-6 lg:px-8 no-print select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-800 tracking-tight">ASHLEY OUTLET</span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-slate-500">
            <MapPin className="w-3 h-3 text-red-500" />
            سلێمانی
          </span>
        </div>

        <div>
          <span>© {new Date().getFullYear()} Ashley Furniture Outlet</span>
        </div>
      </div>
    </footer>
  );
}
