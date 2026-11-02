import { buildCalendarEvent } from "@/lib/calendar";
import { getEventSettings } from "@/lib/public-data";

/** All-day calendar entry, generated from the settings the couple edits in /admin. */
export async function GET() {
  const settings = await getEventSettings();
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
