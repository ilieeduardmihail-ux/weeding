-- migration-v35-retention.sql
-- Două lucruri cerute de politica de confidențialitate, plus acordul separat
-- pentru contactarea comercială:
--   1. `leads.marketing_at` — dovada că omul a bifat „vreau să fiu contactat”
--      pentru o ofertă. Fără el, proprietarul poate răspunde, dar nu poate
--      trimite oferte.
--   2. funcții de curățenie pe care le cheamă cron-ul zilnic: confirmările
--      rămase după nuntă, vizitele anonime și (în cod) jurnalul de emailuri.

alter table public.leads add column if not exists marketing_at timestamptz;

comment on column public.leads.marketing_at is
  'Momentul acordului pentru a fi contactat despre o invitație. Null = fără acord.';

-- Confirmările unei nunți se șterg la 6 luni după data evenimentului, cum
-- promite politica fiecărei invitații. Demo-ul și sandbox-urile sunt excluse:
-- acolo datele sunt fictive, iar sandbox-urile dispar singure.
create or replace function public.purge_expired_rsvps()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with gone as (
    delete from public.rsvps r
    using public.event_settings s, public.tenants t
    where s.tenant_id = r.tenant_id
      and t.id = r.tenant_id
      and not t.is_sandbox
      and t.slug <> 'demo'
      and s.event_date < (current_date - interval '6 months')::date
    returning r.id
  )
  select count(*) into v_count from gone;
  return coalesce(v_count, 0);
end $$;

revoke all on function public.purge_expired_rsvps() from public;
revoke all on function public.purge_expired_rsvps() from anon, authenticated;
grant execute on function public.purge_expired_rsvps() to service_role;

-- Statisticile de vizite se șterg după 90 de zile. Până acum curățenia rula
-- doar când proprietarul deschidea panoul; o scoatem într-o funcție ca s-o
-- poată chema și cron-ul.
create or replace function public.purge_expired_visits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with gone as (
    delete from public.site_visits
    where at < now() - interval '90 days'
    returning id
  )
  select count(*) into v_count from gone;
  return coalesce(v_count, 0);
end $$;

revoke all on function public.purge_expired_visits() from public;
revoke all on function public.purge_expired_visits() from anon, authenticated;
grant execute on function public.purge_expired_visits() to service_role;
