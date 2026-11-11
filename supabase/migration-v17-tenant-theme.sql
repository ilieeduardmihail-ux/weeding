-- migration-v17-tenant-theme.sql
-- Each wedding admin may repaint their own public site. Granting UPDATE on the
-- whole tenants row would also expose the slug, the status and the expiry date,
-- so the write goes through a security-definer function that checks membership
-- and touches the `theme` column only.

create or replace function public.set_tenant_theme(p_tenant uuid, p_theme jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tenant_admin(p_tenant) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.tenants
     set theme = coalesce(p_theme, '{}'::jsonb),
         updated_at = now()
   where id = p_tenant;
end;
$$;

revoke all on function public.set_tenant_theme(uuid, jsonb) from public, anon;
grant execute on function public.set_tenant_theme(uuid, jsonb) to authenticated;
