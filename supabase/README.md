# Supabase — ordinea migrărilor

Rulează fișierele în **ordinea de mai jos**, fiecare o singură dată:

1. `schema.sql` — tabelele de bază (`rsvps`, `rsvp_guests`, `admins`) + `submit_rsvp` v1.
2. `migration-v2.sql` — mese, `guests`, `expenses`, `seating_people`, `assign_table`, `add_payment`, `import_guests`.
3. `migration-v3-roles.sql` — roluri admin/guest, `locations`, `rate_limits`, `hit_rate_limit`, RLS complet.
4. `migration-v4-names.sql` — RSVP după nume (fără email), `norm_name`, `rsvp_log`, `check_rsvp_status` nou.
5. `migration-v5-features.sql` — `event_settings`, blocare RSVP după cutoff, `public_seating`, `venue_report`, `expense_payments`.
6. `migration-v6-locations-ro.sql` — **opțional**, repară textul demonstrativ din `locations`. Formularul din admin repară oricum textul la salvare.
7. `migration-v7-admin-edit-contact.sql` — **necesar** pentru editarea RSVP din admin și pentru emailul de contact: adaugă `event_settings.contact_email` și funcția atomică `admin_update_rsvp`.
8. `migration-v8-tables-currency.sql` — **necesar** pentru mesele dinamice: adaugă tabelul `seating_tables`, `add_seating_table`, `delete_seating_table`, `set_table_capacity` și rescrie `assign_table` / `public_seating`.
9. `migration-v9-expense-currency-realtime.sql` — **necesar** pentru moneda fiecărei cheltuieli, retragerea unui invitat în „Fără masă” și actualizarea în timp real a listei de invitați: adaugă `expenses.currency`, funcția `unassign_table` și publică `rsvps` / `rsvp_guests` pentru Realtime.

De ce ordinea asta: `migration-v4` folosește `hit_rate_limit()`, care e creată în `migration-v3`, iar `migration-v5` redefinește `submit_rsvp` din `v4`. Dacă sari peste un pas, migrarea următoare pică.

## Ce face `migration-v7`

- Adaugă coloana `contact_email` în `event_settings` și o completează cu `ilieeduardmihail@gmail.com` doar dacă e goală.
- Creează `admin_update_rsvp(p_id, p_name, p_attending, p_message, p_guests)`:
  - verifică `is_admin()`;
  - actualizează răspunsul și însoțitorii într-o singură tranzacție;
  - păstrează masa fiecărui însoțitor existent, după id;
  - șterge însoțitorii când răspunsul devine „nu participă”.

Fără această migrare, butonul **Editează** din `/admin` afișează un mesaj care cere rularea ei.

## Ce face `migration-v8`

- Adaugă `event_settings.budget_currency` (`RON` sau `EUR`, implicit `RON`). Coloana rămâne în schemă, dar din v9 moneda se alege pe fiecare cheltuială.
- Creează `seating_tables (number, capacity)` și o populează cu mesele 1–10, câte 10 locuri — exact ca înainte.
- Rescrie `assign_table(p_kind, p_id, p_table)`: capacitatea se citește din `seating_tables`.
- Adaugă funcțiile de administrare:
  - `add_seating_table(p_number, p_capacity)` — numărul poate fi gol, se alege primul liber;
  - `delete_seating_table(p_number)` — toți invitații mesei revin la „Fără masă”;
  - `set_table_capacity(p_number, p_capacity)` — refuză o capacitate mai mică decât numărul deja așezat.
- Rescrie `public_seating()`: returnează toate mesele cu `capacity` și `names`, doar când `seating_published` este activ.

Fără această migrare, paginile **Buget** și **Mese** afișează erori la salvarea monedei sau la modificarea meselor.

## Ce face `migration-v9`

- Adaugă `expenses.currency` (`RON`/`EUR`, implicit `RON`). Fiecare cheltuială se salvează și se afișează în moneda aleasă la adăugare; totalurile se calculează separat pe monede.
- Creează `unassign_table(p_kind, p_id)`, folosită când un invitat este mutat înapoi în „Fără masă”. Separarea evită trimiterea unui `null` către funcția cu parametru `smallint`.
- Adaugă `rsvps` și `rsvp_guests` la publicația `supabase_realtime`, ca lista din admin să se actualizeze imediat după un RSVP.

Fără această migrare: cheltuielile noi cad pe `RON`, retragerea la „Fără masă” dă eroare, iar lista din admin se actualizează doar prin reîmprospătare (polling-ul de 15 s rămâne activ).

## Dacă apare o eroare

- `42P07 relation "rsvps" already exists` → `schema.sql` a rulat deja. **Nu** îl rula din nou; treci la `migration-v2.sql`.
- `function is_admin() does not exist` → lipsește `schema.sql`. Rulează-l o dată, apoi continuă.
- `function hit_rate_limit(...) does not exist` → ai sărit peste `migration-v3-roles.sql`.
- `function admin_update_rsvp(...) does not exist` → rulează `migration-v7-admin-edit-contact.sql`.
- `column "budget_currency" does not exist` sau `relation "seating_tables" does not exist` → rulează `migration-v8-tables-currency.sql`.
- `function unassign_table(...)` sau `column "currency" does not exist` → rulează `migration-v9-expense-currency-realtime.sql`.
- Migrările v2–v9 sunt idempotente: dacă una a picat la mijloc, o poți rula din nou după ce repari cauza.

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
   NEXT_PUBLIC_SITE_URL=https://wedding-ro.vercel.app
   ```
5. Authentication → URL Configuration:
   - Site URL: `https://wedding-ro.vercel.app`
   - Redirect URLs: `https://wedding-ro.vercel.app/**` și `http://localhost:3000/**`

Cheia `publishable`/`anon` e publică prin design. **Nu** folosi niciodată `sb_secret_...` sau `service_role` în site.

## Modul demo

Dacă `NEXT_PUBLIC_SUPABASE_URL` e gol, aplicația rulează cu date în memorie din `lib/demo/` — util doar local, pentru preview. Nu se salvează nimic și nu se folosește în producție.
