# Wedding site

Next.js 16 (App Router, Turbopack) + Tailwind v4 + Supabase. Public wedding page with RSVP by name, and an admin area for the couple: guest list, seating, venue report, budget, guest import and settings.

## Quick start (no Supabase needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. The admin area is at http://localhost:3000/admin — sign in with **any email** and the password **`demo`**.

Without `NEXT_PUBLIC_SUPABASE_URL`, the app runs in **demo mode**: everything works, but the data lives in the Node process (`lib/demo/`), so it resets when the dev server restarts. Demo mode is for local preview only — never deploy it.

## Real Supabase

1. Create a Supabase project.
2. Run the migrations **in this order**, from `supabase/` (details in `supabase/README.md`):
   `schema.sql` → `migration-v2.sql` → `migration-v3-roles.sql` → `migration-v4-names.sql` → `migration-v5-features.sql`
3. Authentication → Users: add one user per partner (Auto Confirm User), then:
   ```sql
   insert into admins (email) values ('you@example.com'), ('partner@example.com');
   ```
4. Copy `.env.example` to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   RATE_LIMIT_SALT=<long random string>
   ```
5. Restart `npm run dev` and sign in at `/admin` with one of those emails.

## Pages

| Route | What it does |
|---|---|
| `/` | Public page: hero + countdown, schedule, FAQ, RSVP lookup/form, public seating (once published) |
| `/admin` | Guest list, stats, CSV export, sign out |
| `/admin/seating` | Drag guests onto tables (capacity limit) |
| `/admin/report` | Venue report: headcount, adults, children, grouped by table |
| `/admin/budget` | Expenses, payments, remaining budget |
| `/admin/import` | Bulk import guests from CSV/XLSX |
| `/admin/settings` | Names, date, time, city, timezone, RSVP cutoff, publish seating |

## Where the content lives

- **Names, date, time, city, timezone, RSVP cutoff, seating publication** — `event_settings` table, edited from `/admin/settings`.
- **Schedule, map, FAQ** — `lib/config.ts` (code).
- **Tables, seats per table, currency** — `lib/admin-config.ts` (code).

## Verify before deploying

```bash
npx tsc --noEmit
npm run lint
npm run build
```
