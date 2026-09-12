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
  let extra = {};
  if (s.logo_url && s.logo_url.includes('#cfg=')) {
    try {
      const cfgStr = decodeURIComponent(s.logo_url.split('#cfg=')[1]);
      extra = JSON.parse(cfgStr);
    } catch (e) {}
  }
  const stage1 = extra.stage1Time !== undefined ? parseFloat(extra.stage1Time) : 3.0;
  const zoomMotion = extra.zoomMotionTime !== undefined ? parseFloat(extra.zoomMotionTime) : 5.0;
  const stage3 = extra.stage3Time !== undefined ? parseFloat(extra.stage3Time) : 4.0;
  const zoomRatio = extra.zoomScaleRatio !== undefined ? parseFloat(extra.zoomScaleRatio) : 1.28;
  const computedDwell = stage1 + zoomMotion + stage3;

  return {
    logoUrl: s.logo_url ? s.logo_url.split('#cfg=')[0] : '',
    slideshowDwellTime: s.slideshow_dwell_time !== undefined ? parseFloat(s.slideshow_dwell_time) : computedDwell,
    slideshowTransitionTime: s.slideshow_transition_time !== undefined ? parseFloat(s.slideshow_transition_time) : 1.0,
    slideshowShimmerTime: s.slideshow_shimmer_time !== undefined ? parseFloat(s.slideshow_shimmer_time) : 7.0,
    uiScale: s.ui_scale !== undefined ? parseFloat(s.ui_scale) : 1.0,
    stage1Time: stage1,
    zoomMotionTime: zoomMotion,
    stage3Time: stage3,
    zoomScaleRatio: zoomRatio
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

        const models = (modRes.data || []).map(mapModelFromDB).sort((a, b) => 
          (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })
        );

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
      sku: modelData.name || modelData.sku || '',
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
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase delete model error:', err);
      }
    }

    try {
      await fetch(`/api/models/${modelId}`, { method: 'DELETE' });
    } catch (e) {}
  },

  // 6. Bulk Save Models (from Excel / Spreadsheet)
  async saveBulkModels(modelsList) {
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch current model IDs from DB to detect deletions
        const { data: existingRows } = await supabase.from('models').select('id');
        const existingIds = (existingRows || []).map(r => r.id);
        const keepIds = new Set(modelsList.filter(m => m.id).map(m => m.id));
        const idsToDelete = existingIds.filter(id => !keepIds.has(id));

        // Delete items removed by the user in spreadsheet
        if (idsToDelete.length > 0) {
          await supabase.from('models').delete().in('id', idsToDelete);
        }

        // Upsert the remaining models
        if (modelsList.length > 0) {
          const dbModels = modelsList.map((m, idx) => ({
            id: m.id || ('mod-' + Date.now() + '-' + idx),
            category_id: m.categoryId || '',
            collection_id: m.collectionId || '',
            name: m.name || '',
            sku: m.name || m.sku || '',
            image: m.image || '',
            stock: parseInt(m.stock) || 0,
            original_price: parseFloat(m.originalPrice) || 0,
            sale_price: parseFloat(m.salePrice) || 0,
            notes: m.notes || ''
          }));

          const { error } = await supabase.from('models').upsert(dbModels);
          if (error) console.error('Supabase bulk save upsert error:', error);
        }
        return true;
      } catch (err) {
        console.warn('Supabase bulk save error:', err);
      }
    }

    try {
      await fetch('/api/models/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: modelsList })
      });
    } catch (e) {}
  },

  // Delete Category & its associated models & collections
  async deleteCategory(catId) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('models').delete().eq('category_id', catId);
        await supabase.from('collections').delete().eq('category_id', catId);
        await supabase.from('categories').delete().eq('id', catId);
        return true;
      } catch (err) {
        console.warn('Supabase delete category error:', err);
      }
    }
    try {
      await fetch(`/api/categories/${catId}`, { method: 'DELETE' });
    } catch (e) {}
  },

  // Delete Collection & its associated models
  async deleteCollection(colId) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('models').delete().eq('collection_id', colId);
        await supabase.from('collections').delete().eq('id', colId);
        return true;
      } catch (err) {
        console.warn('Supabase delete collection error:', err);
      }
    }
    try {
      await fetch(`/api/collections/${colId}`, { method: 'DELETE' });
    } catch (e) {}
  },

  // Delete All Catalog Data (Fresh Reset)
  async deleteAllData() {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('models').delete().neq('id', '');
        await supabase.from('collections').delete().neq('id', '');
        await supabase.from('categories').delete().neq('id', '');
        return true;
      } catch (err) {
        console.warn('Supabase deleteAllData error:', err);
      }
    }
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
    const stage1Time = settingsData.stage1Time !== undefined ? parseFloat(settingsData.stage1Time) : 3.0;
    const zoomMotionTime = settingsData.zoomMotionTime !== undefined ? parseFloat(settingsData.zoomMotionTime) : 5.0;
    const stage3Time = settingsData.stage3Time !== undefined ? parseFloat(settingsData.stage3Time) : 4.0;
    const zoomScaleRatio = settingsData.zoomScaleRatio !== undefined ? parseFloat(settingsData.zoomScaleRatio) : 1.28;
    const totalDwellTime = stage1Time + zoomMotionTime + stage3Time;

    const extraCfg = { stage1Time, zoomMotionTime, stage3Time, zoomScaleRatio };
    const rawLogo = (settingsData.logoUrl || '').split('#cfg=')[0];
    const encodedLogo = rawLogo 
      ? `${rawLogo}#cfg=${encodeURIComponent(JSON.stringify(extraCfg))}` 
      : `#cfg=${encodeURIComponent(JSON.stringify(extraCfg))}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const dbSettings = {
          id: 'global_settings',
          logo_url: encodedLogo,
          slideshow_dwell_time: totalDwellTime,
          slideshow_transition_time: settingsData.slideshowTransitionTime !== undefined ? parseFloat(settingsData.slideshowTransitionTime) : 1.0,
          slideshow_shimmer_time: settingsData.slideshowShimmerTime !== undefined ? parseFloat(settingsData.slideshowShimmerTime) : 7.0,
          ui_scale: settingsData.uiScale !== undefined ? parseFloat(settingsData.uiScale) : 1.0,
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
      body: JSON.stringify({ ...settingsData, stage1Time, zoomMotionTime, stage3Time, zoomScaleRatio, slideshowDwellTime: totalDwellTime })
    });
  }
};
