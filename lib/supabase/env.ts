/**
 * Supabase credentials, read once.
 *
 * New projects hand out a *publishable* key (`sb_publishable_...`); older ones
 * have an *anon* JWT. Both are public by design and both work the same way, so
 * accept either name and let the publishable key win.
 */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();

export const SUPABASE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
).trim();

/**
 * The service-role key lives in `./service-env`, which imports `server-only`:
 * that file cannot be pulled into a client bundle by mistake. Everything here
 * is safe to ship to the browser.
 */
