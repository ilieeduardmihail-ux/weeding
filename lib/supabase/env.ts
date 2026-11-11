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
 * Server-only key used to create auth accounts from the platform panel.
 * Never import this in a client component.
 */
export const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
