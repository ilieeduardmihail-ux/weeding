import { cache } from "react";
import { getEventSettings, getLocations } from "./public-data";
import { getTenantBySlug, tenantIsAvailable, type Tenant } from "./tenants";
import type { EventSettings } from "./event-settings";
import type { WeddingLocation } from "./config";

export type PublicPage = {
  tenant: Tenant;
  settings: EventSettings;
  locations: WeddingLocation[];
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

  return { tenant, settings, locations };
});
