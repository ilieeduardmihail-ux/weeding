/**
 * Read-only data for the public pages. Uses the anon key without cookies, so the
 * public site never depends on a visitor session and can be cached per request.
 * Every read is scoped to one tenant: two couples never share settings or venues.
 */
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { demoMode } from "./demo/mode";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";
import { normalizeSettings, type EventSettings } from "./event-settings";
import { FALLBACK_LOCATIONS, type WeddingLocation } from "./config";
import { cleanLocation } from "./location-text";
import { getDefaultTenant } from "./tenants";

function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getEventSettings = cache(async (tenantId: string): Promise<EventSettings> => {
  if (demoMode) {
    const store = await import("./demo/store");
    return store.getEventSettings();
  }
  try {
    const { data } = await anonClient()
      .from("event_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    return normalizeSettings(data as Record<string, unknown> | null);
  } catch {
    return normalizeSettings(null);
  }
});

/** Settings for the wedding served at the root of the domain. */
export const getDefaultEventSettings = cache(async (): Promise<EventSettings> => {
  const tenant = await getDefaultTenant();
  return tenant ? getEventSettings(tenant.id) : normalizeSettings(null);
});

/** The church and the reception venue, edited from /admin/locations. */
export const getLocations = cache(async (tenantId: string): Promise<WeddingLocation[]> => {
  if (demoMode) {
    const store = await import("./demo/store");
    return store.listLocations();
  }
  try {
    const { data } = await anonClient()
      .from("locations")
      .select("key, label, name, address, event_time, embed_url")
      .eq("tenant_id", tenantId)
      .order("key", { ascending: true });
    return Array.isArray(data) && data.length > 0
      ? (data as WeddingLocation[]).map(cleanLocation)
      : FALLBACK_LOCATIONS;
  } catch {
    return FALLBACK_LOCATIONS;
  }
});
