-- migration-v8-tables-currency.sql: idempotent. Run AFTER migration-v7-admin-edit-contact.sql.
-- Adds a budget currency (RON/EUR) and makes the seating tables dynamic
-- (add/remove tables, per-table capacity), keeping every existing seat.

-- 1. Budget currency ---------------------------------------------------------
alter table event_settings add column if not exists budget_currency text not null default 'RON';

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'event_settings_budget_currency_check'
       and conrelid = 'event_settings'::regclass
  ) then
    execute 'alter table event_settings add constraint event_settings_budget_currency_check check (budget_currency in (''RON'', ''EUR''))';
  end if;
end $$;

-- 2. Dynamic seating tables --------------------------------------------------
create table if not exists seating_tables (
  number smallint primary key check (number between 1 and 99),
  capacity smallint not null default 10 check (capacity between 1 and 30),
  created_at timestamptz not null default now()
);

-- Keep the old fixed layout: tables 1..10 with 10 seats each.
insert into seating_tables (number)
select generate_series(1, 10)
on conflict (number) do nothing;

alter table seating_tables enable row level security;

drop policy if exists "admins manage seating tables" on seating_tables;
create policy "admins manage seating tables" on seating_tables for all to authenticated
  using (is_admin()) with check (is_admin());

revoke all on seating_tables from anon;

-- 3. Seat someone: capacity now comes from the table row ---------------------
drop function if exists assign_table(text, uuid, smallint, int);

create or replace function assign_table(p_kind text, p_id uuid, p_table smallint)
returns void language plpgsql security definer set search_path = public as $$
declare v_count int; v_cap int;
begin
  if not is_admin() then raise exception 'not allowed'; end if;

  if p_table is not null then
    select capacity into v_cap from seating_tables where number = p_table;
    if v_cap is null then raise exception 'table missing'; end if;

    perform pg_advisory_xact_lock(hashtext('seating'));
    select count(*) into v_count from seating_people
      where table_number = p_table and not (kind = p_kind and id = p_id);
    if v_count >= v_cap then raise exception 'table full'; end if;
  end if;

  if p_kind = 'rsvp' then update rsvps set table_number = p_table where id = p_id;
  elsif p_kind = 'plus' then update rsvp_guests set table_number = p_table where id = p_id;
  elsif p_kind = 'guest' then update guests set table_number = p_table where id = p_id;
  else raise exception 'bad kind'; end if;
  if not found then raise exception 'not found'; end if;
end $$;

revoke all on function assign_table(text, uuid, smallint) from public;
grant execute on function assign_table(text, uuid, smallint) to authenticated;

-- 4. Add a table (number auto = first free 1..99) ----------------------------
create or replace function add_seating_table(p_number smallint default null, p_capacity smallint default 10)
returns smallint language plpgsql security definer set search_path = public as $$
declare v_number smallint := p_number;
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  if p_capacity is null or p_capacity < 1 or p_capacity > 30 then raise exception 'bad capacity'; end if;

  if v_number is null then
    select min(n) into v_number
      from generate_series(1, 99) n
     where not exists (select 1 from seating_tables t where t.number = n);
    if v_number is null then raise exception 'no numbers left'; end if;
  elsif v_number < 1 or v_number > 99 then
    raise exception 'bad number';
  end if;

  begin
    insert into seating_tables (number, capacity) values (v_number, p_capacity);
  exception when unique_violation then
    raise exception 'table exists';
  end;

  return v_number;
end $$;

revoke all on function add_seating_table(smallint, smallint) from public;
grant execute on function add_seating_table(smallint, smallint) to authenticated;

-- 5. Delete a table: everyone seated there returns to "no table" ------------
create or replace function delete_seating_table(p_number smallint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  if not exists (select 1 from seating_tables where number = p_number) then
    raise exception 'table missing';
  end if;

  update rsvps       set table_number = null where table_number = p_number;
  update rsvp_guests set table_number = null where table_number = p_number;
  update guests      set table_number = null where table_number = p_number;

  delete from seating_tables where number = p_number;
end $$;

revoke all on function delete_seating_table(smallint) from public;
grant execute on function delete_seating_table(smallint) to authenticated;

-- 6. Change a table's capacity (never below the people already seated) ------
create or replace function set_table_capacity(p_number smallint, p_capacity smallint)
returns void language plpgsql security definer set search_path = public as $$
declare v_used int;
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  if p_capacity is null or p_capacity < 1 or p_capacity > 30 then raise exception 'bad capacity'; end if;
  if not exists (select 1 from seating_tables where number = p_number) then
    raise exception 'table missing';
  end if;

  select count(*) into v_used from seating_people where table_number = p_number;
  if v_used > p_capacity then raise exception 'table occupied'; end if;

  update seating_tables set capacity = p_capacity where number = p_number;
end $$;

revoke all on function set_table_capacity(smallint, smallint) from public;
grant execute on function set_table_capacity(smallint, smallint) to authenticated;

-- 7. Public board: all tables, their capacity and the names seated there ----
create or replace function public_seating() returns jsonb
language sql security definer stable set search_path = public as $$
  select case
    when coalesce((select seating_published from event_settings where id = 1), false) then
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'table', t.number,
            'capacity', t.capacity,
            'names', coalesce(x.names, '[]'::jsonb)
          ) order by t.number
        )
        from seating_tables t
        left join lateral (
          select jsonb_agg(p.name order by p.name) as names
          from seating_people p
          where p.table_number = t.number
        ) x on true
      ), '[]'::jsonb)
    else null
  end
$$;

revoke all on function public_seating() from public;
grant execute on function public_seating() to anon, authenticated;
