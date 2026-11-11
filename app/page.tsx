import type { Metadata } from "next";
import { connection } from "next/server";
import { WeddingSite } from "@/components/wedding-site";
import { getDefaultEventSettings } from "@/lib/public-data";
import { DEFAULT_TENANT_SLUG } from "@/lib/tenants";
import { weddingMetadata } from "@/lib/wedding-metadata";

// Settings are read per request, so changes saved in /admin/settings show up immediately.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const settings = await getDefaultEventSettings();
  return weddingMetadata(settings);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ nume?: string | string[] }>;
}) {
  // The RSVP cutoff depends on "today", so the page must render per request.
  await connection();
  return <WeddingSite slug={DEFAULT_TENANT_SLUG} searchParams={searchParams} />;
}
