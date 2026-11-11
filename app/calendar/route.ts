import { buildCalendarEvent } from "@/lib/calendar";
import { getDefaultEventSettings } from "@/lib/public-data";

/** All-day calendar entry for the wedding served at the root of the domain. */
export async function GET() {
  const settings = await getDefaultEventSettings();
  const body = buildCalendarEvent(settings);

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nunta.ics"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
