-- migration-v9-expense-currency-realtime.sql: idempotent.
-- Run AFTER migration-v8-tables-currency.sql.
--
-- 1. Each expense keeps its own currency (RON/EUR); the global toggle is gone.
-- 2. Returning a guest to "Fără masă" has its own function, so a null table
--    argument can never be misread by PostgREST.
-- 3. The admin dashboard receives new RSVPs in real time.

-- 1. Per-expense currency -----------------------------------------------------
alter table expenses add column if not exists currency text not null default 'RON';

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'expenses_currency_check'
       and conrelid = 'expenses'::regclass
  ) then
    execute 'alter table expenses add constraint expenses_currency_check check (currency in (''RON'', ''EUR''))';
  end if;
end $$;

-- 2. Unassign: back to the "Fără masă" pool ----------------------------------
create or replace function unassign_table(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not allowed'; end if;

  if p_kind = 'rsvp' then update rsvps set table_number = null where id = p_id;
  elsif p_kind = 'plus' then update rsvp_guests set table_number = null where id = p_id;
  elsif p_kind = 'guest' then update guests set table_number = null where id = p_id;
  else raise exception 'bad kind'; end if;
  if not found then raise exception 'not found'; end if;
end $$;

revoke all on function unassign_table(text, uuid) from public;
grant execute on function unassign_table(text, uuid) to authenticated;

-- 3. Realtime for the admin guest list ---------------------------------------
-- Postgres Changes only streams tables that are part of the publication.
-- Adding an already-published table raises an error, so check first.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rsvps'
  ) then
    execute 'alter publication supabase_realtime add table public.rsvps';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rsvp_guests'
  ) then
    execute 'alter publication supabase_realtime add table public.rsvp_guests';
  end if;
end $$;
