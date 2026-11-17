import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOwnerRequest, platformIsConfigured } from "@/lib/platform";
import { loadPlatformOverview, loadVisitStats, countNewOfferRequests } from "@/lib/platform-data";
import { EMPTY_VISITS } from "@/lib/platform-types";
import { requestNow } from "@/lib/request-now";
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
  const activity = configured
    ? await loadVisitStats()
    : { marketing: EMPTY_VISITS, invites: EMPTY_VISITS, hourly: [] };
  const newRequests = configured ? await countNewOfferRequests() : 0;

  return (
    <PlatformDashboard
      overview={overview}
      ownerEmail={email ?? ""}
      configured={configured}
      now={requestNow()}
      activity={activity}
      newRequests={newRequests}
    />
  );
}
