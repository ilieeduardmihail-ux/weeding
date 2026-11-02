import type { EventSettings } from "./event-settings";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "2029-07-07" -> "20290707" (the DATE value format used by iCalendar). */
export function icsDate(isoDate: string) {
  if (!DATE.test(isoDate)) throw new Error(`Invalid event date: ${isoDate}`);
  return isoDate.replace(/-/g, "");
}

/** The day after the event. An all-day event ends at 00:00 of the next day. */
export function icsNextDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 says lines should be folded at 75 octets; Latin text fits in 74 chars. */
function fold(line: string) {
  const chunks: string[] = [];
  for (let i = 0; i < line.length; i += 74) chunks.push(line.slice(i, i + 74));
  return chunks.join("\r\n ");
}

function stamp(date: Date) {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function hostOf(site: string) {
  try {
    return new URL(site).host;
  } catch {
    return "wedding.local";
  }
}

export function buildCalendarEvent(settings: EventSettings, now: Date = new Date()) {
  const start = icsDate(settings.event_date);
  const end = icsDate(icsNextDate(settings.event_date));
  const site = settings.public_url ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://weeding.vercel.app";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nunta//Romanian wedding//RO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:wedding-${start}@${hostOf(site)}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcs(`Nunta ${settings.partner_1} & ${settings.partner_2}`)}`,
    `DESCRIPTION:${escapeIcs(`Vă așteptăm în ${settings.city}. Detalii: ${site}`)}`,
    `LOCATION:${escapeIcs(settings.city)}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(fold).join("\r\n")}\r\n`;
}
