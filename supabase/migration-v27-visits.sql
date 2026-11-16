-- v27: contorul de vizite, fără cookie-uri.
--
-- O vizită = un rând. Nu se stochează IP-ul, doar un hash HMAC (IP + browser +
-- RATE_LIMIT_SALT), care nu poate fi inversat și nu urmărește omul între
-- site-uri. `tenant_id` gol înseamnă site-ul de prezentare; o nuntă înseamnă
-- invitația ei.
--
-- Rândurile se păstrează 90 de zile: `visit_stats()` face curățenia la fiecare
-- citire, ca să nu fie nevoie de un cron.
--
-- Doar `service_role` are acces; panoul citește prin ruta /api/platform/activity,
-- după verificarea de owner.

create table if not exists public.site_visits (
  id bigserial primary key,
  at timestamptz not null default now(),
  path text not null,
  tenant_id uuid references public.tenants(id) on delete cascade,
  visitor_hash text not null,
  is_bot boolean not null default false
);

create index if not exists site_visits_at_idx on public.site_visits (at desc);
create index if not exists site_visits_tenant_at_idx on public.site_visits (tenant_id, at desc);
create index if not exists site_visits_visitor_idx on public.site_visits (visitor_hash, at desc);

alter table public.site_visits enable row level security;

grant all on public.site_visits to service_role;
grant usage on sequence public.site_visits_id_seq to service_role;

create or replace function public.visit_stats()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public as $$
declare v jsonb;
begin
  -- Retenția promisă în politica de confidențialitate.
  delete from site_visits where at < now() - interval '90 days';

  with demo as (
    select id from tenants where slug = 'demo'
  ),
  clean as (
    select id, at, visitor_hash,
      case when tenant_id is null then 'marketing' else 'invites' end as bucket
    from site_visits
    where not is_bot
      and (tenant_id is null or tenant_id not in (select id from demo))
  ),
  totals as (
    select bucket,
      count(*)::int as total,
      count(*) filter (where at > now() - interval '24 hours')::int as h24,
      count(*) filter (where at > now() - interval '7 days')::int as d7,
      count(distinct visitor_hash) filter (where at > now() - interval '24 hours')::int as u24,
      count(distinct visitor_hash) filter (where at > now() - interval '7 days')::int as u7
    from clean
    group by bucket
  ),
  hours as (
    select date_trunc('hour', now()) - make_interval(hours => n) as hour
    from generate_series(23, 0, -1) as n
  ),
  buckets as (
    select h.hour,
      count(c.id) filter (where c.bucket = 'marketing')::int as marketing,
      count(c.id) filter (where c.bucket = 'invites')::int as invites
    from hours h
    left join clean c on date_trunc('hour', c.at) = h.hour
    group by h.hour
    order by h.hour
  )
  select jsonb_build_object(
    'marketing', coalesce(
      (select jsonb_build_object('total', total, 'h24', h24, 'd7', d7, 'u24', u24, 'u7', u7)
       from totals where bucket = 'marketing'),
      '{"total":0,"h24":0,"d7":0,"u24":0,"u7":0}'::jsonb
    ),
    'invites', coalesce(
      (select jsonb_build_object('total', total, 'h24', h24, 'd7', d7, 'u24', u24, 'u7', u7)
       from totals where bucket = 'invites'),
      '{"total":0,"h24":0,"d7":0,"u24":0,"u7":0}'::jsonb
    ),
    'hourly', coalesce(
      (select jsonb_agg(jsonb_build_object(
         'hour', hour,
         'marketing', marketing,
         'invites', invites
       ) order by hour) from buckets),
      '[]'::jsonb
    )
  )
  into v;

  return v;
end $$;

revoke all on function public.visit_stats() from public, anon, authenticated;
grant execute on function public.visit_stats() to service_role;
