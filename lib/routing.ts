import { DEFAULT_TENANT_SLUG } from "./default-tenant";

/**
 * Legacy link handling for the marketing era.
 *
 * The root used to be a wedding site, and every invitation shared on WhatsApp
 * pointed at `/?nume=...`. The root is now the presentation page, so those
 * links have to be sent on to the same wedding at `/<slug>?nume=...`.
 */
export function legacyRootPath(pathname: string, hasName: boolean): string | null {
  if (pathname !== "/" || !hasName) return null;
  return `/${DEFAULT_TENANT_SLUG}`;
}
