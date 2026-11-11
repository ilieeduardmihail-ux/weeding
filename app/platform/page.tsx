import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOwnerRequest, platformIsConfigured } from "@/lib/platform";
import { loadPlatformOverview } from "@/lib/platform-data";
import { PlatformDashboard } from "./dashboard";

export const instant = false;

export const metadata: Metadata = {
  title: "Platformă",
  robots: { index: false, follow: false },
};

export default async function PlatformPage() {
  // The panel is per-owner and reads live tenant data: never a build snapshot.
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data?.user?.email ?? null;

  if (!(await isOwnerRequest())) redirect("/platform/login");

  const configured = platformIsConfigured();
  const overview = configured
    ? await loadPlatformOverview()
    : { tenants: [], owners: [] };

  return (
    <PlatformDashboard overview={overview} ownerEmail={email ?? ""} configured={configured} />
  );
}
