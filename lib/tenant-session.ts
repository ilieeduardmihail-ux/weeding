/**
 * Who is signed in, and for which wedding. The admin panel lives under
 * /<slug>/admin, so the URL decides which wedding is being managed: membership
 * is read from `tenant_admins` (RLS only exposes the caller's own rows), so the
 * slug lookup doubles as the authorization check.
 */
import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { tenantIsAvailable } from "@/lib/tenants";

export type ContextTenant = {
  id: string;
  slug: string;
  display_name: string;
  status: string;
  expires_at: string | null;
};

type BaseContext = {
  email: string | null;
  needsPassword: boolean;
  isOwner: boolean;
  /** Every wedding this account may manage, oldest first. */
  tenants: ContextTenant[];
};

export type TenantContext = BaseContext & {
  /** The wedding selected by the current admin URL, if the caller is a member. */
  tenant: ContextTenant | null;
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
    return { email: null, needsPassword: false, isOwner: false, tenants: [] };
  }

  const [membershipsResult, ownerResult] = await Promise.all([
    supabase.from("tenant_admins").select("tenant_id").order("tenant_id", { ascending: true }),
    supabase.rpc("is_platform_owner"),
  ]);

  const tenantIds = [
    ...new Set(
      ((membershipsResult?.data ?? []) as { tenant_id: string }[]).map((row) => String(row.tenant_id))
    ),
  ];

  let tenants: ContextTenant[] = [];
  if (tenantIds.length > 0) {
    const { data: rows } = await supabase
      .from("tenants")
      .select("id, slug, display_name, status, expires_at, created_at")
      .in("id", tenantIds)
      .order("created_at", { ascending: true });
    tenants = (rows ?? []) as ContextTenant[];
  }

  return {
    email: user.email ?? null,
    needsPassword: user.user_metadata?.must_change_password === true,
    isOwner: ownerResult?.data === true,
    tenants,
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
  return { ...base, tenant };
}

/** The wedding for the current admin request; a bare `/admin` falls back to the first. */
export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const base = await loadBaseContext();
  const slug = await currentAdminSlug();
  const tenant = (slug && base.tenants.find((row) => row.slug === slug)) || base.tenants[0] || null;
  return { ...base, tenant };
});

/** Base URL of the panel the current request belongs to, e.g. "/ana-si-stefan/admin". */
export async function adminBasePath(): Promise<string> {
  const slug = await currentAdminSlug();
  return slug ? `/${slug}/admin` : "/admin";
}

/** Convenience for the server actions: the tenant they may write to. An expired
 * or suspended wedding has no writable tenant, so every action fails closed. */
export async function currentTenantId(): Promise<string | null> {
  const context = await getTenantContext();
  if (!context.tenant || !tenantIsAvailable(context.tenant)) return null;
  return context.tenant.id;
}
