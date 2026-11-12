-- migration-v20-hardening.sql
-- Faza 7 (securitate). Trei lucruri:
--   1. `/start` (activarea unei chei de acces) primește propriul rate limit, ca
--      nimeni să nu poată ghici chei în buclă.
--   2. Se închide accesul implicit al rolului PUBLIC la funcțiile din `public`:
--      până acum anon putea apela și funcțiile de admin (erau respinse de
--      verificarea de membru, dar era o plasă în plus de care nu e nevoie).
--   3. Citirea publică a setărilor și locațiilor se limitează la nunțile active,
--      ca datele unei nunți expirate sau suspendate să nu mai fie vizibile.

-- 1. Rate limit pentru activare ----------------------------------------------
-- 20 de încercări pe oră și pe vizitator: suficient pentru greșeli de tastare,
-- insuficient pentru forțarea unei chei (cheile au 20 de caractere).
create or replace function public.hit_activate_rate_limit(
  p_key text,
  p_limit integer default 20,
  p_window interval default interval '1 hour'
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform hit_rate_limit('activate-ip', p_key, p_limit, p_window, default_tenant_id());
end $$;

-- 2. Funcțiile publice: nimeni nu mai moștenește dreptul de execuție ---------
-- Două capcane, ambele întâlnite în practică:
--   * `revoke ... from public` nu elimină grant-ul implicit către PUBLIC, iar
--     grant-urile explicite date mai devreme rolurilor anon/authenticated
--     rămân valabile; de aceea revocăm din toate cele trei.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and p.proname not like 'pg_%'
  loop
    execute format('revoke all on function %s from public', r.sig);
    execute format('revoke all on function %s from anon', r.sig);
    execute format('revoke all on function %s from authenticated', r.sig);
    -- service_role (panoul de platformă) păstrează accesul la toate.
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;

-- Funcțiile publice (anon): doar cele cerute de invitația publică și de RSVP.
grant execute on function public.submit_rsvp(text, boolean, text, jsonb, text, uuid) to anon, authenticated;
grant execute on function public.check_rsvp_status(text, text, uuid) to anon, authenticated;
grant execute on function public.public_seating(uuid) to anon, authenticated;
grant execute on function public.tenant_is_active(uuid) to anon, authenticated;
grant execute on function public.hit_activate_rate_limit(text, integer, interval) to anon, authenticated;

-- Panoul mirilor (authenticated): tot restul.
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_platform_owner() to authenticated;
grant execute on function public.is_tenant_admin(uuid) to authenticated;
grant execute on function public.tenant_id_by_slug(text) to authenticated;
grant execute on function public.admin_update_rsvp(uuid, text, boolean, text, jsonb, uuid) to authenticated;
grant execute on function public.import_guests(jsonb, uuid) to authenticated;
grant execute on function public.add_payment(uuid, numeric, text, uuid) to authenticated;
grant execute on function public.assign_table(text, uuid, smallint, uuid) to authenticated;
grant execute on function public.unassign_table(text, uuid, uuid) to authenticated;
grant execute on function public.add_seating_table(smallint, smallint, uuid) to authenticated;
grant execute on function public.delete_seating_table(smallint, uuid) to authenticated;
grant execute on function public.set_table_capacity(smallint, smallint, uuid) to authenticated;
grant execute on function public.set_tenant_theme(uuid, jsonb) to authenticated;
-- `norm_name` apare în expresia indexului unic de pe `rsvps`; îl lăsăm pe
-- authenticated ca o scriere directă (prin RLS) să nu dea eroare de permisiune.
grant execute on function public.norm_name(text) to authenticated;

-- 3. Citire publică doar pentru nunțile active --------------------------------
-- Politicile vechi foloseau `using (true)`, deci cheia publică putea citi
-- setările și locațiile oricărei nunți, inclusiv expirate. Le legăm acum de
-- starea nunții.
drop policy if exists "public read settings" on public.event_settings;
create policy "public read settings" on public.event_settings
  for select to anon using (tenant_is_active(tenant_id));

drop policy if exists "public read locations" on public.locations;
create policy "public read locations" on public.locations
  for select to anon using (tenant_is_active(tenant_id));
