import { NextResponse } from "next/server";
import { isOwnerRequest } from "@/lib/platform";
import { loadVisitStats } from "@/lib/platform-data";

/** Live numbers for the owner's activity card. Owner-only, never cached. */
export async function GET() {
  if (!(await isOwnerRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stats = await loadVisitStats();
  return NextResponse.json(stats, { headers: { "Cache-Control": "private, no-store" } });
}
