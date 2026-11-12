import { cache } from "react";
import { getEventSettings, getLocations } from "./public-data";
import { getTenantBySlug, tenantIsAvailable, type Tenant } from "./tenants";
import { signTenantToken } from "./tenant-token";
import type { EventSettings } from "./event-settings";
import type { WeddingLocation } from "./config";

export type PublicPage = {
  tenant: Tenant;
  settings: EventSettings;
  locations: WeddingLocation[];
  /** Proof that the RSVP actions may write to this wedding; see lib/tenant-token. */
  token: string;
};

/**
 * Everything a public wedding page needs, loaded once per request and shared by
 * `generateMetadata` and the page itself.
 */
export const loadPublicPage = cache(async (slug: string): Promise<PublicPage | null> => {
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !tenantIsAvailable(tenant)) return null;

  const [settings, locations] = await Promise.all([
    getEventSettings(tenant.id),
    getLocations(tenant.id),
  ]);

  return { tenant, settings, locations, token: signTenantToken(tenant.id) };
});
