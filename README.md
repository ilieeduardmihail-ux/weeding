# Wedding site

Romanian wedding invitation built with **Next.js 16** (App Router, Turbopack), **Tailwind v4** and **Supabase**. Guests confirm by name; the couple manages everything from an admin area.

## Features

- Public page in Romanian: plum/gold design, animated hero, countdown, schedule with editable locations, public seating board and RSVP by name.
- Presentation page at the root: screenshots of the invitation and the panel, themes, steps and contact (the only indexable page).
- RSVP form with plus-ones, children, optional message, honeypot and server-side rate limiting.
- Admin area: guest list, **edit any RSVP** (name, attendance, message, plus-ones, keeping assigned seats), seating board, venue report, budget, CSV/XLSX import and settings.
- Editable event settings: names, date, time, city, timezone, RSVP cutoff, contact email and seating publication.
- All-day **`.ics` calendar download** at `/<slug>/calendar`.
- Sticky **„Invitat”** button on mobile.
- Privacy note at `/confidentialitate` for the platform, plus one per wedding at `/<slug>/confidentialitate`.
- **Vercel Analytics** (cookieless) in production.
- Vitest tests for countdown, RSVP schemas, demo RSVP flow, event settings, locations and calendar.

## Local quick start (demo mode, no Supabase)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Admin: http://localhost:3000/admin — any email plus the password **`demo`**.

Without `NEXT_PUBLIC_SUPABASE_URL`, the app runs in **demo mode**: everything works, but data lives in the Node process (`lib/demo/`), so it resets when the server restarts. Demo mode is for preview only — never deploy it.

## Production setup with Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the migrations in this order:
   - `supabase/schema.sql`
   - `supabase/migration-v2.sql`
   - `supabase/migration-v3-roles.sql`
   - `supabase/migration-v4-names.sql`
   - `supabase/migration-v5-features.sql`
   - `supabase/migration-v6-locations-ro.sql` *(optional one-time cleanup of the demo location rows)*
   - `supabase/migration-v7-admin-edit-contact.sql` *(required for admin RSVP editing and the contact email)*
   - `supabase/migration-v8-tables-currency.sql` *(required for dynamic tables)*
   - `supabase/migration-v9-expense-currency-realtime.sql` *(required for per-expense RON/EUR, unassigning guests and live admin updates)*

   Details and troubleshooting: [`supabase/README.md`](supabase/README.md).
3. **Authentication → Users**: create one user per partner and confirm the email manually. Turn off public sign-ups.
4. Register the admin emails:
   ```sql
   insert into admins (email) values ('you@example.com') on conflict do nothing;
   ```
5. Copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   RATE_LIMIT_SALT=<long random string>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   # Optional: the platform panel sends invoices from this Gmail account.
   GMAIL_USER=<adresa>@gmail.com
   GMAIL_APP_PASSWORD=<16 caractere, parolă de aplicație>
   ```
   Older projects can use the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of the publishable key.
   The app password is generated at **Google Account → Security → App passwords** and needs 2-Step Verification; the account password never goes in an environment variable.
6. Restart `npm run dev` and sign in at `/admin`.

The `publishable`/`anon` key is public by design. Never put `sb_secret_...` or a `service_role` key in the site.

## Deploy on Vercel (free)

1. Install/log in with the Vercel CLI:
   ```bash
   npx vercel login
   ```
2. From the project folder, link or create the project and set the name to **`wedding-ro`**:
   ```bash
   npx vercel link
   ```
   This project is deployed at **https://wedding-ro.vercel.app**. If you pick another name, Vercel assigns a different free subdomain — update `NEXT_PUBLIC_SITE_URL` and the Supabase URLs to match.
3. Add the environment variables in **Vercel → Project → Settings → Environment Variables** (Production and Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `RATE_LIMIT_SALT`
   - `NEXT_PUBLIC_SITE_URL=https://wedding-ro.vercel.app`
   - `GMAIL_USER` and `GMAIL_APP_PASSWORD` (optional; without them the invoice page only offers the PDF download and the copy button)
4. Deploy:
   ```bash
   npx vercel --prod
   ```
5. In **Vercel → Project → Analytics**, press **Enable**. The code already sends events; Vercel only starts recording after this switch.
6. In **Supabase → Authentication → URL Configuration** set:
   - **Site URL**: `https://wedding-ro.vercel.app`
   - **Redirect URLs**: `https://wedding-ro.vercel.app/**` and `http://localhost:3000/**`
7. Open the production URL, sign in at `/admin`, edit a test RSVP and confirm the public page updates.

The domain `wedding-ro.vercel.app` is attached to the project, so it follows every new production deployment automatically. Redeploy with `npx vercel --prod --yes` after changing code or environment variables.

## Routes

| Route | What it does |
|---|---|
| `/` | Presentation page: what the guest sees, what the panel does, themes, steps, price on request, FAQ, contact by email |
| `/<slug>` | Public invitation of one wedding: hero + countdown, schedule, seating (when published), RSVP lookup/form |
| `/demo` | Fictional demo wedding (Daria & Radu) used by the screenshots and linked from the presentation page |
| `/calendar` | Permanent redirect to the first wedding's `/<slug>/calendar` (legacy link) |
| `/invitatia-poza` | Permanent redirect to the first wedding's `/<slug>/invitatia-poza` (legacy link) |
| `/<slug>/calendar` | Downloads an all-day `.ics` event for the wedding date |
| `/confidentialitate` | Platform-level privacy note; each wedding has its own at `/<slug>/confidentialitate` |
| `/<slug>/admin` | Guest list, stats, edit/delete RSVP, CSV export |
| `/<slug>/admin/rsvps/[id]/edit` | Edit one RSVP and its plus-ones, preserving assigned seats |
| `/<slug>/admin/seating` | Drag guests onto tables, add/remove tables, edit each capacity, unassign with one click |
| `/<slug>/admin/report` | Headcount, adults, children, grouped by table |
| `/<slug>/admin/budget` | Expenses with their own RON/EUR currency, payments, remaining budget per currency |
| `/<slug>/admin/import` | Bulk import guests from CSV/XLSX |
| `/<slug>/admin/locations` | Edit the church and reception venue |
| `/<slug>/admin/settings` | Names, date, time, city, timezone, contact email, RSVP cutoff, publish seating |

Old invitation links of the form `/?nume=...` are redirected by the proxy to `/<first-slug>?nume=...`, so links already shared on WhatsApp keep working.

Only `/` is indexable. Every wedding, panel and file response carries `X-Robots-Tag: noindex` and `robots.txt` allows exactly the homepage; `sitemap.xml` lists it alone.

The public landing screen shows only the hero. The rest of the site is mounted and unlocked after **Deschide Invitația** is pressed; the landing is unmounted and replaced by the invitation, with no scrolling in between.

## Where the content lives

- **Names, date, time, city, timezone, contact email, RSVP cutoff, seating publication** — `event_settings` table, edited from `/admin/settings`.
- **Locations** — `locations` table, edited from `/admin/locations`.
- **Tables and seats per table** — `seating_tables` table, edited from `/admin/seating`.
- **Expense currency** — stored per row in `expenses.currency`.
- **Expense categories** — `lib/admin-config.ts` (code).
- **Schedule structure and fallback locations** — `lib/config.ts` (code).

## Demo wedding and screenshots

`npm run seed-demo` rebuilds the fictional `/demo` wedding (Daria & Radu, Brașov 2027) from `scripts/seed-demo.mjs`; add `-- --reset` to delete and recreate it from scratch. It needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, a local-only key that bypasses RLS.

`npm run capture-previews` captures the real product with headless Chrome and writes AVIF/WebP files into `public/previews/`: the invitation (desktop and phone), the RSVP screen, and five panel sections. Re-run it after a UI change so the presentation page never shows an old design. It reads `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` from `.env.local` and takes an optional base URL: `npm run capture-previews -- http://localhost:3000`.

## Verify before deploying

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Notes

- `supabase/migration-v7-admin-edit-contact.sql` adds `event_settings.contact_email` and the atomic `admin_update_rsvp` function. Admin editing fails with a clear message until this migration is run.
- `supabase/migration-v8-tables-currency.sql` adds the `seating_tables` table and the dynamic table functions.
- `supabase/migration-v9-expense-currency-realtime.sql` adds `expenses.currency`, `unassign_table` and publishes `rsvps` / `rsvp_guests` for Realtime. The admin list refreshes instantly; a 15 s polling fallback covers projects where Realtime is not enabled.
- The public site reads settings per request, so changes saved in `/admin` appear without a redeploy.
- RSVP rate limiting hashes the client IP with `RATE_LIMIT_SALT`; it never stores the raw IP.
- Invoice emails are sent from the platform panel through Gmail SMTP with the note attached as a PDF (`/platform/facturi/[id]/pdf`, owner only). `GMAIL_APP_PASSWORD` stays in the environment; with `GMAIL_USER` unset the panel falls back to the PDF download and the copy button. The recipient address is typed per send and never stored.
