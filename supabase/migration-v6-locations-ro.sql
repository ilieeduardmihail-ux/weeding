-- v6: repair the demo rows in `locations`.
-- The first seed was pasted with the wrong encoding, so it stored "BisericÄƒ"
-- instead of "Biserică". This resets the two demo rows to clean Romanian text.
-- Run once, in the Supabase SQL Editor, BEFORE editing the locations in /admin.
-- (The admin form also repairs the text on save, so this is just a one-time cleanup.)

update locations
set
  label = U&'Biseric\0103',
  name = U&'Biserica Sf\00E2ntul Nicolae',
  address = U&'Strada Exemplu 12, Bucure\0219ti',
  event_time = '16:00',
  updated_at = now()
where key = 'church';

update locations
set
  label = U&'Local',
  name = U&'Restaurant Gr\0103dina Verde',
  address = U&'\0218oseaua Exemplu 45, Bucure\0219ti',
  event_time = '19:30',
  updated_at = now()
where key = 'venue';

-- Optional: replace the demo names/addresses with the real ones either here or
-- from /admin/locations. Example:
-- update locations set name = U&'Biserica ...', address = U&'...' where key = 'church';
