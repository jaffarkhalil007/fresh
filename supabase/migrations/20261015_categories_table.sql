-- Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "dev_all_categories" on public.categories;
create policy "dev_all_categories" on public.categories for all using (true) with check (true);

-- Seed with existing hardcoded categories
insert into public.categories (name, slug, sort_order) values
  ('Dairy & Milk',         'dairy',      1),
  ('Kitchen & Dining',     'kitchen',    2),
  ('General Household',    'general',    3),
  ('Beverages',            'beverages',  4),
  ('Household Grocery',    'grocery',    5),
  ('Meat & Chicken',       'meat',       6),
  ('Fruits & Juices',      'fruits',     7),
  ('Clothing & Apparel',   'clothing',   8),
  ('Health & Beauty',      'health',     9),
  ('Fresh Vegetables',     'vegetables', 10)
on conflict (slug) do nothing;
