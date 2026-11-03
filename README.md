# Wedding site

Romanian wedding invitation built with **Next.js 16** (App Router, Turbopack), **Tailwind v4** and **Supabase**. Guests confirm by name; the couple manages everything from an admin area.

## Features

- Public page in Romanian: plum/gold design, animated hero, countdown, schedule with editable locations, public seating board and RSVP by name.
- RSVP form with plus-ones, children, optional message, honeypot and server-side rate limiting.
- Admin area: guest list, **edit any RSVP** (name, attendance, message, plus-ones, keeping assigned seats), seating board, venue report, budget, CSV/XLSX import and settings.
- Editable event settings: names, date, time, city, timezone, RSVP cutoff, contact email and seating publication.
- All-day **`.ics` calendar download** at `/calendar`.
- Sticky **„Invitat”** button on mobile.
- Privacy page at `/confidentialitate` with a contact email editable from admin.
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
   ```
   Older projects can use the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of the publishable key.
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
| `/` | Public invitation: hero + countdown, schedule, seating (when published), RSVP lookup/form, footer |
| `/calendar` | Downloads an all-day `.ics` event for the wedding date |
| `/confidentialitate` | Privacy note and contact email |
| `/admin` | Guest list, stats, edit/delete RSVP, CSV export |
| `/admin/rsvps/[id]/edit` | Edit one RSVP and its plus-ones, preserving assigned seats |
| `/admin/seating` | Drag guests onto tables (capacity limit) |
| `/admin/report` | Headcount, adults, children, grouped by table |
| `/admin/budget` | Expenses, payments, remaining budget |
| `/admin/import` | Bulk import guests from CSV/XLSX |
| `/admin/locations` | Edit the church and reception venue |
| `/admin/settings` | Names, date, time, city, timezone, contact email, RSVP cutoff, publish seating |

## Where the content lives

- **Names, date, time, city, timezone, contact email, RSVP cutoff, seating publication** — `event_settings` table, edited from `/admin/settings`.
- **Locations** — `locations` table, edited from `/admin/locations`.
- **Tables, seats per table, currency** — `lib/admin-config.ts` (code).
- **Schedule structure and fallback locations** — `lib/config.ts` (code).

## Verify before deploying

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Notes

- `supabase/migration-v7-admin-edit-contact.sql` adds `event_settings.contact_email` and the atomic `admin_update_rsvp` function. Admin editing fails with a clear message until this migration is run.
- The public site reads settings per request, so changes saved in `/admin` appear without a redeploy.
- RSVP rate limiting hashes the client IP with `RATE_LIMIT_SALT`; it never stores the raw IP.
