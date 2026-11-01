-- migration-v2.sql: idempotent, safe to run more than once.
-- Needs the v1 schema (is_admin(), rsvps, rsvp_guests) to exist already.

-- 1. Seating columns ---------------------------------------------------------
alter table rsvps       add column if not exists table_number smallint check (table_number between 1 and 99);
alter table rsvp_guests add column if not exists table_number smallint check (table_number between 1 and 99);

-- 2. Imported invite list ----------------------------------------------------
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  group_name text,
  table_number smallint check (table_number between 1 and 99),
  created_at timestamptz not null default now()
);

-- 3. Expenses ----------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  item_name text not null check (char_length(item_name) between 1 and 120),
  category text not null default 'Other',
  total_cost numeric(12,2) not null default 0 check (total_cost >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  constraint paid_not_above_total check (amount_paid <= total_cost)
);

-- 4. Row level security: admins only -----------------------------------------
alter table guests   enable row level security;
alter table expenses enable row level security;

drop policy if exists "admins manage guests" on guests;
create policy "admins manage guests" on guests for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins manage expenses" on expenses;
create policy "admins manage expenses" on expenses for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins update rsvps" on rsvps;
create policy "admins update rsvps" on rsvps for update to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins update guests" on rsvp_guests;
create policy "admins update guests" on rsvp_guests for update to authenticated
  using (is_admin()) with check (is_admin());

-- 5. One list of everyone who needs a seat -----------------------------------
create or replace view seating_people with (security_invoker = true) as
  select r.id, 'rsvp'::text as kind, r.name, r.table_number
    from rsvps r where r.attending
  union all
  select g.id, 'plus'::text, g.name, g.table_number
    from rsvp_guests g join rsvps r on r.id = g.rsvp_id where r.attending
  union all
  select id, 'guest'::text, full_name, table_number from guests;

-- 6. Seat someone, enforcing the table capacity atomically --------------------
create or replace function assign_table(p_kind text, p_id uuid, p_table smallint, p_cap int default 10)
returns void language plpgsql as $$
declare v_count int;
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  if p_table is not null then
    perform pg_advisory_xact_lock(hashtext('seating'));
    select count(*) into v_count from seating_people
      where table_number = p_table and not (kind = p_kind and id = p_id);
    if v_count >= p_cap then raise exception 'table full'; end if;
  end if;

  if p_kind = 'rsvp' then update rsvps set table_number = p_table where id = p_id;
  elsif p_kind = 'plus' then update rsvp_guests set table_number = p_table where id = p_id;
  elsif p_kind = 'guest' then update guests set table_number = p_table where id = p_id;
  else raise exception 'bad kind'; end if;
  if not found then raise exception 'not found'; end if;
end $$;

-- 7. Add a payment without touching the total ---------------------------------
create or replace function add_payment(p_id uuid, p_amount numeric)
returns expenses language plpgsql as $$
declare r expenses;
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  update expenses set amount_paid = amount_paid + p_amount where id = p_id returning * into r;
  if not found then raise exception 'not found'; end if;
  return r;  -- the paid_not_above_total constraint rejects overpayment
end $$;

-- 8. Bulk import, skipping names already in the list --------------------------
create or replace function import_guests(p_guests jsonb)
returns int language plpgsql as $$
declare n int;
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  if jsonb_array_length(p_guests) > 500 then raise exception 'too many guests'; end if;
  with src as (
    select distinct on (lower(trim(g ->> 'full_name')))
      trim(g ->> 'full_name') as full_name, nullif(trim(g ->> 'group_name'), '') as group_name
    from jsonb_array_elements(p_guests) g
    where char_length(trim(g ->> 'full_name')) between 2 and 120
  ), ins as (
    insert into guests (full_name, group_name)
    select s.full_name, s.group_name from src s
    where not exists (select 1 from guests x where lower(x.full_name) = lower(s.full_name))
    returning 1
  )
  select count(*) into n from ins;
  return n;
end $$;

-- 9. RSVP re-submissions keep each guest's table (replaces the v1 function) ---
create or replace function submit_rsvp(
  p_name text, p_email text, p_attending boolean, p_message text, p_guests jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_old jsonb;
begin
  if jsonb_array_length(p_guests) > 6 then raise exception 'too many guests'; end if;
  insert into rsvps (name, email, attending, message)
  values (p_name, lower(p_email), p_attending, nullif(p_message, ''))
  on conflict (email) do update
    set name = excluded.name, attending = excluded.attending,
        message = excluded.message, created_at = now()
  returning id into v_id;

  select coalesce(jsonb_object_agg(lower(name), table_number), '{}'::jsonb) into v_old
    from rsvp_guests where rsvp_id = v_id and table_number is not null;
  delete from rsvp_guests where rsvp_id = v_id;

  if p_attending then
    insert into rsvp_guests (rsvp_id, name, is_child)
    select v_id, g ->> 'name', coalesce((g ->> 'isChild')::boolean, false)
    from jsonb_array_elements(p_guests) g;
    update rsvp_guests set table_number = (v_old ->> lower(name))::smallint
      where rsvp_id = v_id and (v_old ->> lower(name)) is not null;
  end if;
  return v_id;
end $$;

-- 10. Permissions ------------------------------------------------------------
revoke all on function assign_table(text, uuid, smallint, int) from public;
revoke all on function add_payment(uuid, numeric) from public;
revoke all on function import_guests(jsonb) from public;
grant execute on function assign_table(text, uuid, smallint, int) to authenticated;
grant execute on function add_payment(uuid, numeric) to authenticated;
grant execute on function import_guests(jsonb) to authenticated;
revoke all on function submit_rsvp(text, text, boolean, text, jsonb) from public;
grant execute on function submit_rsvp(text, text, boolean, text, jsonb) to anon, authenticated;
