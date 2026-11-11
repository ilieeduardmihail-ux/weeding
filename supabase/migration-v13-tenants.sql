-- migration-v13-tenants.sql: additive multi-tenant foundation.
-- Safe to run on the live single-wedding database: every existing row is
-- assigned to the first tenant, and the current app keeps working unchanged.
-- The tenant-scoped RLS policies and functions arrive in v14, together with
-- the code that sends tenant_id on every query.

-- 1. Tenant tables -----------------------------------------------------------
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60),
  display_name text not null check (char_length(display_name) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  expires_at timestamptz,
  theme jsonb not null default '{}'::jsonb
);

create table if not exists public.tenant_admins (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, email)
);

create table if not exists public.access_keys (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  duration_days integer not null check (duration_days between 1 and 3650),
  label text,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by_email text,
  revoked_at timestamptz
);

create table if not exists public.platform_owners (
  email text primary key,
  created_at timestamptz not null default now()
);

-- 2. The current wedding becomes the first tenant ----------------------------
do $$
declare
  v_tenant uuid := '00000000-0000-4000-8000-000000000001';
  v_name text;
begin
  select coalesce(nullif(btrim(partner_1), ''), 'Mire') || ' & ' ||
         coalesce(nullif(btrim(partner_2), ''), 'Mire')
    into v_name
    from public.event_settings
   order by id
   limit 1;

  insert into public.tenants (id, slug, display_name, status, activated_at)
  values (v_tenant, 'ana-si-stefan', coalesce(v_name, 'Nunta'), 'active', now())
  on conflict (id) do nothing;

  -- Everyone who can log in today keeps access to this wedding.
  insert into public.tenant_admins (tenant_id, email)
  select v_tenant, lower(email) from public.admins
  on conflict do nothing;

  -- The account that owns the platform.
  insert into public.platform_owners (email)
  values ('ilieeduardmihail@gmail.com')
  on conflict do nothing;
end $$;

-- 3. tenant_id on every tenant-owned table -----------------------------------
do $$
declare
  v_tenant uuid := '00000000-0000-4000-8000-000000000001';
  t text;
begin
  foreach t in array array[
    'rsvps', 'rsvp_guests', 'guests', 'expenses', 'expense_payments',
    'locations', 'event_settings', 'seating_tables', 'rsvp_log', 'rate_limits'
  ] loop
    execute format('alter table public.%I add column if not exists tenant_id uuid', t);
    execute format('update public.%I set tenant_id = %L where tenant_id is null', t, v_tenant);
    execute format('alter table public.%I alter column tenant_id set default %L', t, v_tenant);
    execute format('alter table public.%I alter column tenant_id set not null', t);
    execute format('create index if not exists %I on public.%I (tenant_id)', t || '_tenant_idx', t);

    if not exists (select 1 from pg_constraint where conname = t || '_tenant_fk') then
      execute format(
        'alter table public.%I add constraint %I foreign key (tenant_id) references public.tenants(id) on delete cascade',
        t, t || '_tenant_fk'
      );
    end if;
  end loop;
end $$;

-- 4. event_settings can hold one row per tenant ------------------------------
alter table public.event_settings drop constraint if exists event_settings_id_check;
create unique index if not exists event_settings_tenant_key on public.event_settings (tenant_id);
create sequence if not exists public.event_settings_id_seq start with 2;
alter table public.event_settings alter column id set default nextval('public.event_settings_id_seq');

-- 5. Views expose the tenant so the app can filter ---------------------------
create or replace view public.seating_people as
  select r.id, 'rsvp'::text as kind, r.name, r.table_number, r.tenant_id
    from public.rsvps r
   where r.attending
  union all
  select g.id, 'plus'::text as kind, g.name, g.table_number, g.tenant_id
    from public.rsvp_guests g
    join public.rsvps r on r.id = g.rsvp_id
   where r.attending
  union all
  select gu.id, 'guest'::text as kind, gu.full_name as name, gu.table_number, gu.tenant_id
    from public.guests gu;

create or replace view public.venue_report as
  select 'rsvp'::text as kind, r.name, false as is_child, r.table_number, true as counted, r.tenant_id
    from public.rsvps r
   where r.attending
  union all
  select 'plus'::text as kind, g.name, g.is_child, g.table_number, true as counted, g.tenant_id
    from public.rsvp_guests g
    join public.rsvps r on r.id = g.rsvp_id
   where r.attending
  union all
  select 'guest'::text as kind, gu.full_name as name, gu.is_child, gu.table_number,
         (gu.table_number is not null) as counted, gu.tenant_id
    from public.guests gu;

-- 6. Tenant helpers ----------------------------------------------------------
create or replace function public.is_tenant_admin(p_tenant uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenant_admins
    where tenant_id = p_tenant
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

create or replace function public.is_platform_owner()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from platform_owners
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

create or replace function public.tenant_is_active(p_tenant uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenants
    where id = p_tenant
      and status = 'active'
      and (expires_at is null or expires_at > now())
  )
$$;

create or replace function public.tenant_id_by_slug(p_slug text)
returns uuid
language sql stable security definer set search_path = public as $$
  select id from tenants where slug = lower(btrim(p_slug))
$$;

-- 7. RLS for the new tables --------------------------------------------------
alter table public.tenants enable row level security;
alter table public.tenant_admins enable row level security;
alter table public.access_keys enable row level security;
alter table public.platform_owners enable row level security;

drop policy if exists "public read active tenants" on public.tenants;
create policy "public read active tenants" on public.tenants
  for select to anon, authenticated
  using (status = 'active' and (expires_at is null or expires_at > now()));

drop policy if exists "admins read own tenant" on public.tenants;
create policy "admins read own tenant" on public.tenants
  for select to authenticated
  using (is_tenant_admin(id));

drop policy if exists "owners manage tenants" on public.tenants;
create policy "owners manage tenants" on public.tenants
  for all to authenticated
  using (is_platform_owner())
  with check (is_platform_owner());

-- 8. Privileges --------------------------------------------------------------
grant select on public.tenants to anon, authenticated;
grant select, insert, update, delete on public.tenants to service_role;
grant select, insert, update, delete on public.tenant_admins to service_role;
grant select, insert, update, delete on public.access_keys to service_role;
grant select, insert, update, delete on public.platform_owners to service_role;
grant execute on function public.is_tenant_admin(uuid) to authenticated;
grant execute on function public.is_platform_owner() to authenticated;
grant execute on function public.tenant_is_active(uuid) to anon, authenticated;
grant execute on function public.tenant_id_by_slug(text) to anon, authenticated;
