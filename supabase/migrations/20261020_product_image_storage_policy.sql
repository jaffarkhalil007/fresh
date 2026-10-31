-- Product images are public storefront assets, but uploads are admin-only.
-- The product-images bucket must exist and be configured as public.
drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_chat_admin()
  );
