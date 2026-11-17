import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isOwnerRequest, platformIsConfigured } from "@/lib/platform";
import { loadOfferRequests } from "@/lib/platform-data";
import { OffersPanel } from "./panel";

export const instant = false;

export const metadata: Metadata = {
  title: "Mesaje",
  robots: { index: false, follow: false },
};

export default async function OffersPage() {
  // Owner-only and live: never a build-time snapshot.
  await connection();
  if (!(await isOwnerRequest())) redirect("/platform/login");

  const configured = platformIsConfigured();
  const requests = configured ? await loadOfferRequests() : [];

  return <OffersPanel requests={requests} configured={configured} />;
}
