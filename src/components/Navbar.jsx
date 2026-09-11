import React from 'react';
import { 
  Printer, 
  LogIn, 
  LogOut, 
  PlusCircle, 
  FolderPlus, 
  Layers, 
  LayoutGrid, 
  Tv, 
  FileSpreadsheet, 
  Image as ImageIcon,
  Sliders
} from 'lucide-react';

export default function Navbar({ 
  t, 
  lang, 
  setLang, 
  viewMode,
  setViewMode,
  isAdmin, 
  setIsAdmin, 
  logoUrl,
  openLoginModal, 
  openNewModelModal,
  openNewCategoryModal,
  openNewCollectionModal,
  openLogoModal,
  openSettingsModal,
  onBatchPrint,
  filteredCount
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-13 sm:h-15">
          
          {/* Logo & Outlet Branding */}
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Ashley Outlet Logo"
                className="h-8 sm:h-9 max-w-[140px] object-contain rounded-lg"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-linear-to-br from-red-600 to-rose-700 rounded-xl flex items-center justify-center shadow-sm text-white font-black text-base sm:text-lg tracking-tighter shrink-0">
                A
              </div>
            )}

            <div>
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  ASHLEY
                </span>
                <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                  OUTLET
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none">
                {t.brandSubtitle}
              </p>
            </div>
          </div>

          {/* Center / Right: View Mode Toggle (Grid vs Slideshow vs Spreadsheet) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 rtl:space-x-reverse">
            
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              {/* Grid Button */}
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title={t.gridView}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden md:inline">{t.gridView}</span>
              </button>

              {/* Slideshow Button */}
              <button
                onClick={() => setViewMode('slideshow')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'slideshow'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title={t.slideshowView}
              >
                <Tv className="w-3.5 h-3.5 text-red-600" />
                <span>{t.slideshowView}</span>
              </button>

              {/* Admin Spreadsheet Table View Button */}
              {isAdmin && (
                <button
                  onClick={() => setViewMode('sheet')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'sheet'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                  title={t.spreadsheetView}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.spreadsheetView}</span>
                </button>
              )}
            </div>

            {/* Batch Print Button (In Grid View) */}
            {filteredCount > 0 && viewMode !== 'sheet' && (
              <button
                onClick={onBatchPrint}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-2xs"
                title={t.batchPrint}
              >
                <Printer className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden lg:inline">{t.batchPrint}</span>
                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {filteredCount}
                </span>
              </button>
            )}

            {/* Admin Action Buttons (When Logged In) */}
            {isAdmin && (
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <button
                  onClick={openNewModelModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-2xs transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{t.addNewModel}</span>
                </button>

                <button
                  onClick={openNewCategoryModal}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
                  title={t.addNewCategory}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={openNewCollectionModal}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
                  title={t.addNewCollection}
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>

                {/* Slideshow & System Settings Button */}
                <button
                  onClick={openSettingsModal || openLogoModal}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
                  title={t.slideshowSettings}
                >
                  <Sliders className="w-3.5 h-3.5 text-red-600" />
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setLang('ku')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  lang === 'ku' 
                    ? 'bg-white text-red-600 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                کوردی
              </button>
              <button
                onClick={() => setLang('ar')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  lang === 'ar' 
                    ? 'bg-white text-red-600 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  lang === 'en' 
                    ? 'bg-white text-red-600 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>

            {/* Discreet Admin Login / Logout */}
            {isAdmin ? (
              <button
                onClick={() => setIsAdmin(false)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl font-medium transition-all"
                title={t.logout}
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            ) : (
              <button
                onClick={openLoginModal}
                className="text-[10px] text-slate-400 hover:text-slate-700 px-1.5 py-1 transition-colors rounded-lg hover:bg-slate-100"
                title={t.login}
              >
                {t.login}
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
