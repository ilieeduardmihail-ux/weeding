/**
 * Everything the platform owner panel shows, in one round of queries.
 * Server only: it reads across every client, so it runs after an owner check
 * and through the service-role client (RLS would hide other tenants' rows).
 */
import { serviceClient } from "@/lib/platform";
import type { PlatformAdmin, PlatformKey, PlatformTenant, PlatformOverview } from "@/lib/platform-types";

export type { PlatformAdmin, PlatformKey, PlatformTenant, PlatformOverview } from "@/lib/platform-types";

export async function loadPlatformOverview(): Promise<PlatformOverview> {
  const service = serviceClient();

  const [tenantsResult, adminsResult, keysResult, ownersResult] = await Promise.all([
    service
      .from("tenants")
      .select("id, slug, display_name, status, created_at, activated_at, expires_at")
      .order("created_at", { ascending: true }),
    service.from("tenant_admins").select("tenant_id, email").order("email", { ascending: true }),
    service
      .from("access_keys")
      .select("id, tenant_id, label, duration_days, created_at, used_at, used_by_email, revoked_at")
      .order("created_at", { ascending: false }),
    service.from("platform_owners").select("email").order("email", { ascending: true }),
  ]);

  const adminsByTenant = new Map<string, PlatformAdmin[]>();
  for (const row of (adminsResult.data ?? []) as { tenant_id: string; email: string }[]) {
    const list = adminsByTenant.get(row.tenant_id) ?? [];
    list.push({ email: row.email });
    adminsByTenant.set(row.tenant_id, list);
  }

  const keysByTenant = new Map<string, PlatformKey[]>();
  for (const row of (keysResult.data ?? []) as Record<string, unknown>[]) {
    const tenantId = String(row.tenant_id);
    const list = keysByTenant.get(tenantId) ?? [];
    list.push({
      id: String(row.id),
      label: typeof row.label === "string" ? row.label : null,
      durationDays: Number(row.duration_days),
      createdAt: String(row.created_at),
      usedAt: typeof row.used_at === "string" ? row.used_at : null,
      usedByEmail: typeof row.used_by_email === "string" ? row.used_by_email : null,
      revokedAt: typeof row.revoked_at === "string" ? row.revoked_at : null,
    });
    keysByTenant.set(tenantId, list);
  }

  const tenants: PlatformTenant[] = ((tenantsResult.data ?? []) as Record<string, unknown>[]).map(
    (row) => ({
      id: String(row.id),
      slug: String(row.slug),
      displayName: String(row.display_name),
      status: String(row.status),
      createdAt: String(row.created_at),
      activatedAt: typeof row.activated_at === "string" ? row.activated_at : null,
      expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
      admins: adminsByTenant.get(String(row.id)) ?? [],
      keys: keysByTenant.get(String(row.id)) ?? [],
    })
  );

  return {
    tenants,
    owners: ((ownersResult.data ?? []) as { email: string }[]).map((row) => row.email),
  };
}
