-- migration-v14-tenant-scoping.sql
-- Makes every read/write tenant-scoped. Applied together with the code that
-- sends the tenant id, so the admin panel and the public forms stop sharing data
-- between clients. Up to now the tables had tenant_id but the policies and the
-- SQL functions still behaved as if there were a single wedding.

-- 1. Unique keys become per-tenant ------------------------------------------
-- rsvps: the same guest name may reply to two different weddings.
drop index if exists public.rsvps_name_key;
create unique index if not exists rsvps_tenant_name_key
  on public.rsvps (tenant_id, (norm_name(name)));

-- locations: church/venue are per-tenant rows now.
alter table public.locations drop constraint if exists locations_pkey;
alter table public.locations add constraint locations_pkey primary key (tenant_id, key);

-- seating tables: "table 5" exists in every wedding.
alter table public.seating_tables drop constraint if exists seating_tables_pkey;
alter table public.seating_tables add constraint seating_tables_pkey primary key (tenant_id, number);

-- guests: importing the same name into two weddings must not collide.
drop index if exists public.guests_name_key;
create unique index if not exists guests_tenant_name_key
  on public.guests (tenant_id, (lower(btrim(full_name))));

-- 2. Keep a safe default for the rollout ------------------------------------
-- v13 filled tenant_id with the first tenant. We keep that as a fallback so the
-- currently deployed code (which does not send tenant_id yet) keeps working for
-- the few minutes until the new build is live. A follow-up migration drops the
-- default once nothing relies on it.

-- The first tenant, used only as a fallback while the new code rolls out.
create or replace function public.default_tenant_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from tenants order by created_at, id limit 1
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'rsvps', 'rsvp_guests', 'guests', 'expenses', 'expense_payments',
    'locations', 'event_settings', 'seating_tables', 'rsvp_log', 'rate_limits'
  ] loop
    execute format('alter table public.%I alter column tenant_id set default public.default_tenant_id()', t);
  end loop;
end $$;

-- 3. Tenant membership helpers ----------------------------------------------

-- 4. is_admin() now means "admin of at least one wedding" (or the owner) -----
-- The proxy and the boot-time guards keep using it.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenant_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) or exists (
    select 1 from platform_owners
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

-- 5. Tenant-aware SQL functions ---------------------------------------------
-- Every function takes the tenant as its LAST argument with a default, so the
-- admin panel passes it explicitly and any old caller still lands on the first
-- wedding. All admin functions verify the membership themselves.

drop function if exists public.hit_rate_limit(text, text, integer, interval);
create function public.hit_rate_limit(
  p_bucket text, p_key text, p_limit integer, p_window interval, p_tenant uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
declare n int; v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  delete from rate_limits where at < now() - interval '1 day';
  select count(*) into n from rate_limits
   where tenant_id = v_tenant and bucket = p_bucket and key = p_key and at > now() - p_window;
  if n >= p_limit then raise exception 'rate limited'; end if;
  insert into rate_limits (tenant_id, bucket, key) values (v_tenant, p_bucket, p_key);
end $$;

drop function if exists public._submit_rsvp(text, boolean, text, jsonb, text);
create function public._submit_rsvp(
  p_name text, p_attending boolean, p_message text, p_guests jsonb,
  p_ip_hash text default null, p_tenant uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid; v_old jsonb; v_tbl smallint; v_imp smallint; g record; v_gname text;
  v_tenant uuid := coalesce(p_tenant, default_tenant_id());
  v_name text := regexp_replace(btrim(p_name), '\s+', ' ', 'g');
begin
  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'invalid name'; end if;
  perform hit_rate_limit('submit-ip', coalesce(p_ip_hash, 'unknown'), 10, interval '1 hour', v_tenant);
  perform hit_rate_limit('submit-name', norm_name(v_name), 3, interval '1 hour', v_tenant);
  if jsonb_array_length(p_guests) > 6 then raise exception 'too many guests'; end if;

  -- An imported guest with this name becomes this reply and keeps any table already given
  with d as (
    delete from guests
     where tenant_id = v_tenant and norm_name(full_name) = norm_name(v_name)
    returning table_number
  )
  select max(table_number) into v_imp from d;

  insert into rsvps (tenant_id, name, attending, message, table_number)
  values (v_tenant, v_name, p_attending, nullif(p_message, ''), v_imp)
  on conflict (tenant_id, (norm_name(name))) do update
    set name = excluded.name, attending = excluded.attending, message = excluded.message,
        created_at = now(), table_number = coalesce(rsvps.table_number, excluded.table_number)
  returning id into v_id;

  select coalesce(jsonb_object_agg(norm_name(name), table_number), '{}'::jsonb) into v_old
    from rsvp_guests where rsvp_id = v_id and table_number is not null;
  delete from rsvp_guests where rsvp_id = v_id;

  if p_attending then
    for g in select value as j from jsonb_array_elements(p_guests) loop
      v_gname := regexp_replace(btrim(g.j ->> 'name'), '\s+', ' ', 'g');
      continue when char_length(v_gname) < 1;
      v_tbl := (v_old ->> norm_name(v_gname))::smallint;           -- seat from an earlier reply
      if v_tbl is null then                                        -- or from the imported list
        with d as (
          delete from guests
           where tenant_id = v_tenant and norm_name(full_name) = norm_name(v_gname)
          returning table_number
        )
        select max(table_number) into v_tbl from d;
      end if;
      insert into rsvp_guests (tenant_id, rsvp_id, name, is_child, table_number)
      values (v_tenant, v_id, v_gname, coalesce((g.j ->> 'isChild')::boolean, false), v_tbl);
    end loop;
  end if;

  insert into rsvp_log (tenant_id, name, attending, guests, ip_hash)
  values (v_tenant, v_name, p_attending, p_guests, p_ip_hash);
  return v_id;
end $$;

drop function if exists public.submit_rsvp(text, boolean, text, jsonb, text);
create function public.submit_rsvp(
  p_name text, p_attending boolean, p_message text, p_guests jsonb,
  p_ip_hash text default null, p_tenant uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare s event_settings; v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  if not tenant_is_active(v_tenant) then raise exception 'tenant unavailable'; end if;
  select * into s from event_settings where tenant_id = v_tenant;
  if s.rsvp_cutoff_date is not null and (now() at time zone s.timezone)::date > s.rsvp_cutoff_date then
    raise exception 'rsvp closed';
  end if;
  return _submit_rsvp(p_name, p_attending, p_message, p_guests, p_ip_hash, v_tenant);
end $$;

drop function if exists public.check_rsvp_status(text, text);
create function public.check_rsvp_status(
  p_name text, p_ip_hash text default null, p_tenant uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k text := norm_name(p_name); r rsvps; g rsvp_guests; h rsvps;
        v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  perform hit_rate_limit('lookup', coalesce(p_ip_hash, 'unknown'), 15, interval '10 minutes', v_tenant);
  if char_length(k) < 3 then return null; end if;

  select * into r from rsvps where tenant_id = v_tenant and norm_name(name) = k;
  if found then
    return jsonb_build_object(
      'name', r.name, 'attending', r.attending, 'booked_by', null::text,
      'table_number', case when r.attending then r.table_number end,
      'party', case when r.attending then coalesce((
          select jsonb_agg(jsonb_build_object('name', x.name, 'table_number', x.table_number) order by x.name)
          from rsvp_guests x where x.rsvp_id = r.id), '[]'::jsonb) else '[]'::jsonb end);
  end if;

  select x.* into g from rsvp_guests x join rsvps y on y.id = x.rsvp_id
    where y.tenant_id = v_tenant and y.attending and norm_name(x.name) = k limit 1;
  if found then
    select * into h from rsvps where id = g.rsvp_id;
    return jsonb_build_object(
      'name', g.name, 'attending', true, 'booked_by', h.name, 'table_number', g.table_number,
      'party', (select coalesce(jsonb_agg(s.item order by s.item ->> 'name'), '[]'::jsonb) from (
          select jsonb_build_object('name', h.name, 'table_number', h.table_number) as item
          union all
          select jsonb_build_object('name', o.name, 'table_number', o.table_number)
            from rsvp_guests o where o.rsvp_id = h.id and o.id <> g.id) s));
  end if;
  return null;
end $$;

drop function if exists public.admin_update_rsvp(uuid, text, boolean, text, jsonb);
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
      insert into rsvp_guests (tenant_id, rsvp_id, name, is_child, table_number)
      values (v_tenant, p_id, v_gname, coalesce((v_guest.j ->> 'isChild')::boolean, false), v_tbl);
    end loop;
  end if;

  insert into rsvp_log (tenant_id, name, attending, guests, ip_hash)
  values (v_tenant, v_name, p_attending, coalesce(p_guests, '[]'::jsonb), 'admin');
end $$;

drop function if exists public.import_guests(jsonb);
create function public.import_guests(p_guests jsonb, p_tenant uuid default null)
returns integer
language plpgsql security definer set search_path = public as $$
declare n int; v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  if not is_tenant_admin(v_tenant) then raise exception 'not allowed'; end if;
  if jsonb_array_length(p_guests) > 500 then raise exception 'too many guests'; end if;
  with src as (
    select distinct on (lower(trim(g ->> 'full_name')))
      trim(g ->> 'full_name') as full_name, nullif(trim(g ->> 'group_name'), '') as group_name
    from jsonb_array_elements(p_guests) g
    where char_length(trim(g ->> 'full_name')) between 2 and 120
  ), ins as (
    insert into guests (tenant_id, full_name, group_name)
    select v_tenant, s.full_name, s.group_name from src s
    where not exists (
      select 1 from guests x where x.tenant_id = v_tenant and lower(x.full_name) = lower(s.full_name)
    )
    returning 1
  )
  select count(*) into n from ins;
  return n;
end $$;

drop function if exists public.add_payment(uuid, numeric, text);
create function public.add_payment(p_id uuid, p_amount numeric, p_note text default null, p_tenant uuid default null)
returns expenses
language plpgsql security definer set search_path = public as $$
declare r expenses; v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  if not is_tenant_admin(v_tenant) then raise exception 'not allowed'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  update expenses set amount_paid = amount_paid + p_amount
   where id = p_id and tenant_id = v_tenant
  returning * into r;
  if not found then raise exception 'not found'; end if;
  insert into expense_payments (tenant_id, expense_id, amount, note)
  values (v_tenant, p_id, p_amount, nullif(btrim(p_note), ''));
  return r;
end $$;

drop function if exists public.assign_table(text, uuid, smallint);
create function public.assign_table(p_kind text, p_id uuid, p_table smallint, p_tenant uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_count int; v_cap int; v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  if not is_tenant_admin(v_tenant) then raise exception 'not allowed'; end if;

  if p_table is not null then
    select capacity into v_cap from seating_tables where number = p_table and tenant_id = v_tenant;
    if v_cap is null then raise exception 'table missing'; end if;

    perform pg_advisory_xact_lock(hashtext('seating:' || v_tenant::text));
    select count(*) into v_count from seating_people
      where tenant_id = v_tenant and table_number = p_table and not (kind = p_kind and id = p_id);
    if v_count >= v_cap then raise exception 'table full'; end if;
  end if;

  if p_kind = 'rsvp' then update rsvps set table_number = p_table where id = p_id and tenant_id = v_tenant;
  elsif p_kind = 'plus' then update rsvp_guests set table_number = p_table where id = p_id and tenant_id = v_tenant;
  elsif p_kind = 'guest' then update guests set table_number = p_table where id = p_id and tenant_id = v_tenant;
  else raise exception 'bad kind'; end if;
  if not found then raise exception 'not found'; end if;
end $$;

drop function if exists public.unassign_table(text, uuid);
create function public.unassign_table(p_kind text, p_id uuid, p_tenant uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  if not is_tenant_admin(v_tenant) then raise exception 'not allowed'; end if;

  if p_kind = 'rsvp' then update rsvps set table_number = null where id = p_id and tenant_id = v_tenant;
  elsif p_kind = 'plus' then update rsvp_guests set table_number = null where id = p_id and tenant_id = v_tenant;
  elsif p_kind = 'guest' then update guests set table_number = null where id = p_id and tenant_id = v_tenant;
  else raise exception 'bad kind'; end if;
  if not found then raise exception 'not found'; end if;
end $$;

drop function if exists public.add_seating_table(smallint, smallint);
create function public.add_seating_table(
  p_number smallint default null, p_capacity smallint default 10, p_tenant uuid default null
) returns smallint
language plpgsql security definer set search_path = public as $$
declare v_tenant uuid := coalesce(p_tenant, default_tenant_id()); v_number smallint := p_number;
begin
  if not is_tenant_admin(v_tenant) then raise exception 'not allowed'; end if;
  if p_capacity is null or p_capacity < 1 or p_capacity > 30 then raise exception 'bad capacity'; end if;

  if v_number is null then
    select min(n) into v_number
      from generate_series(1, 99) n
     where not exists (select 1 from seating_tables t where t.tenant_id = v_tenant and t.number = n);
    if v_number is null then raise exception 'no numbers left'; end if;
  elsif v_number < 1 or v_number > 99 then
    raise exception 'bad number';
  end if;

  begin
    insert into seating_tables (tenant_id, number, capacity) values (v_tenant, v_number, p_capacity);
  exception when unique_violation then
    raise exception 'table exists';
  end;

  return v_number;
end $$;

drop function if exists public.delete_seating_table(smallint);
create function public.delete_seating_table(p_number smallint, p_tenant uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  if not is_tenant_admin(v_tenant) then raise exception 'not allowed'; end if;
  if not exists (select 1 from seating_tables where number = p_number and tenant_id = v_tenant) then
    raise exception 'table missing';
  end if;

  update rsvps       set table_number = null where tenant_id = v_tenant and table_number = p_number;
  update rsvp_guests set table_number = null where tenant_id = v_tenant and table_number = p_number;
  update guests      set table_number = null where tenant_id = v_tenant and table_number = p_number;

  delete from seating_tables where number = p_number and tenant_id = v_tenant;
end $$;

drop function if exists public.set_table_capacity(smallint, smallint);
create function public.set_table_capacity(p_number smallint, p_capacity smallint, p_tenant uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_used int; v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  if not is_tenant_admin(v_tenant) then raise exception 'not allowed'; end if;
  if p_capacity is null or p_capacity < 1 or p_capacity > 30 then raise exception 'bad capacity'; end if;
  if not exists (select 1 from seating_tables where number = p_number and tenant_id = v_tenant) then
    raise exception 'table missing';
  end if;

  select count(*) into v_used from seating_people where tenant_id = v_tenant and table_number = p_number;
  if v_used > p_capacity then raise exception 'table occupied'; end if;

  update seating_tables set capacity = p_capacity where number = p_number and tenant_id = v_tenant;
end $$;

drop function if exists public.public_seating();
create function public.public_seating(p_tenant uuid default null)
returns jsonb
language sql stable security definer set search_path = public as $$
  select case
    when coalesce((select seating_published from event_settings
                    where tenant_id = coalesce(p_tenant, default_tenant_id())), false) then
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
          where p.tenant_id = t.tenant_id and p.table_number = t.number
        ) x on true
        where t.tenant_id = coalesce(p_tenant, default_tenant_id())
      ), '[]'::jsonb)
    else null
  end
$$;

-- 6. RLS: admins only ever see their own wedding ----------------------------
drop policy if exists "admins manage settings" on public.event_settings;
create policy "admins manage settings" on public.event_settings
  for all to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

drop policy if exists "admins manage locations" on public.locations;
create policy "admins manage locations" on public.locations
  for all to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

drop policy if exists "admins manage expenses" on public.expenses;
create policy "admins manage expenses" on public.expenses
  for all to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

drop policy if exists "admins manage payments" on public.expense_payments;
create policy "admins manage payments" on public.expense_payments
  for all to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

drop policy if exists "admins manage guests" on public.guests;
create policy "admins manage guests" on public.guests
  for all to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

drop policy if exists "admins manage rsvps" on public.rsvps;
create policy "admins manage rsvps" on public.rsvps
  for all to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

drop policy if exists "admins manage rsvp_guests" on public.rsvp_guests;
create policy "admins manage rsvp_guests" on public.rsvp_guests
  for all to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

drop policy if exists "admins read rsvp_log" on public.rsvp_log;
create policy "admins read rsvp_log" on public.rsvp_log
  for select to authenticated using (is_tenant_admin(tenant_id));

drop policy if exists "admins manage seating tables" on public.seating_tables;
create policy "admins manage seating tables" on public.seating_tables
  for all to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

-- The views expose tenant_id and must obey the caller's policies, not the owner's.
alter view public.seating_people set (security_invoker = on);
alter view public.venue_report set (security_invoker = on);

-- 7. Privileges -------------------------------------------------------------
grant execute on function public.default_tenant_id() to anon, authenticated;
grant execute on function public.submit_rsvp(text, boolean, text, jsonb, text, uuid) to anon, authenticated;
grant execute on function public.check_rsvp_status(text, text, uuid) to anon, authenticated;
grant execute on function public.public_seating(uuid) to anon, authenticated;
grant execute on function public.admin_update_rsvp(uuid, text, boolean, text, jsonb, uuid) to authenticated;
grant execute on function public.import_guests(jsonb, uuid) to authenticated;
grant execute on function public.add_payment(uuid, numeric, text, uuid) to authenticated;
grant execute on function public.assign_table(text, uuid, smallint, uuid) to authenticated;
grant execute on function public.unassign_table(text, uuid, uuid) to authenticated;
grant execute on function public.add_seating_table(smallint, smallint, uuid) to authenticated;
grant execute on function public.delete_seating_table(smallint, uuid) to authenticated;
grant execute on function public.set_table_capacity(smallint, smallint, uuid) to authenticated;
