import { supabase, isSupabaseConfigured } from '../supabaseClient';

// Helper to map DB row to frontend Model object
function mapModelFromDB(m) {
  return {
    id: m.id,
    categoryId: m.category_id || '',
    collectionId: m.collection_id || '',
    name: m.name || '',
    sku: m.sku || '',
    image: m.image || '',
    stock: m.stock !== undefined ? parseInt(m.stock) : 0,
    originalPrice: m.original_price !== undefined ? parseFloat(m.original_price) : 0,
    salePrice: m.sale_price !== undefined ? parseFloat(m.sale_price) : 0,
    notes: m.notes || ''
  };
}

// Helper to map DB row to frontend Settings object
function mapSettingsFromDB(s) {
  if (!s) return null;
  return {
    logoUrl: s.logo_url || '',
    slideshowDwellTime: s.slideshow_dwell_time !== undefined ? parseFloat(s.slideshow_dwell_time) : 4.5,
    slideshowTransitionTime: s.slideshow_transition_time !== undefined ? parseFloat(s.slideshow_transition_time) : 1.0,
    slideshowShimmerTime: s.slideshow_shimmer_time !== undefined ? parseFloat(s.slideshow_shimmer_time) : 7.0,
    uiScale: s.ui_scale !== undefined ? parseFloat(s.ui_scale) : 0.80
  };
}

export const catalogService = {
  // 1. Fetch entire catalog data
  async fetchCatalog() {
    if (isSupabaseConfigured && supabase) {
      try {
        const [catRes, colRes, modRes, setRes] = await Promise.all([
          supabase.from('categories').select('*').order('created_at', { ascending: true }),
          supabase.from('collections').select('*').order('created_at', { ascending: true }),
          supabase.from('models').select('*').order('created_at', { ascending: false }),
          supabase.from('settings').select('*').eq('id', 'global_settings').maybeSingle()
        ]);

        const categories = (catRes.data || []).map(c => ({
          id: c.id,
          name_ku: c.name_ku,
          name_en: c.name_en,
          name_ar: c.name_ar,
          icon: c.icon
        }));

        const collections = (colRes.data || []).map(c => ({
          id: c.id,
          categoryId: c.category_id,
          name: c.name
        }));

        const models = (modRes.data || []).map(mapModelFromDB);

        const settings = mapSettingsFromDB(setRes.data) || {
          logoUrl: '',
          slideshowDwellTime: 4.5,
          slideshowTransitionTime: 1.0,
          slideshowShimmerTime: 7.0,
          uiScale: 0.80
        };

        return { categories, collections, models, settings, source: 'supabase' };
      } catch (err) {
        console.warn('Supabase fetch failed, trying local fallback:', err);
      }
    }

    // Fallback: Local API
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        return { ...json, source: 'local' };
      }
    } catch (err) {
      console.error('Local fetch failed as well:', err);
    }

    return { categories: [], collections: [], models: [], settings: {}, source: 'empty' };
  },

  // 2. Real-time Subscription (Live sync across iPads & devices)
  subscribeRealtime(onUpdate) {
    if (!isSupabaseConfigured || !supabase) return () => {};

    const channel = supabase
      .channel('ashley_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, () => onUpdate('models'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => onUpdate('categories'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, () => onUpdate('collections'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => onUpdate('settings'))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Supabase Realtime connected successfully!');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // 3. Upload image directly to Supabase Storage or Local server
  async uploadImage(file) {
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `ashley-${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ashley-catalog')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Supabase storage upload error:', uploadError);
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('ashley-catalog')
          .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
      } catch (err) {
        console.warn('Falling back to local upload endpoint:', err);
      }
    }

    // Local upload fallback
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.url;
  },

  // 4. Save Model (Insert or Update)
  async saveModel(modelData, editingId = null) {
    const dbPayload = {
      category_id: modelData.categoryId || '',
      collection_id: modelData.collectionId || '',
      name: modelData.name || '',
      sku: modelData.sku || '',
      image: modelData.image || '',
      stock: parseInt(modelData.stock) || 0,
      original_price: parseFloat(modelData.originalPrice) || 0,
      sale_price: parseFloat(modelData.salePrice) || 0,
      notes: modelData.notes || ''
    };

    if (isSupabaseConfigured && supabase) {
      try {
        if (editingId) {
          const { error } = await supabase.from('models').update(dbPayload).eq('id', editingId);
          if (!error) return true;
        } else {
          const id = 'mod-' + Date.now();
          const { error } = await supabase.from('models').insert({ id, ...dbPayload });
          if (!error) return true;
        }
      } catch (err) {
        console.warn('Supabase save model error:', err);
      }
    }

    // Local fallback
    if (editingId) {
      await fetch(`/api/models/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData)
      });
    } else {
      await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData)
      });
    }
  },

  // 5. Delete Model
  async deleteModel(modelId) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('models').delete().eq('id', modelId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete model error:', err);
      }
    }

    await fetch(`/api/models/${modelId}`, { method: 'DELETE' });
  },

  // 6. Bulk Save Models (from Excel / Spreadsheet)
  async saveBulkModels(modelsList) {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbModels = modelsList.map((m, idx) => ({
          id: m.id || ('mod-' + Date.now() + '-' + idx),
          category_id: m.categoryId || '',
          collection_id: m.collectionId || '',
          name: m.name || '',
          sku: m.sku || '',
          image: m.image || '',
          stock: parseInt(m.stock) || 0,
          original_price: parseFloat(m.originalPrice) || 0,
          sale_price: parseFloat(m.salePrice) || 0,
          notes: m.notes || ''
        }));

        const { error } = await supabase.from('models').upsert(dbModels);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase bulk save error:', err);
      }
    }

    await fetch('/api/models/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ models: modelsList })
    });
  },

  // 7. Save Category
  async saveCategory(catData) {
    if (isSupabaseConfigured && supabase) {
      try {
        const id = 'cat-' + Date.now();
        const { error } = await supabase.from('categories').insert({
          id,
          name_ku: catData.name_ku || '',
          name_en: catData.name_en || '',
          name_ar: catData.name_ar || '',
          icon: catData.icon || 'Sofa'
        });
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase category save error:', err);
      }
    }

    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catData)
    });
  },

  // 8. Save Collection
  async saveCollection(colData) {
    if (isSupabaseConfigured && supabase) {
      try {
        const id = 'col-' + Date.now();
        const { error } = await supabase.from('collections').insert({
          id,
          category_id: colData.categoryId || '',
          name: colData.name || ''
        });
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase collection save error:', err);
      }
    }

    await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(colData)
    });
  },

  // 9. Save Settings (Timings, UI Zoom, Logo)
  async saveSettings(settingsData) {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbSettings = {
          id: 'global_settings',
          logo_url: settingsData.logoUrl !== undefined ? settingsData.logoUrl : '',
          slideshow_dwell_time: settingsData.slideshowDwellTime !== undefined ? parseFloat(settingsData.slideshowDwellTime) : 4.5,
          slideshow_transition_time: settingsData.slideshowTransitionTime !== undefined ? parseFloat(settingsData.slideshowTransitionTime) : 1.0,
          slideshow_shimmer_time: settingsData.slideshowShimmerTime !== undefined ? parseFloat(settingsData.slideshowShimmerTime) : 7.0,
          ui_scale: settingsData.uiScale !== undefined ? parseFloat(settingsData.uiScale) : 0.80,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('settings').upsert(dbSettings);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase settings save error:', err);
      }
    }

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
  }
};
