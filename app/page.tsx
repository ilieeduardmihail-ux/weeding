import type { Metadata } from "next";
import { connection } from "next/server";
import { Hero } from "@/components/hero";
import { InvitationScreen } from "@/components/invitation-screen";
import { Schedule } from "@/components/schedule";
import { RsvpSection } from "@/components/rsvp-section";
import { getEventSettings, getLocations } from "@/lib/public-data";
import { formatEventDate, isRsvpClosed } from "@/lib/event-settings";

// Settings are read per request, so changes saved in /admin/settings show up immediately.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const settings = await getEventSettings();
  const date = formatEventDate(settings);
  const title = `${settings.partner_1} & ${settings.partner_2}: ${date}`;
  const description = `Vă așteptăm în ${settings.city}, pe ${date}.`;
  // When a photo is uploaded in /admin/messages, WhatsApp shows it as the link
  // preview instead of the generated card.
  const photo = settings.invitation_image_url ? "/invitatia-poza" : undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ro_RO",
      ...(photo ? { images: [{ url: photo, alt: `Invitația ${settings.partner_1} & ${settings.partner_2}` }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(photo ? { images: [photo] } : {}),
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ nume?: string | string[] }>;
}) {
  // The RSVP cutoff depends on "today", so the page must render per request.
  await connection();
  const [settings, locations, params] = await Promise.all([
    getEventSettings(),
    getLocations(),
    searchParams,
  ]);

  // Links sent from /admin/messages carry the guest's name, so the invitation
  // opens straight on their RSVP form instead of asking them to type it again.
  const invited =
    typeof params.nume === "string" ? params.nume.replace(/\s+/g, " ").trim().slice(0, 120) : "";

  return (
    <main>
      <InvitationScreen
        autoOpen={invited.length >= 2}
        landing={
          <Hero
            names={[settings.partner_1, settings.partner_2]}
            displayDate={formatEventDate(settings)}
            displayTime={settings.event_time}
          />
        }
      >
        <Schedule locations={locations} intro={settings.locations_intro} />
        <RsvpSection
          closed={isRsvpClosed(settings)}
          cutoffDate={settings.rsvp_cutoff_date}
          initialName={invited}
        />
      </InvitationScreen>
    </main>
  );
}
