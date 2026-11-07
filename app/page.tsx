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
  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "ro_RO" },
  };
}

export default async function Home() {
  // The RSVP cutoff depends on "today", so the page must render per request.
  await connection();
  const [settings, locations] = await Promise.all([getEventSettings(), getLocations()]);

  return (
    <main>
      <InvitationScreen
        landing={
          <Hero
            names={[settings.partner_1, settings.partner_2]}
            displayDate={formatEventDate(settings)}
            displayTime={settings.event_time}
          />
        }
      >
        <Schedule locations={locations} />
        <RsvpSection closed={isRsvpClosed(settings)} cutoffDate={settings.rsvp_cutoff_date} />
      </InvitationScreen>
    </main>
  );
}
