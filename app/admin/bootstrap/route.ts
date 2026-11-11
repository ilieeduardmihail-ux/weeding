import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadAdminData } from "@/lib/admin-data-server";
import { getTenantContext } from "@/lib/tenant-session";
import { tenantIsAvailable } from "@/lib/tenants";

/** One protected request with every admin dataset, loaded in parallel for the signed-in tenant. */
export async function GET() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { tenant } = await getTenantContext();
  if (!tenant) {
    return NextResponse.json({ error: "no-tenant" }, { status: 401 });
  }
  // Expired or suspended weddings cannot read their dataset either.
  if (!tenantIsAvailable(tenant)) {
    return NextResponse.json({ error: "unavailable" }, { status: 403 });
  }

  const data = await loadAdminData(supabase, tenant);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
