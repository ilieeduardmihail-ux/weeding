# Supabase — ordinea migrărilor

Rulează fișierele în **ordinea de mai jos**, fiecare o singură dată:

1. `schema.sql` — tabelele de bază (`rsvps`, `rsvp_guests`, `admins`) + `submit_rsvp` v1.
2. `migration-v2.sql` — mese, `guests`, `expenses`, `seating_people`, `assign_table`, `add_payment`, `import_guests`.
3. `migration-v3-roles.sql` — roluri admin/guest, `locations`, `rate_limits`, `hit_rate_limit`, RLS complet.
4. `migration-v4-names.sql` — RSVP după nume (fără email), `norm_name`, `rsvp_log`, `check_rsvp_status` nou.
5. `migration-v5-features.sql` — `event_settings`, blocare RSVP după cutoff, `public_seating`, `venue_report`, `expense_payments`.

De ce ordinea asta: `migration-v4` folosește `hit_rate_limit()`, care e creată în `migration-v3`, iar `migration-v5` redefineste `submit_rsvp` din `v4`. Dacă sari peste un pas, migrarea următoare pică.

## Dacă apare o eroare

- `42P07 relation "rsvps" already exists` → `schema.sql` a rulat deja. **Nu** îl rula din nou; treci la `migration-v2.sql`.
- `function is_admin() does not exist` → lipsește `schema.sql`. Rulează-l o dată, apoi continuă.
- `function hit_rate_limit(...) does not exist` → ai sărit peste `migration-v3-roles.sql`.
- Restul migrărilor (v2–v5) sunt idempotente: dacă una a picat la mijloc, o poți rula din nou după ce repari cauza.

## După migrări

1. Authentication → Users: creează câte un user pentru fiecare mire (Auto Confirm User).
2. Authentication → Sign In / Providers: dezactivează „Allow new users to sign up”.
3. SQL editor:
   ```sql
   insert into admins (email) values ('voi@exemplu.ro') on conflict do nothing;
   ```
4. În `.env.local` (și la hosting):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # sau NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   RATE_LIMIT_SALT=<șir lung, aleator>
   ```

Cheia `publishable`/`anon` e publică prin design. **Nu** folosi niciodată `sb_secret_...` sau `service_role` în site.

## Modul demo

Dacă `NEXT_PUBLIC_SUPABASE_URL` e gol, aplicația rulează cu date în memorie din `lib/demo/` — util doar local, pentru preview. Nu se salvează nimic și nu se folosește în producție.
