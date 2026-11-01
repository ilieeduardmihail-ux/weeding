/**
 * DEMO MODE — only active when NEXT_PUBLIC_SUPABASE_URL is empty.
 * Used for local previews without a real Supabase project.
 * Delete the lib/demo folder (and the two `demoMode` branches in
 * lib/supabase/server.ts and proxy.ts) to go back to the real backend.
 */

import { SUPABASE_URL } from "@/lib/supabase/env";

export const demoMode = !SUPABASE_URL;

export const DEMO_COOKIE = "wedding_demo_admin";
export const DEMO_EMAIL = "ana@demo.local";
export const DEMO_PASSWORD = "demo";
