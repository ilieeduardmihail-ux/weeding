/**
 * DEMO MODE — only active when NEXT_PUBLIC_SUPABASE_URL is empty.
 * Used for local previews without a real Supabase project.
 * Delete the lib/demo folder (and the two `demoMode` branches in
 * lib/supabase/server.ts and proxy.ts) to go back to the real backend.
 */
export const demoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.trim() === "";

export const DEMO_COOKIE = "wedding_demo_admin";
export const DEMO_EMAIL = "ana@demo.local";
export const DEMO_PASSWORD = "demo";
