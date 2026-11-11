-- migration-v16-tenant-session-tightening.sql
-- The public read policies were written for the anon key, but they also applied
-- to any signed-in account ("to anon, authenticated"). With several weddings in
-- the database that meant a client admin could list every active tenant and read
-- every event_settings/locations row. The public site reads with the anon key and
-- never depends on a visitor session, while admins have their own tenant policies,
-- so these three policies are narrowed to anon only.

drop policy if exists "public read active tenants" on public.tenants;
create policy "public read active tenants" on public.tenants
  for select to anon
  using (status = 'active' and (expires_at is null or expires_at > now()));

drop policy if exists "public read settings" on public.event_settings;
create policy "public read settings" on public.event_settings
  for select to anon using (true);

drop policy if exists "public read locations" on public.locations;
create policy "public read locations" on public.locations
  for select to anon using (true);
