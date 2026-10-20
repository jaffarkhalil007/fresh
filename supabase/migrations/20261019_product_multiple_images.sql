-- Products can have several pictures. image_url stays as the main picture
-- (the first entry), so existing cards and the cart keep working.
alter table public.products
  add column if not exists image_urls text[] not null default '{}';

-- Copy each existing single image into the new list.
update public.products
set image_urls = array[image_url]
where image_url is not null
  and image_url <> ''
  and image_urls = '{}';
