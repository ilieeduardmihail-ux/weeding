/**
 * Shapes shared by the platform panel (client) and its data loader (server).
 * Kept free of server-only imports so the dashboard can use them in the browser.
 */

export type PlatformAdmin = { email: string };

export type PlatformKey = {
  id: string;
  label: string | null;
  durationDays: number;
  createdAt: string;
  usedAt: string | null;
  usedByEmail: string | null;
  revokedAt: string | null;
};

export type PlatformTenant = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  admins: PlatformAdmin[];
  keys: PlatformKey[];
};

export type PlatformOverview = {
  tenants: PlatformTenant[];
  owners: string[];
};

export type TenantHealth = {
  tone: "active" | "pending" | "expired" | "suspended";
  label: string;
};

/** Health of a client, derived once so the list and the badges agree. */
export function tenantHealth(tenant: PlatformTenant, now = Date.now()): TenantHealth {
  if (tenant.status === "suspended") return { tone: "suspended", label: "Suspendat" };
  if (tenant.status === "pending") return { tone: "pending", label: "Neactivat" };
  if (tenant.expiresAt && new Date(tenant.expiresAt).getTime() <= now)
    return { tone: "expired", label: "Expirat" };
  return { tone: "active", label: "Activ" };
}
