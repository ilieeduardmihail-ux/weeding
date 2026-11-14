-- migration-v24-photo-florals.sql
-- The painted "Acuarela" set and the drawn vector decorations are gone; only the
-- photographed sets remain. normalizeTheme() already falls back to the new
-- default ("photo-bujori") when it meets an unknown id, but this brings the
-- stored rows in line so the admin panel shows what is actually saved.

update public.tenants
   set theme = jsonb_set(
         coalesce(theme, '{}'::jsonb),
         '{floral,set}',
         '"photo-bujori"'::jsonb,
         true
       ),
       updated_at = now()
 where coalesce(theme #>> '{floral,set}', '') not in
       ('photo-bujori', 'photo-trandafiri', 'photo-botanic', 'photo-piersica', 'photo-delicata');
