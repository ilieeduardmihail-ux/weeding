-- migration-v12-locations-intro.sql: idempotent.
-- Run AFTER migration-v11-invitation-photo.sql.
--
-- A free-text note shown above the "Unde ne găsești" heading on the public page.
-- NULL (or an empty string) means "render nothing at all".

alter table event_settings add column if not exists locations_intro text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'event_settings_locations_intro_len'
  ) then
    alter table event_settings
      add constraint event_settings_locations_intro_len
      check (locations_intro is null or char_length(locations_intro) <= 600);
  end if;
end $$;
