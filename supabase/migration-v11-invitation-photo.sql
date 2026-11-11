-- migration-v11-invitation-photo.sql: idempotent.
-- Run AFTER migration-v10-messages.sql.
--
-- 1. The invitation photo uploaded from /admin/messages.
-- 2. A public storage bucket for it, writable only by admins.

-- 1. Photo link ---------------------------------------------------------------
alter table event_settings add column if not exists invitation_image_url text;

-- 2. Storage bucket -----------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invitation', 'invitation', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public reads: WhatsApp and the site can fetch the picture.
drop policy if exists "invitation photo public read" on storage.objects;
create policy "invitation photo public read" on storage.objects
  for select to public
  using (bucket_id = 'invitation');

-- Only admins can upload, replace or delete it.
drop policy if exists "invitation photo admin write" on storage.objects;
create policy "invitation photo admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'invitation' and public.is_admin())
  with check (bucket_id = 'invitation' and public.is_admin());
