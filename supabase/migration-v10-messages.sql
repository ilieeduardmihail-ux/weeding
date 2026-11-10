-- migration-v10-messages.sql: idempotent.
-- Run AFTER migration-v9-expense-currency-realtime.sql.
--
-- 1. Guests can store a phone number for the WhatsApp invitation messages.
-- 2. The invitation message is editable from /admin/messages.

-- 1. Phone numbers -----------------------------------------------------------
alter table rsvps  add column if not exists phone text;
alter table guests add column if not exists phone text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'rsvps_phone_length'
       and conrelid = 'rsvps'::regclass
  ) then
    alter table rsvps add constraint rsvps_phone_length
      check (phone is null or char_length(phone) <= 40);
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'guests_phone_length'
       and conrelid = 'guests'::regclass
  ) then
    alter table guests add constraint guests_phone_length
      check (phone is null or char_length(phone) <= 40);
  end if;
end $$;

-- 2. Editable invitation message ---------------------------------------------
alter table event_settings add column if not exists invite_message text;

update event_settings
   set invite_message = 'Bună, {nume}! Cu mare drag te invităm la nunta noastră, pe {data}. Toate detaliile și confirmarea prezenței sunt aici: {link}'
 where id = 1
   and (invite_message is null or btrim(invite_message) = '');
