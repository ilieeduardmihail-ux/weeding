import type { Metadata } from "next";
import { connection } from "next/server";
import { Hero } from "@/components/hero";
import { Schedule } from "@/components/schedule";
import { Faq } from "@/components/faq";
import { PublicSeating } from "@/components/public-seating";
import { RsvpSection } from "@/components/rsvp-section";
import { getEventSettings, getPublicSeating } from "@/lib/public-data";
import { eventStartIso, formatEventDate, isRsvpClosed } from "@/lib/event-settings";

// Settings are read per request, so changes saved in /admin/settings show up immediately.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const settings = await getEventSettings();
  const date = formatEventDate(settings);
  return {
    title: `${settings.partner_1} & ${settings.partner_2}: ${date}`,
    description: `Join us in ${settings.city} on ${date}.`,
  };
}

export default async function Home() {
  // The RSVP cutoff depends on "today", so the page must render per request.
  await connection();
  const [settings, tables] = await Promise.all([getEventSettings(), getPublicSeating()]);

  return (
    <main>
      <Hero
        names={[settings.partner_1, settings.partner_2]}
        displayDate={formatEventDate(settings)}
        city={settings.city}
        eventIso={eventStartIso(settings)}
      />
      <Schedule />
      <Faq />
      {tables && <PublicSeating tables={tables} />}
      <RsvpSection closed={isRsvpClosed(settings)} cutoffDate={settings.rsvp_cutoff_date} />
    </main>
  );
}
