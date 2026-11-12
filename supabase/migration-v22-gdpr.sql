-- migration-v22-gdpr.sql
-- Faza 11 (GDPR). Confirmarea de prezență se salvează doar cu dovada
-- consimțământului: momentul în care invitatul a bifat acordul și versiunea
-- politicii de confidențialitate pe care a citit-o.
--
-- Funcțiile de trimitere a răspunsului primesc două argumente noi la final, cu
-- valori implicite. Semnătura veche (6 argumente) este ștearsă, ca un apel
-- vechi să nu poată ocoli consimțământul.

alter table public.rsvps add column if not exists consent_at timestamptz;
alter table public.rsvps add column if not exists policy_version text;

drop function if exists public._submit_rsvp(text, boolean, text, jsonb, text, uuid);
drop function if exists public.submit_rsvp(text, boolean, text, jsonb, text, uuid);

create function public._submit_rsvp(
  p_name text, p_attending boolean, p_message text, p_guests jsonb,
  p_ip_hash text default null, p_tenant uuid default null,
  p_consent_at timestamptz default null, p_policy_version text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid; v_old jsonb; v_tbl smallint; v_imp smallint; g record; v_gname text;
  v_tenant uuid := coalesce(p_tenant, default_tenant_id());
  v_name text := regexp_replace(btrim(p_name), '\s+', ' ', 'g');
begin
  if p_consent_at is null then raise exception 'consent required'; end if;
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

  insert into rsvps (tenant_id, name, attending, message, table_number, consent_at, policy_version)
  values (v_tenant, v_name, p_attending, nullif(p_message, ''), v_imp, p_consent_at, p_policy_version)
  on conflict (tenant_id, (norm_name(name))) do update
    set name = excluded.name, attending = excluded.attending, message = excluded.message,
        created_at = now(), table_number = coalesce(rsvps.table_number, excluded.table_number),
        consent_at = excluded.consent_at, policy_version = excluded.policy_version
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

create function public.submit_rsvp(
  p_name text, p_attending boolean, p_message text, p_guests jsonb,
  p_ip_hash text default null, p_tenant uuid default null,
  p_consent_at timestamptz default null, p_policy_version text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare s event_settings; v_tenant uuid := coalesce(p_tenant, default_tenant_id());
begin
  if not tenant_is_active(v_tenant) then raise exception 'tenant unavailable'; end if;
  select * into s from event_settings where tenant_id = v_tenant;
  if s.rsvp_cutoff_date is not null and (now() at time zone s.timezone)::date > s.rsvp_cutoff_date then
    raise exception 'rsvp closed';
  end if;
  return _submit_rsvp(p_name, p_attending, p_message, p_guests, p_ip_hash, v_tenant, p_consent_at, p_policy_version);
end $$;

-- Funcțiile sunt recreate, deci privilegiile implicite (PUBLIC) revin: le închidem
-- la loc și dăm acces doar celor care trimit răspunsul.
revoke all on function public._submit_rsvp(text, boolean, text, jsonb, text, uuid, timestamptz, text) from public, anon, authenticated;
revoke all on function public.submit_rsvp(text, boolean, text, jsonb, text, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public._submit_rsvp(text, boolean, text, jsonb, text, uuid, timestamptz, text) to service_role;
grant execute on function public.submit_rsvp(text, boolean, text, jsonb, text, uuid, timestamptz, text) to anon, authenticated, service_role;
