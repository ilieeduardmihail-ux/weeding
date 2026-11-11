-- migration-v15-platform.sql
-- Prepares the platform owner panel: a "pending" tenant that has no public site
-- until its access key is redeemed, owner-only access to the admin list and the
-- keys, and is_admin() back to meaning "member of a wedding" only.

-- 1. Pending tenants ---------------------------------------------------------
alter table public.tenants drop constraint if exists tenants_status_check;
alter table public.tenants add constraint tenants_status_check
  check (status in ('pending', 'active', 'suspended'));

-- 2. /admin is for wedding admins; the owner has /platform -------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenant_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

-- 3. The owner can manage the admin list and the access keys -----------------
drop policy if exists "owners manage tenant admins" on public.tenant_admins;
create policy "owners manage tenant admins" on public.tenant_admins
  for all to authenticated
  using (is_platform_owner()) with check (is_platform_owner());

drop policy if exists "owners manage access keys" on public.access_keys;
create policy "owners manage access keys" on public.access_keys
  for all to authenticated
  using (is_platform_owner()) with check (is_platform_owner());

-- Admins may see the other admins of their own wedding (used by the panel).
drop policy if exists "admins read own tenant admins" on public.tenant_admins;
create policy "admins read own tenant admins" on public.tenant_admins
  for select to authenticated using (is_tenant_admin(tenant_id));

grant select on public.tenant_admins to authenticated;

-- 4. One admin account can only belong to weddings that exist -----------------
-- (already enforced by the composite primary key, nothing to change)

-- 5. Access keys are hashed with SHA-256 in the app; the database only stores
--    the hash, so a key can be shown exactly once, right after generation.