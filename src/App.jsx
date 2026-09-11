import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import SlideshowView from './components/SlideshowView';
import AdminSpreadsheet from './components/AdminSpreadsheet';
import Footer from './components/Footer';
import PrintSheet from './components/PrintSheet';
import AdminModal from './components/AdminModal';
import InstallModal from './components/InstallModal';
import { translations } from './locales';
import { PackageOpen } from 'lucide-react';
import { catalogService } from './services/catalogService';
import { isSupabaseConfigured } from './supabaseClient';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('ashley_lang') || 'ku');
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('ashley_isAdmin') === 'true');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ashley_viewMode') || 'grid'); // 'grid' | 'slideshow' | 'sheet'
  
  const [data, setData] = useState({ categories: [], collections: [], models: [], settings: { logoUrl: '' } });
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Slideshow state
  const [detailModel, setDetailModel] = useState(null);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [modelsToPrint, setModelsToPrint] = useState([]);
  const [adminModal, setAdminModal] = useState({
    isOpen: false,
    type: 'login', // 'login' | 'model' | 'category' | 'collection' | 'logo'
    editingModel: null
  });

  // PWA App Installation States (iPad / Tablet / Mobile)
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }
    return false;
  });

  const isIOSDevice = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return isIOS || isIPadOS;
  }, []);

  const t = translations[lang] || translations.ku;

  // Listen for PWA beforeinstallprompt & appinstalled events
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    }
  };

  // Set HTML dir and lang
  useEffect(() => {
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
    localStorage.setItem('ashley_lang', lang);
  }, [lang, t.dir]);

  // Clean responsive viewport without browser zoom distortion
  useEffect(() => {
    document.documentElement.style.removeProperty('zoom');
    document.documentElement.style.setProperty('--ui-scale', '1');
  }, []);

  // Persist admin & view mode
  useEffect(() => {
    localStorage.setItem('ashley_isAdmin', isAdmin);
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem('ashley_viewMode', viewMode);
  }, [viewMode]);

  // Fetch catalog data (Supabase or Local fallback)
  const fetchData = async () => {
    try {
      const result = await catalogService.fetchCatalog();
      if (result) {
        setData(result);
      }
    } catch (err) {
      console.error('Failed to load catalog data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // ⚡ Real-time sync across all connected iPads and browsers
    const unsubscribe = catalogService.subscribeRealtime((tableName) => {
      console.log(`⚡ Real-time update on [${tableName}], syncing...`);
      fetchData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Filter Models for Grid View
  const filteredModels = useMemo(() => {
    return (data.models || []).filter((model) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && model.categoryId !== selectedCategory) {
        return false;
      }

      // 2. Collection Filter
      if (selectedCollection !== 'all' && model.collectionId !== selectedCollection) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const nameMatch = (model.name || '').toLowerCase().includes(q);
        const skuMatch = (model.sku || '').toLowerCase().includes(q);
        const notesMatch = (model.notes || '').toLowerCase().includes(q);
        return nameMatch || skuMatch || notesMatch;
      }

      return true;
    });
  }, [data.models, selectedCategory, selectedCollection, searchQuery]);

  // Robust Print Handlers
  const handlePrintSingle = (model) => {
    if (!model) return;
    setModelsToPrint([model]);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleBatchPrint = () => {
    const list = viewMode === 'grid' ? filteredModels : data.models;
    if (!list || list.length === 0) return;
    setModelsToPrint(list);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Helper names
  const getCategoryName = (catId) => {
    const cat = data.categories.find(c => c.id === catId);
    if (!cat) return '';
    if (lang === 'ku') return cat.name_ku || cat.name;
    if (lang === 'ar') return cat.name_ar || cat.name;
    return cat.name_en || cat.name;
  };

  const getCollectionName = (colId) => {
    const col = data.collections.find(c => c.id === colId);
    return col ? col.name : '';
  };

  // Open slideshow on a specific model
  const openSlideshowOnModel = (model) => {
    const idx = (data.models || []).findIndex(m => m.id === model.id);
    if (idx !== -1) {
      setSlideshowIndex(idx);
    }
    setViewMode('slideshow');
  };

  // Admin Actions
  const handleLogin = (password) => {
    if (password === 'ashley123ewq') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const handleSaveModel = async (modelData) => {
    await catalogService.saveModel(modelData, adminModal.editingModel?.id);
    await fetchData();
  };

  const handleDeleteModel = async (model) => {
    if (!window.confirm(t.confirmDelete)) return;
    await catalogService.deleteModel(model.id);
    await fetchData();
    if (detailModel?.id === model.id) setDetailModel(null);
  };

  const handleSaveCategory = async (catData) => {
    await catalogService.saveCategory(catData);
    await fetchData();
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm(lang === 'ku' ? 'دڵنیایت لە سڕینەوەی ئەم کەتەگۆرییە؟' : 'Are you sure you want to delete this category?')) return;
    await catalogService.deleteCategory(catId);
    await fetchData();
  };

  const handleSaveCollection = async (colData) => {
    await catalogService.saveCollection(colData);
    await fetchData();
  };

  const handleDeleteCollection = async (colId) => {
    if (!window.confirm(lang === 'ku' ? 'دڵنیایت لە سڕینەوەی ئەم سێتە؟' : 'Are you sure you want to delete this collection?')) return;
    await catalogService.deleteCollection(colId);
    await fetchData();
  };

  const handleClearAllData = async () => {
    if (!window.confirm(lang === 'ku' ? 'ئاگاداری: هەموو مۆدێلەکان و کەتەگۆرییەکان بە تەواوی دەسڕدرێنەوە. ئایا دڵنیایت؟' : 'Warning: All models, collections, and categories will be permanently deleted. Are you sure?')) return;
    await catalogService.deleteAllData();
    await fetchData();
  };

  // Bulk save from Spreadsheet
  const handleSaveBulk = async (updatedModels) => {
    await catalogService.saveBulkModels(updatedModels);
    await fetchData();
  };

  // Save settings (logo, slideshow timings, ui scale, etc.)
  const handleSaveSettings = async (settingsPayload) => {
    await catalogService.saveSettings(settingsPayload);
    await fetchData();
  };

  // Save website logo
  const handleSaveLogo = async (logoUrl) => {
    await handleSaveSettings({ logoUrl });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col selection:bg-red-600 selection:text-white">
      
      {/* SCREEN INTERFACE: Hidden entirely on @media print */}
      <div id="screen-root" className="flex-1 flex flex-col no-print">
        
        {/* Top Navigation Bar */}
        <Navbar
          t={t}
          lang={lang}
          setLang={setLang}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          logoUrl={data.settings?.logoUrl || ''}
          openLoginModal={() => setAdminModal({ isOpen: true, type: 'login', editingModel: null })}
          openNewModelModal={() => setAdminModal({ isOpen: true, type: 'model', editingModel: null })}
          openNewCategoryModal={() => setAdminModal({ isOpen: true, type: 'category', editingModel: null })}
          openNewCollectionModal={() => setAdminModal({ isOpen: true, type: 'collection', editingModel: null })}
          openLogoModal={() => setAdminModal({ isOpen: true, type: 'settings', editingModel: null })}
          openSettingsModal={() => setAdminModal({ isOpen: true, type: 'settings', editingModel: null })}
          openInstallModal={() => setIsInstallModalOpen(true)}
          onBatchPrint={handleBatchPrint}
          filteredCount={filteredModels.length}
        />

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-slate-500 font-medium">چاوەڕوان بە...</p>
          </div>
        ) : viewMode === 'sheet' && isAdmin ? (
          /* SPREADSHEET VIEW: Google Sheets / Excel style editable table */
          <AdminSpreadsheet
            models={data.models || []}
            categories={data.categories || []}
            collections={data.collections || []}
            t={t}
            lang={lang}
            onSaveBulk={handleSaveBulk}
            onClose={() => setViewMode('grid')}
          />
        ) : viewMode === 'slideshow' ? (
          /* SLIDESHOW VIEW: Left Mini-window + Fullscreen Hero Showcase */
          <>
            <SlideshowView
              models={data.models || []}
              categories={data.categories || []}
              collections={data.collections || []}
              t={t}
              lang={lang}
              isAdmin={isAdmin}
              logoUrl={data.settings?.logoUrl || ''}
              settings={data.settings || {}}
              onPrintSingle={handlePrintSingle}
              onEditModel={(m) => setAdminModal({ isOpen: true, type: 'model', editingModel: m })}
              onOpenSettings={() => setAdminModal({ isOpen: true, type: 'settings', editingModel: null })}
              initialIndex={slideshowIndex}
            />
            <Footer t={t} lang={lang} />
          </>
        ) : (
          /* GRID VIEW: Windows 11 Modern Cards Layout */
          <>
            {/* Filter & Search Bar */}
            <FilterBar
              t={t}
              lang={lang}
              categories={data.categories || []}
              collections={data.collections || []}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedCollection={selectedCollection}
              setSelectedCollection={setSelectedCollection}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              totalCount={data.models?.length || 0}
              filteredCount={filteredModels.length}
            />

            {/* Product Grid */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
              {filteredModels.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-md mx-auto p-8">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <PackageOpen className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">{t.noResultsFound}</h4>
                  <p className="text-xs text-slate-500 mt-1">تکایە گەڕانەکەت بگۆڕە یان فلتەرەکان لابدە</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredModels.map((model) => (
                    <ProductCard
                      key={model.id}
                      model={model}
                      t={t}
                      categoryName={getCategoryName(model.categoryId)}
                      collectionName={getCollectionName(model.collectionId)}
                      isAdmin={isAdmin}
                      onOpenDetails={(m) => setDetailModel(m)}
                      onOpenSlideshow={() => openSlideshowOnModel(model)}
                      onPrintSingle={handlePrintSingle}
                      onEdit={(m) => setAdminModal({ isOpen: true, type: 'model', editingModel: m })}
                      onDelete={handleDeleteModel}
                    />
                  ))}
                </div>
              )}
            </main>

            {/* Footer with Darko Haidar Project Attribution */}
            <Footer t={t} lang={lang} />
          </>
        )}

        {/* Product Full Details Modal */}
        <ProductModal
          model={detailModel}
          t={t}
          categoryName={detailModel ? getCategoryName(detailModel.categoryId) : ''}
          collectionName={detailModel ? getCollectionName(detailModel.collectionId) : ''}
          logoUrl={data.settings?.logoUrl || ''}
          onClose={() => setDetailModel(null)}
          onPrint={handlePrintSingle}
          onOpenSlideshow={() => {
            if (detailModel) openSlideshowOnModel(detailModel);
            setDetailModel(null);
          }}
        />

        {/* Admin Action Modals */}
        <AdminModal
          type={adminModal.type}
          isOpen={adminModal.isOpen}
          onClose={() => setAdminModal({ ...adminModal, isOpen: false })}
          t={t}
          lang={lang}
          categories={data.categories || []}
          collections={data.collections || []}
          editingModel={adminModal.editingModel}
          currentLogo={data.settings?.logoUrl || ''}
          settings={data.settings || {}}
          onLogin={handleLogin}
          onSaveModel={handleSaveModel}
          onSaveCategory={handleSaveCategory}
          onDeleteCategory={handleDeleteCategory}
          onSaveCollection={handleSaveCollection}
          onDeleteCollection={handleDeleteCollection}
          onSaveLogo={handleSaveLogo}
          onSaveSettings={handleSaveSettings}
          onClearAllData={handleClearAllData}
        />

        {/* PWA App Install Modal for iPads, Tablets & Mobile */}
        <InstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          isInstalled={isAppInstalled}
          isIOS={isIOSDevice}
          hasNativePrompt={!!deferredPrompt}
          onNativeInstall={handleNativeInstall}
          lang={lang}
        />

      </div>

      {/* PRINT ENGINE: Rendered as direct child, fully visible exclusively during print */}
      <PrintSheet
        modelsToPrint={modelsToPrint.length > 0 ? modelsToPrint : (data.models || [])}
        categories={data.categories || []}
        collections={data.collections || []}
        logoUrl={data.settings?.logoUrl || ''}
        t={t}
        lang={lang}
      />

    </div>
  );
}
