/**
 * The upgrade request a Standard couple sends from the budget page.
 *
 * Every wedding gets its own draft: the names, the date, the city and the
 * invitation link come from that wedding's settings, so the owner sees right
 * away who is writing and which invitation should move to Premium.
 *
 * Kept pure — no React and no mail transport — so the wording can be tested.
 */
import { formatEventDate, type EventSettings } from "./event-settings";

export type PremiumSettings = Pick<
  EventSettings,
  "partner_1" | "partner_2" | "event_date" | "city" | "public_url"
>;

export type PremiumRequest = {
  partner1: string;
  partner2: string;
  /** `YYYY-MM-DD`, straight from the settings. */
  eventDate: string;
  city: string;
  slug: string;
  /** Public address of the invitation; a trailing slash is ignored. */
  siteUrl: string;
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

/** "Ana & Ștefan", or "" when the wedding never filled the names in. */
export function premiumCouple(request: PremiumRequest): string {
  const one = clean(request.partner1);
  const two = clean(request.partner2);
  if (one && two) return `${one} & ${two}`;
  return one || two;
}

/**
 * The date only when it is a real one: `formatEventDate` happily formats
 * "2027-02-31" as 3 March, and that must not end up in the email.
 */
export function premiumDate(request: PremiumRequest): string {
  const date = clean(request.eventDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return "";
  return formatEventDate({ event_date: date });
}

export function premiumInvitationUrl(request: PremiumRequest): string {
  const base = clean(request.siteUrl).replace(/\/+$/, "");
  const slug = clean(request.slug).replace(/^\/+|\/+$/g, "");
  return slug ? `${base}/${slug}` : base;
}

export function premiumSubject(request: PremiumRequest): string {
  const who = premiumCouple(request) || clean(request.slug) || "nunta noastră";
  return `Trecere la Premium — ${who}`;
}

export function premiumBody(request: PremiumRequest): string {
  const couple = premiumCouple(request);
  const date = premiumDate(request);
  const city = clean(request.city);
  const when = date ? ` pe ${date}${city ? `, în ${city}` : ""}` : "";

  // Without names the draft still has to say which wedding it is; the slug is
  // the one identifier the owner uses in the platform.
  const intro = couple
    ? `Suntem ${couple} și avem nunta${when}.`
    : `Suntem mirii nunții ${clean(request.slug) || "de pe site"}.${
        when ? ` Nunta noastră este${when}.` : ""
      }`;

  return [
    "Bună ziua!",
    "",
    intro,
    "Vrem să trecem la pachetul Premium, ca să deblocăm bugetul, furnizorii,",
    "planificatorul financiar și calculatorul de dar.",
    "",
    `Invitația noastră: ${premiumInvitationUrl(request)}`,
    "",
    "Mulțumim!",
  ].join("\n");
}

/** Input for the two helpers above, built from the wedding's own settings. */
export function premiumRequest(
  settings: PremiumSettings,
  slug: string,
  fallbackSiteUrl: string,
): PremiumRequest {
  return {
    partner1: settings.partner_1,
    partner2: settings.partner_2,
    eventDate: settings.event_date,
    city: settings.city,
    slug,
    siteUrl: settings.public_url ?? fallbackSiteUrl,
  };
}
