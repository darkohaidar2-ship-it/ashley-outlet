-- ==============================================================================
-- ASHLEY FURNITURE OUTLET - SUPABASE PRODUCTION DATABASE SCHEMA & SEED
-- Project Ref: ojhminrrkkxwyybpgvrs
-- Execute this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CATEGORIES TABLE
create table if not exists public.categories (
  id text primary key,
  name_ku text not null,
  name_en text default '',
  name_ar text default '',
  icon text default 'Sofa',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. COLLECTIONS TABLE
create table if not exists public.collections (
  id text primary key,
  category_id text references public.categories(id) on delete set null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. MODELS TABLE (Furniture Items)
create table if not exists public.models (
  id text primary key,
  category_id text default '',
  collection_id text default '',
  name text not null,
  sku text default '',
  image text default '',
  stock integer default 0,
  original_price numeric default 0,
  sale_price numeric default 0,
  notes text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SETTINGS TABLE (Branding, Slideshow Timings, UI Zoom Scale)
create table if not exists public.settings (
  id text primary key default 'global_settings',
  logo_url text default '',
  slideshow_dwell_time numeric default 4.5,
  slideshow_transition_time numeric default 1.0,
  slideshow_shimmer_time numeric default 7.0,
  ui_scale numeric default 0.80,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.models enable row level security;
alter table public.settings enable row level security;

-- Open policies for public access (allow sales staff & admin to read/write freely)
drop policy if exists "Public Categories Access" on public.categories;
create policy "Public Categories Access" on public.categories for all using (true) with check (true);

drop policy if exists "Public Collections Access" on public.collections;
create policy "Public Collections Access" on public.collections for all using (true) with check (true);

drop policy if exists "Public Models Access" on public.models;
create policy "Public Models Access" on public.models for all using (true) with check (true);

drop policy if exists "Public Settings Access" on public.settings;
create policy "Public Settings Access" on public.settings for all using (true) with check (true);

-- 7. ENABLE REALTIME ON ALL TABLES
-- Safe realtime publication: ignores if already added
do $$
begin
  begin
    alter publication supabase_realtime add table public.categories;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.collections;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.models;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.settings;
  exception when others then null;
  end;
end $$;

-- 8. STORAGE BUCKET CREATION FOR PRODUCT IMAGES & LOGO
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ashley-catalog',
  'ashley-catalog',
  true,
  10485760, -- 10MB
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set public = true;

-- Storage public read policy
drop policy if exists "Public Access for Catalog Bucket" on storage.objects;
create policy "Public Access for Catalog Bucket"
on storage.objects for select
using (bucket_id = 'ashley-catalog');

-- Storage upload policy
drop policy if exists "Allow Public Upload to Catalog Bucket" on storage.objects;
create policy "Allow Public Upload to Catalog Bucket"
on storage.objects for insert
with check (bucket_id = 'ashley-catalog');

-- Storage update policy
drop policy if exists "Allow Public Update in Catalog Bucket" on storage.objects;
create policy "Allow Public Update in Catalog Bucket"
on storage.objects for update
using (bucket_id = 'ashley-catalog');

-- Storage delete policy
drop policy if exists "Allow Public Delete in Catalog Bucket" on storage.objects;
create policy "Allow Public Delete in Catalog Bucket"
on storage.objects for delete
using (bucket_id = 'ashley-catalog');

-- 9. INITIAL DATA SEEDING (With Iraqi Dinar IQD & Outlet Demo Data)

-- Categories
insert into public.categories (id, name_ku, name_en, name_ar, icon) values
  ('cat-living', 'ژووری دانیشتن', 'Living Room', 'غرفة المعيشة', 'Sofa'),
  ('cat-bedroom', 'ژووری نووستن', 'Bedroom', 'غرفة النوم', 'Bed'),
  ('cat-dining', 'ژووری نانخواردن', 'Dining Room', 'غرفة الطعام', 'Utensils'),
  ('cat-accessories', 'مێز و دیکۆرات', 'Tables & Decor', 'طاولات وديكور', 'Lamp')
on conflict (id) do update set 
  name_ku = excluded.name_ku, 
  name_en = excluded.name_en, 
  name_ar = excluded.name_ar, 
  icon = excluded.icon;

-- Collections
insert into public.collections (id, category_id, name) values
  ('col-darcy', 'cat-living', 'Darcy Collection'),
  ('col-rawcliffe', 'cat-living', 'Rawcliffe Modern'),
  ('col-bolanburg', 'cat-bedroom', 'Bolanburg Antique'),
  ('col-realyn', 'cat-bedroom', 'Realyn French Country'),
  ('col-skempton', 'cat-dining', 'Skempton Counter Height'),
  ('col-decor', 'cat-accessories', 'Ashley Accent Tables')
on conflict (id) do update set 
  category_id = excluded.category_id, 
  name = excluded.name;

-- Initial Settings
insert into public.settings (id, logo_url, slideshow_dwell_time, slideshow_transition_time, slideshow_shimmer_time, ui_scale)
values (
  'global_settings',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
  4.5,
  1.0,
  7.0,
  0.80
)
on conflict (id) do update set
  slideshow_dwell_time = excluded.slideshow_dwell_time,
  slideshow_transition_time = excluded.slideshow_transition_time,
  slideshow_shimmer_time = excluded.slideshow_shimmer_time,
  ui_scale = excluded.ui_scale;

-- Models (Iraqi Dinar Prices)
insert into public.models (id, category_id, collection_id, name, sku, image, stock, original_price, sale_price, notes) values
  (
    'mod-101', 
    'cat-living', 
    'col-darcy', 
    'Darcy Sofa 3-Seater (قەنەفەی ٣ نەفەری)', 
    'ASH-7500-38', 
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80', 
    3, 
    850000, 
    590000, 
    'قوماشی پۆلیستەری بەرگری بەرز، قیاس: 228سم پانی × 96سم بەرزی. زۆر ئاسوودە بۆ دانیشتنی درێژخایەن.'
  ),
  (
    'mod-102', 
    'cat-living', 
    'col-darcy', 
    'Darcy Loveseat 2-Seater (قەنەفەی ٢ نەفەری)', 
    'ASH-7500-35', 
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80', 
    2, 
    680000, 
    460000, 
    'گونجاو بۆ ژووری میوان و هۆڵ. قیاس: 170سم × 96سم. تەواوکەری سێتی دارسی.'
  ),
  (
    'mod-103', 
    'cat-living', 
    'col-rawcliffe', 
    'Rawcliffe Sectional L-Shape (گۆشەی شاهانە)', 
    'ASH-9860-S5', 
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80', 
    1, 
    2200000, 
    1490000, 
    'قوماشی پەڕەیی سپی بەفری، لەگەڵ بالیفەکانی لەسەریەتی. قیاس: 320سم × 240سم.'
  ),
  (
    'mod-201', 
    'cat-bedroom', 
    'col-bolanburg', 
    'Bolanburg King Bed Frame (تەختەی کینگ بە کەنتۆر)', 
    'ASH-B647-58', 
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80', 
    4, 
    1650000, 
    1150000, 
    'دارێکی سروشتی تەواو ئەستوور بە دیزاینی ڤینتیجی ئەمریکی، پێوانە 200سم × 200سم.'
  ),
  (
    'mod-202', 
    'cat-bedroom', 
    'col-bolanburg', 
    'Bolanburg Nightstand 3-Drawer (کۆمۆدین ٣ چەکمەجە)', 
    'ASH-B647-93', 
    'https://images.unsplash.com/photo-1532372998445-5f6e650b097b?auto=format&fit=crop&w=1000&q=80', 
    6, 
    390000, 
    240000, 
    'چەکمەجەکان بە شێوازی نەرم دادەخرێن (Soft-close)، شوێنی پاوەری بارگاویکردنەوەی تێدایە.'
  ),
  (
    'mod-203', 
    'cat-bedroom', 
    'col-realyn', 
    'Realyn Dresser with Mirror (مێزی ماکیاژ بە ئاوێنە)', 
    'ASH-B743-31', 
    'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=80', 
    2, 
    1200000, 
    790000, 
    'دیزاینی کلاسیکی فەرەنسی ڕەنگی کرێمی، لەگەڵ ئاوێنەی تەلارسازی کلاسیک.'
  ),
  (
    'mod-301', 
    'cat-dining', 
    'col-skempton', 
    'Skempton Counter Height Table + 4 Stools (مێزی نانخواردن + ٤ کورسی)', 
    'ASH-D397-223', 
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=80', 
    5, 
    780000, 
    520000, 
    'زۆر گونجاوە بۆ چێشتخانە و هۆڵی بچووک، ڕەفەی لاوەکی هەیە بۆ شووشە و دەفر.'
  ),
  (
    'mod-401', 
    'cat-accessories', 
    'col-decor', 
    'Ashley Marble Accent Table (مێزی سووچ بە مەڕمەڕ)', 
    'ASH-T120-2', 
    'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80', 
    8, 
    210000, 
    135000, 
    'سەری مەڕمەڕی سروشتی و پایەی ئاسنی ڕەشی مات. قیاس: 60سم بەرزایی × 50سم تیرە.'
  )
on conflict (id) do update set 
  name = excluded.name, 
  sku = excluded.sku, 
  image = excluded.image, 
  stock = excluded.stock, 
  original_price = excluded.original_price, 
  sale_price = excluded.sale_price, 
  notes = excluded.notes;

-- Verification query
select 
  (select count(*) from public.categories) as total_categories,
  (select count(*) from public.collections) as total_collections,
  (select count(*) from public.models) as total_models,
  (select count(*) from public.settings) as total_settings;
