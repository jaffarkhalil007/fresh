-- Product listings are public storefront data, including inactive products
-- needed by admins in the product-management screen.
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products
  for select
  to anon, authenticated
  using (true);
