import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadAdminData } from "@/lib/admin-data-server";

/** One protected request with every admin dataset, loaded in parallel. */
export async function GET() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await loadAdminData(supabase);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
