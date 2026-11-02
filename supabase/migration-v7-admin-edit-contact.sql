-- migration-v7-admin-edit-contact.sql: idempotent. Run after migration-v6.
-- Adds the public contact email and an atomic admin edit for an RSVP.

-- 1. Contact email shown on the privacy page (editable in /admin/settings) -----
alter table event_settings add column if not exists contact_email text;
update event_settings
set contact_email = 'ilieeduardmihail@gmail.com'
where id = 1 and (contact_email is null or btrim(contact_email) = '');

-- 2. Admin edit of an RSVP: updates the reply and its party in one transaction --
--    Seats are kept for guests that already existed (matched by id).
create or replace function admin_update_rsvp(
  p_id uuid,
  p_name text,
  p_attending boolean,
  p_message text,
  p_guests jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_name text := regexp_replace(btrim(p_name), '\s+', ' ', 'g');
  v_seats jsonb;
  v_guest record;
  v_gname text;
  v_gid uuid;
  v_tbl smallint;
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'invalid name'; end if;
  if jsonb_array_length(coalesce(p_guests, '[]'::jsonb)) > 6 then raise exception 'too many guests'; end if;
  if not exists (select 1 from rsvps where id = p_id) then raise exception 'not found'; end if;

  select coalesce(jsonb_object_agg(id::text, table_number), '{}'::jsonb)
    into v_seats
    from rsvp_guests
   where rsvp_id = p_id and table_number is not null;

  update rsvps
     set name = v_name,
         attending = p_attending,
         message = nullif(p_message, '')
   where id = p_id;

  delete from rsvp_guests where rsvp_id = p_id;

  if p_attending then
    for v_guest in select value as j from jsonb_array_elements(coalesce(p_guests, '[]'::jsonb)) loop
      v_gname := regexp_replace(btrim(v_guest.j ->> 'name'), '\s+', ' ', 'g');
      continue when char_length(v_gname) < 1;
      v_gid := nullif(v_guest.j ->> 'id', '')::uuid;
      v_tbl := null;
      if v_gid is not null then
        v_tbl := (v_seats ->> v_gid::text)::smallint;
      end if;
      insert into rsvp_guests (rsvp_id, name, is_child, table_number)
      values (p_id, v_gname, coalesce((v_guest.j ->> 'isChild')::boolean, false), v_tbl);
    end loop;
  end if;

  insert into rsvp_log (name, attending, guests, ip_hash)
  values (v_name, p_attending, coalesce(p_guests, '[]'::jsonb), 'admin');
end $$;

revoke all on function admin_update_rsvp(uuid, text, boolean, text, jsonb) from public, anon;
grant execute on function admin_update_rsvp(uuid, text, boolean, text, jsonb) to authenticated;
