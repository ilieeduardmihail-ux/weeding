-- migration-v34-lead-cleanup.sql
-- Curățenia conturilor demo, aliniată cu politica de confidențialitate:
--   * după 7 zile dispare copia nunții ȘI contul de autentificare (adresa,
--     parola, sesiunile);
--   * rândul din `leads` rămâne, fără legături, ca proprietarul să poată suna
--     persoana — exact ce promite lista „Lead-uri";
--   * cererile rămase fără contract se șterg după 3 ani, ca în tabelul de
--     retenție.
--
-- Înlocuiește funcția din v33. Totul este idempotent.

create or replace function public.purge_expired_sandboxes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_count integer := 0;
begin
  for r in
    select
      t.id as tenant_id,
      l.user_id,
      l.email
    from public.tenants t
    left join public.leads l on l.sandbox_tenant_id = t.id
    where t.is_sandbox
      and (t.expires_at is null or t.expires_at <= now())
  loop
    -- Copia: cheile străine cu `on delete cascade` duc și setările, invitații,
    -- confirmările, cheltuielile și apartenența la panou.
    delete from public.tenants where id = r.tenant_id;
    v_count := v_count + 1;

    -- Contul de autentificare a existat doar pentru copie. Îl păstrăm dacă
    -- adresa este încă administrator undeva (o nuntă convertită, un cont comun),
    -- ca să nu pierdem accesul cuiva la un client real.
    if r.user_id is not null
       and not exists (
         select 1 from public.tenant_admins a
         where lower(btrim(a.email)) = lower(btrim(coalesce(r.email, '')))
       )
    then
      begin
        -- `leads.user_id` are `on delete set null`, deci rândul de contact
        -- rămâne, doar fără legătura către cont.
        delete from auth.users where id = r.user_id;
      exception when others then
        -- O legătură pe care nu o cunoaștem: copia este deja ștearsă, iar
        -- contul se încearcă din nou la următoarea trecere. Nu blocăm pagina.
        raise warning 'purge_expired_sandboxes: contul % nu a putut fi șters: %',
          r.user_id, sqlerrm;
      end;
    end if;
  end loop;

  -- Persoanele care nu au devenit niciodată cliente: aceeași perioadă de 3 ani
  -- pe care o promite politica pentru cererile fără contract. Rândurile cu o
  -- nuntă reală rămân, ca urmă a convertirii.
  delete from public.leads l
  where l.created_at < now() - interval '3 years'
    and not exists (
      select 1 from public.tenants t
      where t.id = l.sandbox_tenant_id and not t.is_sandbox
    );

  return v_count;
end $$;

revoke all on function public.purge_expired_sandboxes() from public;
revoke all on function public.purge_expired_sandboxes() from anon, authenticated;
grant execute on function public.purge_expired_sandboxes() to service_role;
