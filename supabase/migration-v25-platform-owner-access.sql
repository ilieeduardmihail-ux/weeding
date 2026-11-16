-- v25: proprietarul platformei poate administra orice nuntă.
--
-- Până acum, proprietarul vedea toate rândurile din `tenant_admins` (politica
-- din v15), deci panoul unei nunți se deschidea, dar fiecare politică RLS și
-- fiecare funcție de scriere cerea `is_tenant_admin(tenant_id)`, adică o
-- apartenență reală. Rezultatul: panou gol și `not allowed` la import pentru
-- orice client pe care nu îl administra direct.
--
-- `is_tenant_admin` înseamnă de acum „poate administra nunta asta”: un
-- administrator listat SAU proprietarul platformei. Păstrăm numele funcției ca
-- să nu rescriem politicile și corpul funcțiilor existente.
--
-- `is_admin()` rămâne neschimbat: orice administrator de nuntă sau proprietar.

create or replace function public.is_tenant_admin(p_tenant uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenant_admins
    where tenant_id = p_tenant
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) or exists (
    select 1 from platform_owners
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

grant execute on function public.is_tenant_admin(uuid) to authenticated;
