import React, { useRef, useEffect, useState } from 'react';
import {
  LayoutGrid,
  FileSpreadsheet,
  Tv,
  PlusCircle,
  FolderPlus,
  Layers,
  DollarSign,
  Printer,
  Sliders,
  Download,
  LogOut,
  Search,
  X,
  Menu
} from 'lucide-react';

const L = (lang, ku, ar, en) => (lang === 'ar' ? ar : lang === 'en' ? en : ku);

function NavItem({ icon: Icon, label, active, onClick, badge, tone = 'default' }) {
  const toneCls =
    tone === 'success' ? 'text-emerald-700' : tone === 'danger' ? 'text-rose-600' : 'text-slate-600';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[14px] transition-colors cursor-pointer text-start ${
        active
          ? 'bg-white text-slate-900 font-extrabold shadow-[0_1px_3px_rgba(15,23,42,0.08)]'
          : `${toneCls} font-semibold hover:bg-white/60`
      }`}
    >
      <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-slate-900' : ''}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span className="text-[10px] font-extrabold font-mono bg-slate-900 text-white rounded-full px-1.5 py-0.5">{badge}</span>
      ) : null}
    </button>
  );
}

/**
 * Full-screen admin layout (sidebar + top bar). It only wraps the existing views and calls the
 * same handlers the old Navbar called - no data or behaviour lives here.
 */
export default function AdminShell({
  t,
  lang,
  setLang,
  viewMode,
  setViewMode,
  setIsAdmin,
  logoUrl,
  searchQuery,
  setSearchQuery,
  openNewModelModal,
  openNewCategoryModal,
  openNewCollectionModal,
  openSettingsModal,
  openPriceMatcherModal,
  openInstallModal,
  onBatchPrint,
  filteredCount,
  children
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchRef = useRef(null);

  // Auto-dismiss the virtual keyboard when scrolling on tablets (same behaviour as the old Navbar)
  useEffect(() => {
    const handleScroll = () => {
      if (document.activeElement === searchRef.current) searchRef.current?.blur();
    };
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  const go = (fn) => () => {
    setDrawerOpen(false);
    fn && fn();
  };

  const sidebar = (
    <div className="h-full flex flex-col gap-1 p-4 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pt-1 pb-4">
        <img
          src={logoUrl || '/app-logo.jpg'}
          alt="Ashley Outlet"
          className="h-9 w-9 rounded-xl object-cover bg-white"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="leading-tight">
          <div className="font-black text-[17px] tracking-tight text-slate-900">Ashley Outlet</div>
          <div className="text-[11px] font-semibold text-slate-400">{L(lang, 'بەڕێوەبردن', 'الإدارة', 'Admin')}</div>
        </div>
      </div>

      {/* Primary action */}
      <button
        type="button"
        onClick={go(openNewModelModal)}
        className="mb-3 flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-bold py-3 transition-colors cursor-pointer"
      >
        <PlusCircle className="w-[18px] h-[18px]" />
        <span>{t.addNewModel}</span>
      </button>

      <NavItem icon={LayoutGrid} label={L(lang, 'کاتەلۆگ', 'الكتالوج', 'Catalog')} active={viewMode === 'grid'} onClick={go(() => setViewMode('grid'))} />
      <NavItem icon={FileSpreadsheet} label={t.spreadsheetView} active={viewMode === 'sheet'} onClick={go(() => setViewMode('sheet'))} />
      <NavItem icon={Tv} label={t.slideshowView} active={false} onClick={go(() => setViewMode('slideshow'))} />

      <div className="my-3 h-px bg-slate-300/60" />

      <NavItem icon={FolderPlus} label={t.addNewCategory} onClick={go(openNewCategoryModal)} />
      <NavItem icon={Layers} label={t.addNewCollection} onClick={go(openNewCollectionModal)} />
      <NavItem icon={DollarSign} tone="success" label={L(lang, 'هاوتاکردنی نرخ', 'مطابقة الأسعار', 'Price matcher')} onClick={go(openPriceMatcherModal)} />
      {filteredCount > 0 && viewMode !== 'sheet' && (
        <NavItem icon={Printer} label={t.print || L(lang, 'چاپکردن', 'طباعة', 'Print')} badge={filteredCount} onClick={go(onBatchPrint)} />
      )}
      <NavItem icon={Sliders} label={t.settings || L(lang, 'ڕێکخستنەکان', 'الإعدادات', 'Settings')} onClick={go(openSettingsModal)} />
      <NavItem icon={Download} label={L(lang, 'دابەزاندنی ئەپ', 'تثبيت التطبيق', 'Install app')} onClick={go(openInstallModal)} />

      <div className="mt-auto pt-4 space-y-3">
        {/* Language */}
        <div className="flex items-center bg-white/70 p-1 rounded-2xl text-[12px] font-bold">
          {[['ku', 'کورد'], ['ar', 'عرب'], ['en', 'EN']].map(([code, label]) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={`flex-1 py-1.5 rounded-xl transition-colors cursor-pointer ${
                lang === code ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <NavItem icon={LogOut} tone="danger" label={t.logout} onClick={go(() => setIsAdmin(false))} />
      </div>
    </div>
  );

  return (
    <div className="no-print h-screen w-screen overflow-hidden bg-[#d9d9e2] p-0 sm:p-3">
      <div className="h-full w-full flex bg-[#eeeef3] sm:rounded-[28px] overflow-hidden">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-[272px] shrink-0 border-e border-slate-300/50">{sidebar}</aside>

        {/* Sidebar (drawer on tablets / phones) */}
        {drawerOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawerOpen(false)} />
            <aside className="relative w-[285px] max-w-[85vw] h-full bg-[#eeeef3] shadow-2xl">{sidebar}</aside>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <header className="shrink-0 flex items-center gap-3 px-4 sm:px-6 h-[68px]">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-white text-slate-700 shadow-sm cursor-pointer"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative flex-1 max-w-[460px]">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                enterKeyHint="search"
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchRef.current?.blur(); }}
                placeholder={t.searchPlaceholder || 'گەڕان...'}
                className="w-full ps-10 pe-9 py-2.5 bg-white rounded-2xl text-[13px] font-medium text-slate-800 placeholder:text-slate-400 border border-transparent focus:border-slate-300 outline-none shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery && setSearchQuery(''); searchRef.current?.blur(); }}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="ms-auto flex items-center gap-2.5">
              <span className="hidden sm:inline text-[12px] font-bold text-slate-500">
                {L(lang, 'بەڕێوەبەر', 'مدير', 'Admin')}
              </span>
              <span className="relative w-9 h-9 rounded-full bg-slate-900 text-white grid place-items-center text-[13px] font-black">
                A
                <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#eeeef3]" />
              </span>
            </div>
          </header>

          {/* Page */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {viewMode === 'sheet' ? (
              <div className="h-full [&>div]:!h-full">{children}</div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
