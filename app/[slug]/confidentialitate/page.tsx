import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { PrivacyPolicy } from "@/components/privacy-policy";
import { loadPublicPage } from "@/lib/public-page";

// The wedding is read per request from the slug in the URL.
export const instant = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const loaded = await loadPublicPage(slug);
  const title = loaded
    ? `Confidențialitate · ${loaded.settings.partner_1} & ${loaded.settings.partner_2}`
    : "Confidențialitate";

  return {
    title,
    description: "Ce date colectăm prin confirmarea de prezență și cum le folosim.",
    robots: { index: false, follow: false },
  };
}

/** Privacy policy for one wedding, linked from its RSVP consent checkbox. */
export default async function TenantPrivacyPage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const loaded = await loadPublicPage(slug);
  if (!loaded) notFound();
  return <PrivacyPolicy settings={loaded.settings} slug={slug} />;
}
