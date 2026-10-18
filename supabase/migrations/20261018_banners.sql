-- Homepage banners uploaded by the admin from the Admin Dashboard.
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text not null,
  link_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.banners enable row level security;

-- Storefront visitors can read only the banners that are switched on.
drop policy if exists "Public can read active banners" on public.banners;
create policy "Public can read active banners"
  on public.banners for select
  to anon, authenticated
  using (is_active = true);

-- Only the store owner / admins (see is_chat_admin) can read all, add, edit or delete banners.
drop policy if exists "Admins manage banners" on public.banners;
create policy "Admins manage banners"
  on public.banners for all
  to authenticated
  using (public.is_chat_admin())
  with check (public.is_chat_admin());
