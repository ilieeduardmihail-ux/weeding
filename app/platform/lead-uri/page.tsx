import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isOwnerRequest, platformIsConfigured } from "@/lib/platform";
import { loadLeads } from "@/lib/platform-data";
import { requestNow } from "@/lib/request-now";
import { LeadsPanel } from "./panel";

export const instant = false;

export const metadata: Metadata = {
  title: "Lead-uri",
  robots: { index: false, follow: false },
};

export default async function LeadsPage() {
  // Owner-only and live: never a build-time snapshot.
  await connection();
  if (!(await isOwnerRequest())) redirect("/platform/login");

  const configured = platformIsConfigured();
  const leads = configured ? await loadLeads() : [];

  return <LeadsPanel leads={leads} configured={configured} now={requestNow()} />;
}
