/**
 * Read-only data for the public pages. Uses the anon key without cookies, so the
 * public site never depends on a visitor session and can be cached per request.
 */
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { demoMode } from "./demo/mode";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";
import { normalizeSettings, type EventSettings } from "./event-settings";
import { FALLBACK_LOCATIONS, type WeddingLocation } from "./config";
import { cleanLocation } from "./location-text";

export type SeatingTable = { table: number; capacity: number; names: string[] };

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

/** The church and the reception venue, edited from /admin/locations. */
export const getLocations = cache(async (): Promise<WeddingLocation[]> => {
  if (demoMode) {
    const store = await import("./demo/store");
    return store.listLocations();
  }
  try {
    const { data } = await anonClient()
      .from("locations")
      .select("key, label, name, address, event_time, embed_url")
      .order("key", { ascending: true });
    return Array.isArray(data) && data.length > 0
      ? (data as WeddingLocation[]).map(cleanLocation)
      : FALLBACK_LOCATIONS;
  } catch {
    return FALLBACK_LOCATIONS;
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
    if (!Array.isArray(data)) return null;
    return (data as Record<string, unknown>[]).map((row) => ({
      table: Number(row.table),
      capacity: Number(row.capacity ?? 10),
      names: Array.isArray(row.names) ? (row.names as string[]) : [],
    }));
  } catch {
    return null;
  }
});
