import { notFound } from "next/navigation";
import { Hero } from "@/components/hero";
import { InvitationScreen } from "@/components/invitation-screen";
import { Schedule } from "@/components/schedule";
import { RsvpSection } from "@/components/rsvp-section";
import { formatEventDate, isRsvpClosed } from "@/lib/event-settings";
import { loadPublicPage } from "@/lib/public-page";

/**
 * The public wedding site. Shared by the root (the first wedding, so already
 * shared links keep working) and by every /<slug> tenant.
 */
export async function WeddingSite({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Promise<{ nume?: string | string[] }>;
}) {
  const loaded = await loadPublicPage(slug);
  if (!loaded) notFound();

  const { settings, locations } = loaded;
  const params = await searchParams;

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
