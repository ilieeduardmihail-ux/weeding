-- migration-v18-drop-tenant-defaults.sql
-- v14 kept `tenant_id default public.default_tenant_id()` on every scoped table so
-- the previous build kept working during the rollout. The application now sends
-- the tenant on every insert (and every function call passes p_tenant), so the
-- fallback is gone. Dropping it means a forgotten tenant_id fails loudly instead
-- of silently writing into the first wedding.

do $$
declare t text;
begin
  foreach t in array array[
    'rsvps', 'rsvp_guests', 'guests', 'expenses', 'expense_payments',
    'locations', 'event_settings', 'seating_tables', 'rsvp_log', 'rate_limits'
  ] loop
    execute format('alter table public.%I alter column tenant_id drop default', t);
  end loop;
end $$;

-- The helper stays for the SQL functions' own `coalesce(..., default_tenant_id())`
-- guard, but it must not be callable straight from a client session.
revoke execute on function public.default_tenant_id() from anon, authenticated;
