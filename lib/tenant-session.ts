/**
 * Who is signed in, and for which wedding. The admin panel lives under
 * /<slug>/admin, so the URL decides which wedding is being managed: membership
 * is read from `tenant_admins` (RLS only exposes the caller's own rows), so the
 * slug lookup doubles as the authorization check.
 */
import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { demoMode } from "@/lib/demo/mode";
import { normalizePlan, tenantIsAvailable, type TenantPlan } from "@/lib/tenants";

export type ContextTenant = {
  id: string;
  slug: string;
  display_name: string;
  status: string;
  plan: TenantPlan;
  expires_at: string | null;
};

type BaseContext = {
  email: string | null;
  needsPassword: boolean;
  isOwner: boolean;
  /** Every wedding this account may manage, oldest first. */
  tenants: ContextTenant[];
  /**
   * The weddings where this account is listed in `tenant_admins`. The owner may
   * reach every wedding, but only these are "his" — the panel says so when the
   * access comes from owning the platform instead of a membership.
   */
  memberTenantIds: string[];
};

export type TenantContext = BaseContext & {
  /** The wedding selected by the current admin URL, if the caller may manage it. */
  tenant: ContextTenant | null;
  /** True when the panel is open as platform owner, without a membership. */
  viaOwner: boolean;
};

/**
 * Session and memberships, read once per request. Selecting the wedding is the
 * caller's job: `getTenantContextForSlug` for the panel, `getTenantContext` for
 * anything that only knows the current path.
 */
const loadBaseContext = cache(async (): Promise<BaseContext> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (!user) {
    return { email: null, needsPassword: false, isOwner: false, tenants: [], memberTenantIds: [] };
  }

  const [membershipsResult, ownerResult] = await Promise.all([
    supabase.from("tenant_admins").select("tenant_id, email").order("tenant_id", { ascending: true }),
    supabase.rpc("is_platform_owner"),
  ]);

  const email = (user.email ?? "").toLowerCase();
  const rows = (membershipsResult?.data ?? []) as { tenant_id: string; email?: string }[];
  // RLS narrows a normal admin to their own rows. The owner sees every row, so
  // the address has to be compared here to know which weddings are really his.
  const mine = rows.filter((row) => !row.email || row.email.toLowerCase() === email);

  const tenantIds = [...new Set(rows.map((row) => String(row.tenant_id)))];
  const memberTenantIds = [...new Set(mine.map((row) => String(row.tenant_id)))];

  let tenants: ContextTenant[] = [];
  if (tenantIds.length > 0) {
    const { data: rows } = await supabase
      .from("tenants")
      .select("id, slug, display_name, status, plan, expires_at, created_at")
      .in("id", tenantIds)
      .order("created_at", { ascending: true });
    tenants = ((rows ?? []) as (Omit<ContextTenant, "plan"> & { plan?: unknown })[]).map((row) => ({
      ...row,
      plan: normalizePlan(row.plan),
    }));
  }

  return {
    email: user.email ?? null,
    needsPassword: user.user_metadata?.must_change_password === true,
    isOwner: ownerResult?.data === true,
    tenants,
    memberTenantIds,
  };
});

const SLUG_IN_PATH = /^\/([^/]+)\/admin(?:\/|$)/;

/**
 * The wedding whose panel is open, taken from the request itself. The middleware
 * stamps `x-wedding-slug` on every admin request so server actions (which have
 * no URL of their own) resolve the same tenant as the page they were called
 * from. The referer is a safety net when the header is missing.
 */
export async function currentAdminSlug(): Promise<string | null> {
  const store = await headers();

  const stamped = store.get("x-wedding-slug");
  if (stamped) return stamped;

  const referer = store.get("referer");
  if (!referer) return null;
  try {
    const match = new URL(referer).pathname.match(SLUG_IN_PATH);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/** The signed-in account and every wedding it may manage. */
export async function getBaseTenantContext(): Promise<BaseContext> {
  return loadBaseContext();
}

/** The wedding named by the admin URL, or null when the caller is not a member. */
export async function getTenantContextForSlug(slug: string): Promise<TenantContext> {
  const base = await loadBaseContext();
  const clean = slug?.trim().toLowerCase();
  const tenant = clean ? base.tenants.find((row) => row.slug === clean) ?? null : null;
  return { ...base, tenant, viaOwner: Boolean(tenant && !base.memberTenantIds.includes(tenant.id)) };
}

/** The wedding for the current admin request; a bare `/admin` falls back to the first. */
export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const base = await loadBaseContext();
  const slug = await currentAdminSlug();
  const tenant = (slug && base.tenants.find((row) => row.slug === slug)) || base.tenants[0] || null;
  return { ...base, tenant, viaOwner: Boolean(tenant && !base.memberTenantIds.includes(tenant.id)) };
});

/** Base URL of the panel the current request belongs to, e.g. "/ana-si-stefan/admin". */
export async function adminBasePath(): Promise<string> {
  const slug = await currentAdminSlug();
  return slug ? `/${slug}/admin` : "/admin";
}

/**
 * The wedding of the current admin request, resolved with ONE query.
 *
 * `tenant_admins` is protected by RLS that only exposes the caller's own rows,
 * so filtering that join by slug is both the lookup and the authorization
 * check. No `auth.getUser()` round trip, no membership list, no owner RPC: the
 * panel bootstrap and every server action start from a single hop.
 *
 * A miss (no row, unexpected relationship, changed policy) is NOT treated as
 * "access denied": it falls through to the full resolver below. So a schema
 * change can only cost speed, never lock an admin out.
 */
export const getAdminTenant = cache(async (): Promise<ContextTenant | null> => {
  const slug = await currentAdminSlug();
  if (!slug) return (await getTenantContext()).tenant;
  if (demoMode) return (await getTenantContextForSlug(slug)).tenant;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_admins")
    .select("tenants!inner(id, slug, display_name, status, plan, expires_at)")
    .eq("tenants.slug", slug)
    .limit(1);

  // A wedding can have several admins, so this is a list even when RLS narrows
  // it to the caller's own row(s).
  const joined =
    (data as { tenants?: ContextTenant | ContextTenant[] | null }[] | null)?.[0]?.tenants ?? null;
  const fast = Array.isArray(joined) ? joined[0] ?? null : joined;

  return fast
    ? { ...fast, plan: normalizePlan((fast as { plan?: unknown }).plan) }
    : (await getTenantContextForSlug(slug)).tenant;
});

/** Convenience for the server actions: the tenant they may write to. An expired
 * or suspended wedding has no writable tenant, so every action fails closed. */
export async function currentTenantId(): Promise<string | null> {
  const tenant = await getAdminTenant();
  if (!tenant || !tenantIsAvailable(tenant)) return null;
  return tenant.id;
}

/** The active package of the wedding being managed, or null without access. */
export async function currentTenantPlan(): Promise<TenantPlan | null> {
  const tenant = await getAdminTenant();
  if (!tenant || !tenantIsAvailable(tenant)) return null;
  return tenant.plan;
}
