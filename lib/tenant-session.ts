/**
 * Who is signed in, and for which wedding. The admin panel has no tenant in the
 * URL: the session decides. Membership is read from `tenant_admins` (RLS only
 * exposes the caller's own rows), so this doubles as the authorization check.
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { tenantIsAvailable } from "@/lib/tenants";

export type ContextTenant = {
  id: string;
  slug: string;
  display_name: string;
  status: string;
  expires_at: string | null;
};

export type TenantContext = {
  email: string | null;
  needsPassword: boolean;
  isOwner: boolean;
  tenants: ContextTenant[];
  /** The wedding this admin manages. One client owns one wedding for now. */
  tenant: ContextTenant | null;
};

export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (!user) {
    return { email: null, needsPassword: false, isOwner: false, tenants: [], tenant: null };
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
    tenant: tenants[0] ?? null,
  };
});

/** Convenience for the server actions: the tenant they may write to. An expired
 * or suspended wedding has no writable tenant, so every action fails closed. */
export async function currentTenantId(): Promise<string | null> {
  const context = await getTenantContext();
  if (!context.tenant || !tenantIsAvailable(context.tenant)) return null;
  return context.tenant.id;
}
