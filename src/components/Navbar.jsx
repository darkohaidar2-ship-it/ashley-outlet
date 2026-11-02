import React, { useRef, useEffect } from 'react';
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
  X,
  DollarSign,
  Flame
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
  campaign = 'black_friday',
  setCampaign,
  bfCount = 0,
  outletCount = 0,
  openLoginModal, 
  openNewModelModal,
  openNewCategoryModal,
  openNewCollectionModal,
  openLogoModal,
  openSettingsModal,
  openPriceMatcherModal,
  openInstallModal,
  onBatchPrint,
  filteredCount
}) {
  const searchInputRef = useRef(null);

  // Auto-dismiss virtual keyboard when user scrolls on iPad / tablet / mobile
  useEffect(() => {
    const handleScroll = () => {
      if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/70 no-print">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[54px] sm:h-[60px] md:h-[68px] gap-2">
          
          {/* Logo & Outlet Branding */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
            <img
              src={logoUrl || '/app-logo.jpg'}
              alt="Ashley Outlet"
              className="h-8 sm:h-9 max-w-[130px] object-contain rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />

            <div className="hidden sm:flex items-center space-x-1.5 rtl:space-x-reverse">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900">
                ASHLEY
              </span>
              {campaign === 'black_friday' ? (
                <span className="bg-gradient-to-r from-orange-600 to-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                  <Flame className="w-2.5 h-2.5 fill-black" />
                  <span>BLACK FRIDAY</span>
                </span>
              ) : (
                <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  OUTLET
                </span>
              )}
            </div>
          </div>

          {/* Campaign Switcher (بلاک فرایدەی / ئاوتلێت / هەمووی) */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setCampaign && setCampaign('black_friday')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                campaign === 'black_friday'
                  ? 'bg-neutral-950 text-orange-400 shadow-sm ring-1 ring-orange-500/40'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="کەمپەینی بلاک فرایدەی"
            >
              <Flame className={`w-3.5 h-3.5 ${campaign === 'black_friday' ? 'text-orange-500 fill-orange-500' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">بلاک فرایدەی</span>
              <span className={`text-[10px] px-1.5 py-0.1 rounded-full font-bold ${
                campaign === 'black_friday' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {bfCount || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCampaign && setCampaign('outlet')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                campaign === 'outlet'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="بەشی ئاوتلێت"
            >
              <span className="hidden sm:inline">ئاوتلێت</span>
              <span className={`text-[10px] px-1.5 py-0.1 rounded-full font-bold ${
                campaign === 'outlet' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {outletCount || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCampaign && setCampaign('all')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                campaign === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="هەموو کاڵاکان"
            >
              <span>هەمووی</span>
            </button>
          </div>

          {/* Integrated Clean Search Box */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md relative mx-2 sm:mx-4">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              ref={searchInputRef}
              type="search"
              enterKeyHint="search"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchInputRef.current?.blur();
                }
              }}
              placeholder={t.searchPlaceholder || 'گەڕان...'}
              className="w-full ps-8.5 pe-8 py-2 bg-slate-100 hover:bg-slate-200/60 focus:bg-white border border-transparent focus:border-blue-500 rounded-full text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery && setSearchQuery('');
                  searchInputRef.current?.blur();
                }}
                className="absolute inset-y-0 end-0 flex items-center pe-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                <Tv className="w-3.5 h-3.5 text-blue-600" />
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
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full transition-all shadow-2xs shrink-0"
                title={t.batchPrint}
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {filteredCount}
                </span>
              </button>
            )}

            {/* Admin Action Buttons (When Logged In) */}
            {isAdmin && (
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <button
                  onClick={openNewModelModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs transition-all"
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
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                </button>

                {/* Smart Price Matcher Modal Trigger */}
                <button
                  onClick={openPriceMatcherModal}
                  className="p-1.5 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-300 transition-all shadow-2xs"
                  title="هاوتاکردنی نرخ لەگەڵ فایلی ئێکسڵ بە دۆلار ($) - Price Matcher"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              </div>
            )}

            {/* Install App Icon Button */}
            <button
              onClick={openInstallModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 inline-flex items-center text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shrink-0"
              title={lang === 'ar' ? 'تثبيت التطبيق' : lang === 'en' ? 'Install App' : 'دابەزاندنی ئەپ'}
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
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
                    ? 'bg-white text-blue-600 shadow-2xs font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                کورد
              </button>
              <button
                onClick={() => setLang('ar')}
                className={`px-1.5 py-0.5 rounded-lg transition-all ${
                  lang === 'ar' 
                    ? 'bg-white text-blue-600 shadow-2xs font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                عرب
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-1.5 py-0.5 rounded-lg transition-all ${
                  lang === 'en' 
                    ? 'bg-white text-blue-600 shadow-2xs font-bold' 
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
