import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { demoMode } from "./demo/mode";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";

/**
 * The wedding currently served at the root of the domain. After the multi-tenant
 * rollout every client has its own /<slug> site; the root keeps rendering this
 * one so links already shared on WhatsApp keep working.
 */
export const DEFAULT_TENANT_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT?.trim() || "ana-si-stefan";

export type Tenant = {
  id: string;
  slug: string;
  display_name: string;
  status: "pending" | "active" | "suspended";
  expires_at: string | null;
  theme: Record<string, unknown>;
};

/** Only these tenants are allowed to serve a public site or an admin panel. */
export function tenantIsAvailable(tenant: { status: string; expires_at: string | null }) {
  if (tenant.status !== "active") return false;
  return !tenant.expires_at || new Date(tenant.expires_at).getTime() > Date.now();
}

const DEMO_TENANT: Tenant = {
  id: "demo-tenant",
  slug: DEFAULT_TENANT_SLUG,
  display_name: "Nunta demo",
  status: "active",
  expires_at: null,
  theme: {},
};

function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Public tenant lookup. RLS only exposes active tenants, so an expired or
 * suspended site looks exactly like a missing one (404) to visitors.
 */
export const getTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  const clean = slug.trim().toLowerCase();
  if (!clean) return null;

  if (demoMode) return { ...DEMO_TENANT, slug: clean };

  try {
    const { data } = await anonClient()
      .from("tenants")
      .select("id, slug, display_name, status, expires_at, theme")
      .eq("slug", clean)
      .maybeSingle();
    if (!data) return null;
    return data as Tenant;
  } catch {
    return null;
  }
});

/** The tenant shown at the root of the domain. */
export const getDefaultTenant = cache(async (): Promise<Tenant | null> =>
  getTenantBySlug(DEFAULT_TENANT_SLUG)
);
