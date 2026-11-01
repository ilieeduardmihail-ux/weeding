-- Run in Supabase SQL editor — ONCE, on a fresh project.
-- This file is not idempotent: if you see `42P07 relation "rsvps" already exists`,
-- the schema is already applied. Skip to migration-v2.sql.
create table rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 200),
  attending boolean not null,
  message text check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);
create unique index rsvps_email_key on rsvps (email);

create table rsvp_guests (
  id uuid primary key default gen_random_uuid(),
  rsvp_id uuid not null references rsvps(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  is_child boolean not null default false
);

create table admins (email text primary key);
-- After creating your admin users in Auth, add them:
-- insert into admins values ('you@example.com'), ('partner@example.com');

alter table rsvps enable row level security;
alter table rsvp_guests enable row level security;
alter table admins enable row level security;

create function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where email = auth.jwt() ->> 'email')
$$;

create policy "admins read rsvps"   on rsvps       for select to authenticated using (is_admin());
create policy "admins delete rsvps" on rsvps       for delete to authenticated using (is_admin());
create policy "admins read guests"  on rsvp_guests for select to authenticated using (is_admin());

-- Public submissions go through this function only (no direct table access for anon).
-- Submitting again with the same email updates the earlier reply.
create function submit_rsvp(
  p_name text, p_email text, p_attending boolean, p_message text, p_guests jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if jsonb_array_length(p_guests) > 6 then raise exception 'too many guests'; end if;
  insert into rsvps (name, email, attending, message)
  values (p_name, lower(p_email), p_attending, nullif(p_message, ''))
  on conflict (email) do update
    set name = excluded.name, attending = excluded.attending,
        message = excluded.message, created_at = now()
  returning id into v_id;

  delete from rsvp_guests where rsvp_id = v_id;
  if p_attending then
    insert into rsvp_guests (rsvp_id, name, is_child)
    select v_id, g ->> 'name', coalesce((g ->> 'isChild')::boolean, false)
    from jsonb_array_elements(p_guests) g;
  end if;
  return v_id;
end $$;

revoke all on function submit_rsvp from public;
grant execute on function submit_rsvp to anon, authenticated;
