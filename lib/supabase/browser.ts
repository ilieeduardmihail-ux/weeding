import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

export const hasSupabaseBrowser = Boolean(SUPABASE_URL && SUPABASE_KEY);

/**
 * Browser client for realtime subscriptions. It reads the admin session from
 * the same cookies the server client writes, so Realtime applies the RLS rules
 * of the signed-in admin instead of the anonymous role.
 */
export function createBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
