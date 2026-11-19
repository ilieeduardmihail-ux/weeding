-- migration-v33-leads.sql
-- Conturi demo: un vizitator își face cont, primește un cod pe email, iar după
-- ce îl confirmă primește propria copie a nunții demo (un „sandbox"), în care
-- poate lucra fără să atingă demonstrația publică sau datele altcuiva.
--
-- Trei lucruri noi, toate izolate:
--   1. `leads` — cine a cerut acces, cu acordul GDPR și codul de verificare.
--   2. `tenants.is_sandbox` — copiile demo nu sunt niciodată publice.
--   3. funcțiile de clonare și de curățare, apelate doar cu cheia de service.
--
-- Totul este aditiv: nu modifică niciun rând existent în afară de marcajul
-- `is_sandbox` (implicit false) și politicile de citire publică.

-- 1. Sandbox-urile nu au pagină publică --------------------------------------
alter table public.tenants add column if not exists is_sandbox boolean not null default false;

comment on column public.tenants.is_sandbox is
  'Copie demo creată pentru un vizitator. Fără pagină publică, se șterge automat după 7 zile.';

-- `tenant_is_active` este folosită de politicile de citire publică și de
-- `submit_rsvp`. Un sandbox nu are voie să apară în niciuna dintre ele.
create or replace function public.tenant_is_active(p_tenant uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenants
    where id = p_tenant
      and status = 'active'
      and not is_sandbox
      and (expires_at is null or expires_at > now())
  )
$$;

drop policy if exists "public read active tenants" on public.tenants;
create policy "public read active tenants" on public.tenants
  for select to anon
  using (status = 'active' and not is_sandbox and (expires_at is null or expires_at > now()));

-- 2. Lead-urile --------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  name text,
  source text not null default 'demo-panou',
  -- Dovada acordului: când a fost bifat și ce versiune de politică a văzut.
  consent_at timestamptz not null,
  policy_version text not null,
  verified_at timestamptz,
  last_seen_at timestamptz,
  sandbox_tenant_id uuid references public.tenants(id) on delete set null,
  note text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  -- Codul de 6 cifre: doar hash-ul, ca un acces la bază să nu dezvăluie coduri.
  code_hash text,
  -- 'signup' sau 'reset': un cod trimis pentru înscriere nu poate fi folosit
  -- ca să schimbi parola altui cont.
  code_purpose text check (code_purpose in ('signup', 'reset')),
  code_expires_at timestamptz,
  code_attempts integer not null default 0,
  code_sent_at timestamptz
);

create unique index if not exists leads_email_key on public.leads (lower(email));
create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_sandbox_idx on public.leads (sandbox_tenant_id);

-- Doar cheia de service citește și scrie: tabelul nu are politici RLS.
alter table public.leads enable row level security;
grant all on public.leads to service_role;

-- 3. Clonarea nunții demo ----------------------------------------------------
-- Copiază conținutul demo într-o nuntă nouă, marcată `is_sandbox`, valabilă 7
-- zile, și îi dă vizitatorului acces la panou prin `tenant_admins`.
-- Id-urile care se referă la alte rânduri (cheltuieli → plăți, RSVP → însoțitori)
-- sunt remapate, ca legăturile să rămână corecte.
create or replace function public.clone_demo_sandbox(p_demo_slug text, p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_demo public.tenants;
  v_new uuid;
  v_slug text;
  v_exp uuid;
  v_rsvp uuid;
  r record;
begin
  select * into v_demo from public.tenants where slug = lower(btrim(p_demo_slug)) limit 1;
  if v_demo.id is null then
    raise exception 'demo tenant missing';
  end if;

  loop
    v_slug := 'demo-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    exit when not exists (select 1 from public.tenants where slug = v_slug);
  end loop;

  insert into public.tenants
    (slug, display_name, status, plan, activated_at, expires_at, theme, is_sandbox)
  values
    (v_slug, v_demo.display_name, 'active', v_demo.plan, now(), now() + interval '7 days', v_demo.theme, true)
  returning id into v_new;

  -- Setările: publicarea este oprită din start. Un sandbox nu are adresă publică.
  insert into public.event_settings (
    tenant_id, partner_1, partner_2, event_date, event_time, city, timezone,
    rsvp_cutoff_date, seating_published, public_url, contact_email, budget_currency,
    invite_message, invitation_image_url, locations_intro
  )
  select
    v_new, partner_1, partner_2, event_date, event_time, city, timezone,
    rsvp_cutoff_date, false, null, contact_email, budget_currency,
    invite_message, invitation_image_url, locations_intro
  from public.event_settings
  where tenant_id = v_demo.id;

  insert into public.locations (tenant_id, key, label, name, address, event_time, embed_url)
  select v_new, key, label, name, address, event_time, embed_url
  from public.locations
  where tenant_id = v_demo.id;

  insert into public.seating_tables (tenant_id, number, capacity)
  select v_new, number, capacity
  from public.seating_tables
  where tenant_id = v_demo.id;

  insert into public.guests (tenant_id, full_name, group_name, table_number, is_child, phone, allergies)
  select v_new, full_name, group_name, table_number, is_child, phone, allergies
  from public.guests
  where tenant_id = v_demo.id;

  for r in select * from public.expenses where tenant_id = v_demo.id loop
    insert into public.expenses
      (tenant_id, item_name, category, total_cost, amount_paid, notes, currency, due_before, due_after)
    values
      (v_new, r.item_name, r.category, r.total_cost, r.amount_paid, r.notes, r.currency, r.due_before, r.due_after)
    returning id into v_exp;

    insert into public.expense_payments (tenant_id, expense_id, amount, note, paid_at)
    select v_new, v_exp, amount, note, paid_at
    from public.expense_payments
    where expense_id = r.id;
  end loop;

  for r in select * from public.rsvps where tenant_id = v_demo.id loop
    insert into public.rsvps
      (tenant_id, name, email, attending, message, created_at, table_number, phone, consent_at, policy_version, allergies)
    values
      (v_new, r.name, r.email, r.attending, r.message, r.created_at, r.table_number, r.phone, r.consent_at, r.policy_version, r.allergies)
    returning id into v_rsvp;

    insert into public.rsvp_guests (tenant_id, rsvp_id, name, is_child, table_number, allergies)
    select v_new, v_rsvp, name, is_child, table_number, allergies
    from public.rsvp_guests
    where rsvp_id = r.id;
  end loop;

  insert into public.tenant_admins (tenant_id, email)
  values (v_new, lower(btrim(p_email)))
  on conflict do nothing;

  return v_new;
end $$;

revoke all on function public.clone_demo_sandbox(text, text) from public;
revoke all on function public.clone_demo_sandbox(text, text) from anon, authenticated;
grant execute on function public.clone_demo_sandbox(text, text) to service_role;

-- 4. Curățarea ---------------------------------------------------------------
-- Rulează oportunist (la înscriere și când proprietarul deschide „Lead-uri"),
-- ca să nu fie nevoie de un cron și de un secret în plus.
create or replace function public.purge_expired_sandboxes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with gone as (
    delete from public.tenants
    where is_sandbox and (expires_at is null or expires_at <= now())
    returning id
  )
  select count(*) into v_count from gone;
  return coalesce(v_count, 0);
end $$;

revoke all on function public.purge_expired_sandboxes() from public;
revoke all on function public.purge_expired_sandboxes() from anon, authenticated;
grant execute on function public.purge_expired_sandboxes() to service_role;

-- 5. „Am avut cont demo" -----------------------------------------------------
-- După ce sandbox-ul expiră, contul rămâne fără nicio nuntă. Funcția îi spune
-- aplicației că omul e un lead, ca să-l trimită la pagina de ofertă, nu la
-- invitația publică (unde ar părea delogat).
create or replace function public.is_lead()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from leads
    where verified_at is not null
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

revoke all on function public.is_lead() from public, anon;
grant execute on function public.is_lead() to authenticated;

-- 6. Jurnalul de emailuri ----------------------------------------------------
alter table public.mail_log drop constraint if exists mail_log_kind_check;
alter table public.mail_log add constraint mail_log_kind_check
  check (kind in ('oferta', 'factura', 'cheie', 'raspuns', 'lead', 'cod'));
