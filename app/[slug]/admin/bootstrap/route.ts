import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadAdminData } from "@/lib/admin-data-server";
import { getAdminTenant } from "@/lib/tenant-session";
import { tenantIsAvailable } from "@/lib/tenants";

/**
 * One protected request with every admin dataset, loaded in parallel for the
 * wedding in the URL. The tenant (and the membership check) comes from a single
 * row: the caller's own `tenant_admins` entry joined with its wedding.
 */
export async function GET() {
  const tenant = await getAdminTenant();
  if (!tenant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Expired or suspended weddings cannot read their dataset either.
  if (!tenantIsAvailable(tenant)) {
    return NextResponse.json({ error: "unavailable" }, { status: 403 });
  }

  const supabase = await createClient();
  const data = await loadAdminData(supabase, tenant);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
