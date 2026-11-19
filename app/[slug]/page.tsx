import type { Metadata } from "next";
import { connection } from "next/server";
import { WeddingSite } from "@/components/wedding-site";
import { VisitBeacon } from "@/components/visit-beacon";
import { DemoAccountBar } from "@/components/marketing/demo-account-bar";
import { DEMO_SLUG } from "@/lib/marketing";
import { loadPublicPage } from "@/lib/public-page";
import { weddingMetadata } from "@/lib/wedding-metadata";

// The RSVP cutoff and the tenant settings are read per request.
export const instant = false;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ nume?: string | string[] }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const loaded = await loadPublicPage(slug);
  if (!loaded) {
    return { title: "Invitație indisponibilă", robots: { index: false, follow: false } };
  }
  return weddingMetadata(loaded.settings, loaded.tenant.slug);
}

export default async function TenantHome({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  return (
    <>
      {slug === DEMO_SLUG && <DemoAccountBar />}
      <VisitBeacon path={`/${slug}`} />
      <WeddingSite slug={slug} searchParams={searchParams} />
    </>
  );
}
