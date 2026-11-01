-- migration-v3-roles.sql: idempotent. Run AFTER schema.sql and migration-v2.sql.
-- Result: the public can only call two functions (submit a reply, check a reply).
-- Everything else is readable and writable only by emails listed in `admins`.

-- 1. Admin list and check ---------------------------------------------------
create table if not exists admins (email text primary key);
alter table admins enable row level security;  -- no policies: only is_admin() reads it

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email'))
$$;
-- Add the couple (replace the emails, they must match the Auth users exactly):
-- insert into admins values ('you@example.com'), ('partner@example.com') on conflict do nothing;

-- 2. Locations (editable from the admin area, readable by everyone) -----------
create table if not exists locations (
  key text primary key check (key in ('church', 'venue')),
  label text not null,
  name text not null,
  address text not null,
  event_time text not null,
  embed_url text check (embed_url is null or embed_url ~ '^https://www\.google\.com/maps'),
  updated_at timestamptz not null default now()
);
insert into locations (key, label, name, address, event_time) values
  ('church', 'Church (Biserică)', 'Biserica Sfântul Nicolae', 'Strada Exemplu 12, București', '16:00'),
  ('venue',  'Venue (Local)',     'Restaurant Grădina Verde', 'Șoseaua Exemplu 45, București', '19:30')
on conflict (key) do nothing;

-- 3. Row level security: admins get full CRUD, guests get nothing -------------
alter table rsvps       enable row level security;
alter table rsvp_guests enable row level security;
alter table guests      enable row level security;
alter table expenses    enable row level security;
alter table locations   enable row level security;

drop policy if exists "admins read rsvps" on rsvps;
drop policy if exists "admins delete rsvps" on rsvps;
drop policy if exists "admins update rsvps" on rsvps;
drop policy if exists "admins manage rsvps" on rsvps;
create policy "admins manage rsvps" on rsvps for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins read guests" on rsvp_guests;
drop policy if exists "admins update guests" on rsvp_guests;
drop policy if exists "admins manage rsvp_guests" on rsvp_guests;
create policy "admins manage rsvp_guests" on rsvp_guests for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins manage guests" on guests;
create policy "admins manage guests" on guests for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins manage expenses" on expenses;
create policy "admins manage expenses" on expenses for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "public read locations" on locations;
drop policy if exists "admins update locations" on locations;
drop policy if exists "admins manage locations" on locations;
create policy "public read locations" on locations for select to anon, authenticated using (true);
create policy "admins manage locations" on locations for all to authenticated
  using (is_admin()) with check (is_admin());

-- Belt and braces: the anonymous role gets no table access except locations
revoke all on rsvps, rsvp_guests, guests, expenses, admins from anon;
revoke all on seating_people from anon;
grant select on locations to anon;

-- 4. Rate limiting (used only from inside the functions below) -----------------
create table if not exists rate_limits (
  bucket text not null, key text not null, at timestamptz not null default now()
);
create index if not exists rate_limits_lookup on rate_limits (bucket, key, at desc);
alter table rate_limits enable row level security;  -- no policies
revoke all on rate_limits from anon, authenticated;

create or replace function hit_rate_limit(p_bucket text, p_key text, p_limit int, p_window interval)
returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from rate_limits where at < now() - interval '1 day';
  select count(*) into n from rate_limits where bucket = p_bucket and key = p_key and at > now() - p_window;
  if n >= p_limit then raise exception 'rate limited'; end if;
  insert into rate_limits (bucket, key) values (p_bucket, p_key);
end $$;
revoke all on function hit_rate_limit(text, text, int, interval) from public;

-- 5. Guest check: returns only the caller's own reply ---------------------------
create or replace function check_rsvp_status(p_email text, p_ip_hash text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r rsvps;
begin
  perform hit_rate_limit('lookup', coalesce(p_ip_hash, 'unknown'), 15, interval '10 minutes');
  select * into r from rsvps where email = lower(trim(p_email));
  if not found then return null; end if;
  return jsonb_build_object(
    'name', r.name,
    'attending', r.attending,
    'table_number', case when r.attending then r.table_number end,
    'party', case when r.attending then coalesce((
      select jsonb_agg(jsonb_build_object('name', g.name, 'table_number', g.table_number) order by g.name)
      from rsvp_guests g where g.rsvp_id = r.id), '[]'::jsonb) else '[]'::jsonb end
  );
end $$;
revoke all on function check_rsvp_status(text, text) from public;
grant execute on function check_rsvp_status(text, text) to anon, authenticated;

-- 6. Submit a reply: now rate limited, still keeps seat assignments ------------
drop function if exists submit_rsvp(text, text, boolean, text, jsonb);
create or replace function submit_rsvp(
  p_name text, p_email text, p_attending boolean, p_message text, p_guests jsonb, p_ip_hash text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_old jsonb;
begin
  perform hit_rate_limit('submit-ip', coalesce(p_ip_hash, 'unknown'), 10, interval '1 hour');
  perform hit_rate_limit('submit-email', lower(trim(p_email)), 3, interval '1 hour');
  if jsonb_array_length(p_guests) > 6 then raise exception 'too many guests'; end if;

  insert into rsvps (name, email, attending, message)
  values (p_name, lower(trim(p_email)), p_attending, nullif(p_message, ''))
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
revoke all on function submit_rsvp(text, text, boolean, text, jsonb, text) from public;
grant execute on function submit_rsvp(text, text, boolean, text, jsonb, text) to anon, authenticated;
