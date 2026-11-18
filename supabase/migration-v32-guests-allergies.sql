-- migration-v32-guests-allergies.sql
-- Copii și preferințe alimentare, persoană cu persoană:
--   * lista importată ține minte cine e copil și ce nu mănâncă;
--   * însoțitorii dintr-un RSVP au propriul câmp de alergii, nu doar familia;
--   * rapoartele (mese / restaurant) primesc numele grupului și telefonul, ca
--     restaurantul să poată suna direct dacă lipsește ceva.
--
-- Totul e aditiv: coloanele noi sunt goale, iar rândurile existente rămân
-- neschimbate. Vizualizările primesc coloanele noi la final, ca `create or
-- replace view` să nu rescrie ordinea pe care o citesc interogările existente.

-- 1. Coloane noi -------------------------------------------------------------
alter table public.guests
  add column if not exists allergies text;

alter table public.rsvp_guests
  add column if not exists allergies text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'guests_allergies_length'
      and conrelid = 'public.guests'::regclass
  ) then
    alter table public.guests
      add constraint guests_allergies_length
      check (allergies is null or char_length(allergies) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'rsvp_guests_allergies_length'
      and conrelid = 'public.rsvp_guests'::regclass
  ) then
    alter table public.rsvp_guests
      add constraint rsvp_guests_allergies_length
      check (allergies is null or char_length(allergies) <= 500);
  end if;
end $$;

comment on column public.guests.allergies is
  'Alergii sau preferințe alimentare pentru un invitat importat (max. 500 caractere).';
comment on column public.rsvp_guests.allergies is
  'Alergii sau preferințe alimentare pentru un însoțitor (max. 500 caractere).';

-- 2. Importul citește și copilul, și alergiile ---------------------------------
-- Fișierul poate avea coloanele `is_child` și `allergies`. Importul nu
-- suprascrie niciodată date bune: marchează drept copil un rând existent doar
-- când fișierul spune „copil”, completează alergiile doar dacă lipseau și la fel
-- pentru grup. Astfel o listă parțială (doar nume) nu șterge nimic.
drop function if exists public.import_guests(jsonb, uuid);
create function public.import_guests(p_guests jsonb, p_tenant uuid default null)
returns integer
language plpgsql security definer set search_path = public as $$
declare n int; v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  if not is_tenant_admin(v_tenant) then raise exception 'not allowed'; end if;
  if jsonb_array_length(p_guests) > 500 then raise exception 'too many guests'; end if;

  with src as (
    select distinct on (lower(trim(g ->> 'full_name')))
      trim(g ->> 'full_name') as full_name,
      nullif(trim(g ->> 'group_name'), '') as group_name,
      lower(coalesce(g ->> 'is_child', '')) in ('true', '1', 'yes', 'da') as is_child,
      left(nullif(trim(g ->> 'allergies'), ''), 500) as allergies,
      left(nullif(trim(g ->> 'phone'), ''), 40) as phone
    from jsonb_array_elements(p_guests) g
    where char_length(trim(g ->> 'full_name')) between 2 and 120
    order by
      lower(trim(g ->> 'full_name')),
      (lower(coalesce(g ->> 'is_child', '')) in ('true', '1', 'yes', 'da')) desc,
      (nullif(trim(g ->> 'allergies'), '') is not null) desc,
      (nullif(trim(g ->> 'group_name'), '') is not null) desc,
      (nullif(trim(g ->> 'phone'), '') is not null) desc
  ), ins as (
    insert into guests (tenant_id, full_name, group_name, is_child, allergies, phone)
    select v_tenant, s.full_name, s.group_name, s.is_child, s.allergies, s.phone
    from src s
    where not exists (
      select 1 from guests x
      where x.tenant_id = v_tenant and lower(x.full_name) = lower(s.full_name)
    )
    returning 1
  ), upd as (
    update guests x
       set is_child = x.is_child or s.is_child,
           allergies = coalesce(x.allergies, s.allergies),
           group_name = coalesce(x.group_name, s.group_name),
           phone = coalesce(x.phone, s.phone)
      from src s
     where x.tenant_id = v_tenant
       and lower(x.full_name) = lower(s.full_name)
       and (
         (s.is_child and not x.is_child)
         or (x.allergies is null and s.allergies is not null)
         or (x.group_name is null and s.group_name is not null)
         or (x.phone is null and s.phone is not null)
       )
    returning 1
  )
  select count(*) into n from ins;
  return n;
end $$;

-- Supabase grants every new function to `anon` as well, so the revoke has to
-- name it; otherwise the public key could call the import directly.
revoke all on function public.import_guests(jsonb, uuid) from public, anon, authenticated;
grant execute on function public.import_guests(jsonb, uuid) to authenticated;

-- 3. Editorul din panou păstrează alergiile fiecărui însoțitor ---------------
-- Semnătura rămâne aceeași, ca aplicația să nu depindă de o versiune nouă.
drop function if exists public.admin_update_rsvp(uuid, text, boolean, text, jsonb, uuid);
create function public.admin_update_rsvp(
  p_id uuid, p_name text, p_attending boolean, p_message text, p_guests jsonb, p_tenant uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid := coalesce(p_tenant, default_tenant_id());
  v_name text := regexp_replace(btrim(p_name), '\s+', ' ', 'g');
  v_seats jsonb; v_guest record; v_gname text; v_gid uuid; v_tbl smallint;
begin
  if not is_tenant_admin(v_tenant) then raise exception 'not allowed'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'invalid name'; end if;
  if jsonb_array_length(coalesce(p_guests, '[]'::jsonb)) > 6 then raise exception 'too many guests'; end if;
  if not exists (select 1 from rsvps where id = p_id and tenant_id = v_tenant) then raise exception 'not found'; end if;

  select coalesce(jsonb_object_agg(id::text, table_number), '{}'::jsonb)
    into v_seats
    from rsvp_guests
   where rsvp_id = p_id and table_number is not null;

  update rsvps
     set name = v_name, attending = p_attending, message = nullif(p_message, '')
   where id = p_id and tenant_id = v_tenant;

  delete from rsvp_guests where rsvp_id = p_id;

  if p_attending then
    for v_guest in select value as j from jsonb_array_elements(coalesce(p_guests, '[]'::jsonb)) loop
      v_gname := regexp_replace(btrim(v_guest.j ->> 'name'), '\s+', ' ', 'g');
      continue when char_length(v_gname) < 1;
      v_gid := nullif(v_guest.j ->> 'id', '')::uuid;
      v_tbl := null;
      if v_gid is not null then v_tbl := (v_seats ->> v_gid::text)::smallint; end if;
      insert into rsvp_guests (tenant_id, rsvp_id, name, is_child, table_number, allergies)
      values (
        v_tenant, p_id, v_gname,
        coalesce((v_guest.j ->> 'isChild')::boolean, false),
        v_tbl,
        left(nullif(trim(v_guest.j ->> 'allergies'), ''), 500)
      );
    end loop;
  end if;

  insert into rsvp_log (tenant_id, name, attending, guests, ip_hash)
  values (v_tenant, v_name, p_attending, coalesce(p_guests, '[]'::jsonb), 'admin');
end $$;

revoke all on function public.admin_update_rsvp(uuid, text, boolean, text, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_update_rsvp(uuid, text, boolean, text, jsonb, uuid) to authenticated;

-- 4. Vizualizările primesc coloanele noi la final ----------------------------
create or replace view public.seating_people as
  select r.id, 'rsvp'::text as kind, r.name, r.table_number, r.tenant_id,
         false as is_child, r.allergies, r.phone, null::text as group_name
    from public.rsvps r
   where r.attending
  union all
  select g.id, 'plus'::text as kind, g.name, g.table_number, g.tenant_id,
         g.is_child, g.allergies, null::text as phone, null::text as group_name
    from public.rsvp_guests g
    join public.rsvps r on r.id = g.rsvp_id
   where r.attending
  union all
  select gu.id, 'guest'::text as kind, gu.full_name as name, gu.table_number, gu.tenant_id,
         gu.is_child, gu.allergies, gu.phone, gu.group_name
    from public.guests gu;

create or replace view public.venue_report as
  select 'rsvp'::text as kind, r.name, false as is_child, r.table_number, true as counted,
         r.tenant_id, r.allergies, r.phone, null::text as group_name
    from public.rsvps r
   where r.attending
  union all
  select 'plus'::text as kind, g.name, g.is_child, g.table_number, true as counted,
         g.tenant_id, g.allergies, null::text as phone, null::text as group_name
    from public.rsvp_guests g
    join public.rsvps r on r.id = g.rsvp_id
   where r.attending
  union all
  select 'guest'::text as kind, gu.full_name as name, gu.is_child, gu.table_number,
         (gu.table_number is not null) as counted, gu.tenant_id,
         gu.allergies, gu.phone, gu.group_name
    from public.guests gu;

-- Vizualizările expun `tenant_id`, deci trebuie să respecte politicile celui
-- care întreabă, nu pe cele ale proprietarului.
alter view public.seating_people set (security_invoker = on);
alter view public.venue_report set (security_invoker = on);
