import type { Metadata } from "next";
import { connection } from "next/server";
import { PrivacyPolicy } from "@/components/privacy-policy";
import { getDefaultEventSettings } from "@/lib/public-data";
import { DEFAULT_TENANT_SLUG } from "@/lib/tenants";

// Settings are read per request, so the couple's names stay current.
export const instant = false;

export const metadata: Metadata = {
  title: "Confidențialitate",
  description: "Ce date colectăm prin confirmarea de prezență și cum le folosim.",
  robots: { index: false, follow: false },
};

/**
 * Legacy entry point: the privacy page of the wedding served at the root. Every
 * client also has /<slug>/confidentialitate. Kept so old links keep working.
 */
export default async function PrivacyPage() {
  await connection();
  const settings = await getDefaultEventSettings();
  return <PrivacyPolicy settings={settings} slug={DEFAULT_TENANT_SLUG} />;
}
