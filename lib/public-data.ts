/**
 * Read-only data for the public pages. Uses the anon key without cookies, so the
 * public site never depends on a visitor session and can be cached per request.
 */
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { demoMode } from "./demo/mode";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";
import { normalizeSettings, type EventSettings } from "./event-settings";

export type SeatingTable = { table: number; names: string[] };

function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getEventSettings = cache(async (): Promise<EventSettings> => {
  if (demoMode) {
    const store = await import("./demo/store");
    return store.getEventSettings();
  }
  try {
    const { data } = await anonClient().from("event_settings").select("*").eq("id", 1).maybeSingle();
    return normalizeSettings(data as Record<string, unknown> | null);
  } catch {
    return normalizeSettings(null);
  }
});

/** null = the couple has not published the seating plan yet. */
export const getPublicSeating = cache(async (): Promise<SeatingTable[] | null> => {
  if (demoMode) {
    const store = await import("./demo/store");
    return store.publicSeating();
  }
  try {
    const { data } = await anonClient().rpc("public_seating");
    return Array.isArray(data) ? (data as SeatingTable[]) : null;
  } catch {
    return null;
  }
});
