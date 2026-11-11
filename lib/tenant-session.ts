/**
 * Who is signed in, and for which wedding. The admin panel has no tenant in the
 * URL: the session decides. RLS on `tenants` only returns the weddings the signed
 * in email administers, so this lookup doubles as the authorization check.
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

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

  const [tenantsResult, ownerResult] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, slug, display_name, status, expires_at, created_at")
      .order("created_at", { ascending: true }),
    supabase.rpc("is_platform_owner"),
  ]);

  const tenants = ((tenantsResult?.data ?? []) as ContextTenant[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    status: row.status,
    expires_at: row.expires_at,
  }));

  return {
    email: user.email ?? null,
    needsPassword: user.user_metadata?.must_change_password === true,
    isOwner: ownerResult?.data === true,
    tenants,
    tenant: tenants[0] ?? null,
  };
});

/** Convenience for the server actions: the tenant they may write to. */
export async function currentTenantId(): Promise<string | null> {
  const context = await getTenantContext();
  return context.tenant?.id ?? null;
}
