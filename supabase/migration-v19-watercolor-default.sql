-- migration-v19-watercolor-default.sql
-- Every wedding shows the painted "Acuarela" floral set. The application default
-- already points there, but a tenant that had picked another set keeps its stored
-- choice, so this brings the existing rows in line while preserving the palette,
-- the colour overrides, the intensity and the placement.

update public.tenants
   set theme = jsonb_set(
         coalesce(theme, '{}'::jsonb),
         '{floral}',
         coalesce(theme -> 'floral', '{}'::jsonb) || '{"set":"watercolor"}'::jsonb,
         true
       ),
       updated_at = now()
 where coalesce(theme #>> '{floral,set}', '') <> 'watercolor';
