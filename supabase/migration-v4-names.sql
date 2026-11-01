-- migration-v4-names.sql: idempotent. Run after migration-v3-roles.sql.
-- Guests are now identified by NAME only. No email is collected or required.

-- 1. Name matching that ignores case, extra spaces and diacritics ("Stefan" = "Ștefan")
create or replace function norm_name(t text) returns text
language sql immutable parallel safe as $$
  select regexp_replace(lower(translate(btrim(t), 'ĂÂÎȘȚŞŢăâîșțşţéèêëáàäíóöôőúüűç', 'aaiststaaiststeeeeaaaioooouuuc')), '\s+', ' ', 'g')
$$;

-- 2. Email is no longer required; a reply is identified by its normalized name
alter table rsvps alter column email drop not null;
drop index if exists rsvps_email_key;
create unique index if not exists rsvps_name_key on rsvps (norm_name(name));
-- (optional, once you no longer need old test data:  alter table rsvps drop column email;)

-- 3. Audit log of every submission, readable by admins only. Because anyone can submit
--    under any name, this lets you see who changed what and when.
create table if not exists rsvp_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  name text not null,
  attending boolean not null,
  guests jsonb not null,
  ip_hash text
);
alter table rsvp_log enable row level security;
revoke all on rsvp_log from anon, authenticated;
grant select on rsvp_log to authenticated;
drop policy if exists "admins read rsvp_log" on rsvp_log;
create policy "admins read rsvp_log" on rsvp_log for select to authenticated using (is_admin());

-- 4. Replace the email-based functions (drop first: the old versions must not stay callable)
drop function if exists submit_rsvp(text, text, boolean, text, jsonb);
drop function if exists submit_rsvp(text, text, boolean, text, jsonb, text);
drop function if exists check_rsvp_status(text, text);

-- 5. Submit a reply. Keeps seats, and merges with the imported guest list.
create or replace function submit_rsvp(
  p_name text, p_attending boolean, p_message text, p_guests jsonb, p_ip_hash text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid; v_old jsonb; v_tbl smallint; v_imp smallint; g record; v_gname text;
  v_name text := regexp_replace(btrim(p_name), '\s+', ' ', 'g');
begin
  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'invalid name'; end if;
  perform hit_rate_limit('submit-ip', coalesce(p_ip_hash, 'unknown'), 10, interval '1 hour');
  perform hit_rate_limit('submit-name', norm_name(v_name), 3, interval '1 hour');
  if jsonb_array_length(p_guests) > 6 then raise exception 'too many guests'; end if;

  -- An imported guest with this name becomes this reply and keeps any table already given
  with d as (delete from guests where norm_name(full_name) = norm_name(v_name) returning table_number)
  select max(table_number) into v_imp from d;

  insert into rsvps (name, attending, message, table_number)
  values (v_name, p_attending, nullif(p_message, ''), v_imp)
  on conflict ((norm_name(name))) do update
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
        with d as (delete from guests where norm_name(full_name) = norm_name(v_gname) returning table_number)
        select max(table_number) into v_tbl from d;
      end if;
      insert into rsvp_guests (rsvp_id, name, is_child, table_number)
      values (v_id, v_gname, coalesce((g.j ->> 'isChild')::boolean, false), v_tbl);
    end loop;
  end if;

  insert into rsvp_log (name, attending, guests, ip_hash) values (v_name, p_attending, p_guests, p_ip_hash);
  return v_id;
end $$;

-- 6. Look up a person by name: finds the person who replied, or a plus-one they added
create or replace function check_rsvp_status(p_name text, p_ip_hash text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k text := norm_name(p_name); r rsvps; g rsvp_guests; h rsvps;
begin
  perform hit_rate_limit('lookup', coalesce(p_ip_hash, 'unknown'), 15, interval '10 minutes');
  if char_length(k) < 3 then return null; end if;

  select * into r from rsvps where norm_name(name) = k;
  if found then
    return jsonb_build_object(
      'name', r.name, 'attending', r.attending, 'booked_by', null::text,
      'table_number', case when r.attending then r.table_number end,
      'party', case when r.attending then coalesce((
          select jsonb_agg(jsonb_build_object('name', x.name, 'table_number', x.table_number) order by x.name)
          from rsvp_guests x where x.rsvp_id = r.id), '[]'::jsonb) else '[]'::jsonb end);
  end if;

  select x.* into g from rsvp_guests x join rsvps y on y.id = x.rsvp_id
    where y.attending and norm_name(x.name) = k limit 1;
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

-- 7. Permissions: the public may call only these two functions
revoke all on function submit_rsvp(text, boolean, text, jsonb, text) from public;
revoke all on function check_rsvp_status(text, text) from public;
grant execute on function submit_rsvp(text, boolean, text, jsonb, text) to anon, authenticated;
grant execute on function check_rsvp_status(text, text) to anon, authenticated;
