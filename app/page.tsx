import type { Metadata } from "next";
import { connection } from "next/server";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { MobileRsvp } from "@/components/mobile-rsvp";
import { Particles } from "@/components/particles";
import { Schedule } from "@/components/schedule";
import { PublicSeating } from "@/components/public-seating";
import { RsvpSection } from "@/components/rsvp-section";
import { getEventSettings, getLocations, getPublicSeating } from "@/lib/public-data";
import { eventStartIso, formatEventDate, isRsvpClosed } from "@/lib/event-settings";

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
  const [settings, tables, locations] = await Promise.all([
    getEventSettings(),
    getPublicSeating(),
    getLocations(),
  ]);

  return (
    <main className="pb-20 sm:pb-0">
      <Particles />
      <Hero
        names={[settings.partner_1, settings.partner_2]}
        displayDate={formatEventDate(settings)}
        city={settings.city}
        eventIso={eventStartIso(settings)}
      />
      <Schedule locations={locations} />
      {tables && <PublicSeating tables={tables} />}
      <RsvpSection closed={isRsvpClosed(settings)} cutoffDate={settings.rsvp_cutoff_date} />
      <Footer names={[settings.partner_1, settings.partner_2]} email={settings.contact_email} />
      <MobileRsvp />
    </main>
  );
}
