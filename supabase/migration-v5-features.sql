-- migration-v5-features.sql: idempotent. Run AFTER schema.sql and migration v2, v3 and v4.
-- (v2 already provides the bulk import `import_guests`, `assign_table` with the 10-seat cap, and `expenses`.)

-- 1. Event settings: names, date, city, RSVP cutoff, seating board switch, public URL --------
create table if not exists event_settings (
  id int primary key default 1 check (id = 1),               -- a single row
  -- The couple edits these from /admin/settings after running the migration.
  partner_1 text not null default 'Ana',
  partner_2 text not null default 'Marco',
  event_date date not null default '2027-06-12',
  event_time time not null default '16:00',
  city text not null default 'Lisbon',
  timezone text not null default 'Europe/Lisbon',
  rsvp_cutoff_date date,                                     -- null = RSVP never locks
  seating_published boolean not null default false,
  public_url text check (public_url is null or public_url ~ '^https://'),
  updated_at timestamptz not null default now()
);
insert into event_settings (id) values (1) on conflict do nothing;
alter table event_settings enable row level security;
drop policy if exists "public read settings" on event_settings;
drop policy if exists "admins manage settings" on event_settings;
create policy "public read settings" on event_settings for select to anon, authenticated using (true);
create policy "admins manage settings" on event_settings for all to authenticated
  using (is_admin()) with check (is_admin());

-- 2. RSVP auto-lock enforced in the database (so it can't be bypassed from the browser) -------
do $$ begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'submit_rsvp')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = '_submit_rsvp') then
    alter function public.submit_rsvp(text, boolean, text, jsonb, text) rename to _submit_rsvp;
  end if;
end $$;
revoke all on function _submit_rsvp(text, boolean, text, jsonb, text) from public, anon, authenticated;

create or replace function submit_rsvp(
  p_name text, p_attending boolean, p_message text, p_guests jsonb, p_ip_hash text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare s event_settings;
begin
  select * into s from event_settings where id = 1;
  if s.rsvp_cutoff_date is not null and (now() at time zone s.timezone)::date > s.rsvp_cutoff_date then
    raise exception 'rsvp closed';
  end if;
  return _submit_rsvp(p_name, p_attending, p_message, p_guests, p_ip_hash);
end $$;
revoke all on function submit_rsvp(text, boolean, text, jsonb, text) from public;
grant execute on function submit_rsvp(text, boolean, text, jsonb, text) to anon, authenticated;

-- 3. Public seating board: names and table numbers only, and only when you publish it -------------
create or replace function public_seating() returns jsonb
language sql security definer stable set search_path = public as $$
  select case
    when coalesce((select seating_published from event_settings where id = 1), false) then
      coalesce((select jsonb_agg(jsonb_build_object('table', x.t, 'names', x.names) order by x.t)
                from (select table_number as t, jsonb_agg(name order by name) as names
                      from seating_people where table_number is not null
                      group by table_number) x), '[]'::jsonb)
    else null                                                  -- null = "not published yet"
  end
$$;
revoke all on function public_seating() from public;
grant execute on function public_seating() to anon, authenticated;

-- 4. Venue report (admin only): who is an adult or a child, and where they sit -----------------
alter table guests add column if not exists is_child boolean not null default false;

create or replace view venue_report with (security_invoker = true) as
  select 'rsvp'::text as kind, r.name, false as is_child, r.table_number, true as counted
    from rsvps r where r.attending
  union all
  select 'plus', g.name, g.is_child, g.table_number, true
    from rsvp_guests g join rsvps r on r.id = g.rsvp_id where r.attending
  union all
  select 'guest', gu.full_name, gu.is_child, gu.table_number, gu.table_number is not null
    from guests gu;
revoke all on venue_report from anon;
-- Totals for the report header:
--   select count(*) filter (where counted)                      as headcount,
--          count(*) filter (where counted and not is_child)     as adults,
--          count(*) filter (where counted and is_child)         as children
--   from venue_report;

-- 5. Budget: every payment is recorded; total_cost is never touched -----------------------------
create table if not exists expense_payments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text check (char_length(note) <= 200),
  paid_at timestamptz not null default now()
);
alter table expense_payments enable row level security;
drop policy if exists "admins manage payments" on expense_payments;
create policy "admins manage payments" on expense_payments for all to authenticated
  using (is_admin()) with check (is_admin());

drop function if exists add_payment(uuid, numeric);
create or replace function add_payment(p_id uuid, p_amount numeric, p_note text default null)
returns expenses language plpgsql as $$
declare r expenses;
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  update expenses set amount_paid = amount_paid + p_amount where id = p_id returning * into r;
  if not found then raise exception 'not found'; end if;          -- the paid_not_above_total check rejects overpayment
  insert into expense_payments (expense_id, amount, note) values (p_id, p_amount, nullif(btrim(p_note), ''));
  return r;
end $$;
revoke all on function add_payment(uuid, numeric, text) from public;
grant execute on function add_payment(uuid, numeric, text) to authenticated;
-- Budget header numbers:
--   select sum(total_cost) as total_budget, sum(amount_paid) as total_paid,
--          sum(total_cost - amount_paid) as remaining from expenses;
