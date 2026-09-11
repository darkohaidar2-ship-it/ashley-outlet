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
  Sliders,
  Download,
  Search,
  X
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
  searchQuery,
  setSearchQuery,
  openLoginModal, 
  openNewModelModal,
  openNewCategoryModal,
  openNewCollectionModal,
  openLogoModal,
  openSettingsModal,
  openInstallModal,
  onBatchPrint,
  filteredCount
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-13 sm:h-15">
          
          {/* Logo & Outlet Branding */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Ashley Outlet"
                className="h-8 sm:h-9 max-w-[130px] object-contain rounded-lg"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-linear-to-br from-red-600 to-rose-700 rounded-xl flex items-center justify-center shadow-xs text-white font-black text-base sm:text-lg tracking-tighter shrink-0">
                A
              </div>
            )}

            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900">
                ASHLEY
              </span>
              <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                OUTLET
              </span>
            </div>
          </div>

          {/* Integrated Clean Search Box */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md relative mx-2 sm:mx-4">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder || 'گەڕان...'}
              className="w-full ps-8.5 pe-8 py-1.5 bg-slate-100 hover:bg-slate-200/60 focus:bg-white border border-slate-200/80 focus:border-red-500 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery && setSearchQuery('')}
                className="absolute inset-y-0 end-0 flex items-center pe-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse shrink-0">
            
            {/* View Mode Switcher: Single Smart Button */}
            {viewMode === 'slideshow' ? (
              <button
                onClick={() => setViewMode('grid')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs shrink-0"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t.gridView}</span>
              </button>
            ) : (
              <button
                onClick={() => setViewMode('slideshow')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all shrink-0 shadow-2xs"
                title={t.slideshowView}
              >
                <Tv className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">{t.slideshowView}</span>
              </button>
            )}

            {/* Admin Spreadsheet Table View Button */}
            {isAdmin && (
              <button
                onClick={() => setViewMode(viewMode === 'sheet' ? 'grid' : 'sheet')}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 inline-flex items-center gap-1 text-xs font-bold rounded-xl border transition-all ${
                  viewMode === 'sheet'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                }`}
                title={t.spreadsheetView}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.spreadsheetView}</span>
              </button>
            )}

            {/* Batch Print Button (In Grid View) */}
            {filteredCount > 0 && viewMode !== 'sheet' && (
              <button
                onClick={onBatchPrint}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-2xs shrink-0"
                title={t.batchPrint}
              >
                <Printer className="w-3.5 h-3.5 text-red-600" />
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

            {/* Install App Icon Button */}
            <button
              onClick={openInstallModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 inline-flex items-center text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shrink-0"
              title={lang === 'ar' ? 'تثبيت التطبيق' : lang === 'en' ? 'Install App' : 'دابەزاندنی ئەپ'}
            >
              <Download className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden lg:inline text-xs font-bold ms-1">
                {lang === 'ar' ? 'تثبيت' : lang === 'en' ? 'App' : 'ئەپ'}
              </span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
              <button
                onClick={() => setLang('ku')}
                className={`px-1.5 py-0.5 rounded-lg transition-all ${
                  lang === 'ku' 
                    ? 'bg-white text-red-600 shadow-2xs font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                کورد
              </button>
              <button
                onClick={() => setLang('ar')}
                className={`px-1.5 py-0.5 rounded-lg transition-all ${
                  lang === 'ar' 
                    ? 'bg-white text-red-600 shadow-2xs font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                عرب
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-1.5 py-0.5 rounded-lg transition-all ${
                  lang === 'en' 
                    ? 'bg-white text-red-600 shadow-2xs font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>

            {/* Admin Login / Logout */}
            {isAdmin ? (
              <button
                onClick={() => setIsAdmin(false)}
                className="inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl font-medium transition-all"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.logout}</span>
              </button>
            ) : (
              <button
                onClick={openLoginModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title={t.login}
              >
                <LogIn className="w-3.5 h-3.5" />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
