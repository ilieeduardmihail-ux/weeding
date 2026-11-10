/**
 * Event settings: the single source of truth for names, date, city and RSVP cutoff.
 * Stored in Supabase (`event_settings`, one row) or in the demo store when Supabase is not configured.
 * Schedule/venues/FAQ stay in lib/config.ts — they are not part of `event_settings`.
 */
import { z } from "zod";

export type EventSettings = {
  partner_1: string;
  partner_2: string;
  event_date: string; // YYYY-MM-DD
  event_time: string; // HH:MM
  city: string;
  timezone: string; // IANA name, e.g. Europe/Bucharest
  contact_email: string;
  rsvp_cutoff_date: string | null; // YYYY-MM-DD; null = RSVP never closes
  seating_published: boolean;
  public_url: string | null;
  /** Editable WhatsApp message shown in /admin/messages. */
  invite_message: string;
};

export const DEFAULT_INVITE_MESSAGE =
  "Bună, {nume}! Cu mare drag te invităm la nunta noastră, pe {data}. " +
  "Toate detaliile și confirmarea prezenței sunt aici: {link}";

export const DEFAULT_EVENT_SETTINGS: EventSettings = {
  partner_1: "Ana",
  partner_2: "Marco",
  event_date: "2027-06-12",
  event_time: "16:00",
  city: "Lisbon",
  timezone: "Europe/Lisbon",
  contact_email: "ilieeduardmihail@gmail.com",
  rsvp_cutoff_date: null,
  seating_published: false,
  public_url: null,
  invite_message: DEFAULT_INVITE_MESSAGE,
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

const optionalDate = z.preprocess(
  emptyToNull,
  z.string().regex(DATE, "Use YYYY-MM-DD").nullable()
);

const optionalUrl = z.preprocess(
  emptyToNull,
  z
    .url()
    .refine((value) => value.startsWith("https://"), "Must start with https://")
    .nullable()
);

export const eventSettingsSchema = z.object({
  partner_1: z.string().trim().min(2).max(80),
  partner_2: z.string().trim().min(2).max(80),
  event_date: z.string().regex(DATE, "Use YYYY-MM-DD"),
  event_time: z.string().regex(TIME, "Use HH:MM"),
  city: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(3).max(64),
  contact_email: z.string().trim().email("Use a valid email address").max(200),
  rsvp_cutoff_date: optionalDate,
  seating_published: z.boolean(),
  public_url: optionalUrl,
});

export function normalizeTime(value: string) {
  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : value;
}

/** Accepts a Supabase row (snake_case, time may be "16:00:00", date may be null). */
export function normalizeSettings(row: Record<string, unknown> | null | undefined): EventSettings {
  if (!row) return { ...DEFAULT_EVENT_SETTINGS };
  const text = (key: keyof EventSettings, fallback: string) => {
    const value = row[key];
    return typeof value === "string" && value.trim() !== "" ? value : fallback;
  };
  return {
    partner_1: text("partner_1", DEFAULT_EVENT_SETTINGS.partner_1),
    partner_2: text("partner_2", DEFAULT_EVENT_SETTINGS.partner_2),
    event_date: text("event_date", DEFAULT_EVENT_SETTINGS.event_date),
    event_time: normalizeTime(text("event_time", DEFAULT_EVENT_SETTINGS.event_time)),
    city: text("city", DEFAULT_EVENT_SETTINGS.city),
    timezone: text("timezone", DEFAULT_EVENT_SETTINGS.timezone),
    contact_email: text("contact_email", DEFAULT_EVENT_SETTINGS.contact_email),
    rsvp_cutoff_date:
      typeof row.rsvp_cutoff_date === "string" && row.rsvp_cutoff_date !== ""
        ? row.rsvp_cutoff_date
        : null,
    seating_published: row.seating_published === true,
    public_url: typeof row.public_url === "string" && row.public_url !== "" ? row.public_url : null,
    invite_message: text("invite_message", DEFAULT_EVENT_SETTINGS.invite_message),
  };
}

/** "2027-06-12" -> "12 iunie 2027" (no timezone drift: midday UTC). */
export function formatEventDate(settings: Pick<EventSettings, "event_date">) {
  const date = new Date(`${settings.event_date}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return settings.event_date;
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Today's date (YYYY-MM-DD) in the event's timezone. */
export function todayInZone(timeZone: string, now: Date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function isRsvpClosed(settings: EventSettings, now: Date = new Date()) {
  if (!settings.rsvp_cutoff_date) return false;
  return todayInZone(settings.timezone, now) > settings.rsvp_cutoff_date;
}

/** Offset (ms) of `timeZone` at the given instant. */
function zoneOffsetMs(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second")
  );
  return asUtc - instant.getTime();
}

/** The exact instant of the event, so the countdown is right in any guest timezone. */
export function eventStartIso(settings: EventSettings) {
  const [year, month, day] = settings.event_date.split("-").map(Number);
  const [hours, minutes] = settings.event_time.split(":").map(Number);
  if (!year || !month || !day) return new Date().toISOString();

  const localAsUtc = Date.UTC(year, month - 1, day, hours || 0, minutes || 0, 0);
  let timestamp = localAsUtc - zoneOffsetMs(new Date(localAsUtc), settings.timezone);
  // Second pass handles DST boundaries.
  timestamp = localAsUtc - zoneOffsetMs(new Date(timestamp), settings.timezone);
  return new Date(timestamp).toISOString();
}
