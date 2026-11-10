/**
 * Invitation message helpers.
 *
 * The couple edits one template in /admin/messages. Every guest gets the same
 * text with their own name and a link back to the RSVP form, then the message is
 * opened in WhatsApp by hand — no contact list leaves the browser.
 */
import { formatEventDate, type EventSettings } from "@/lib/event-settings";

export { DEFAULT_INVITE_MESSAGE } from "@/lib/event-settings";

export const MESSAGE_PLACEHOLDERS = [
  { token: "{nume}", label: "prenumele invitatului" },
  { token: "{nume_complet}", label: "numele complet" },
  { token: "{data}", label: "data nunții" },
  { token: "{link}", label: "linkul de confirmare" },
] as const;

/** Canonical public URL; the browser can override it when running on another host. */
export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://wedding-ro.vercel.app"
).replace(/\/+$/, "");

export function cleanName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function firstName(fullName: string) {
  return cleanName(fullName).split(" ")[0] ?? "";
}

/** Link that opens the invitation with the guest's name already filled in. */
export function rsvpLink(siteUrl: string, fullName: string) {
  const base = (siteUrl || PUBLIC_SITE_URL).replace(/\/+$/, "");
  return `${base}/?nume=${encodeURIComponent(cleanName(fullName))}#rsvp`;
}

type RenderInput = {
  fullName: string;
  settings: Pick<EventSettings, "event_date">;
  siteUrl?: string;
};

/** Replaces every placeholder in one pass, so names containing `{...}` stay intact. */
export function renderInviteMessage(template: string, input: RenderInput) {
  const name = cleanName(input.fullName) || "Invitat";
  const values: Record<string, string> = {
    "{nume_complet}": name,
    "{nume}": firstName(name),
    "{data}": formatEventDate(input.settings),
    "{link}": rsvpLink(input.siteUrl ?? PUBLIC_SITE_URL, name),
  };
  return template.replace(/\{(?:nume_complet|nume|data|link)\}/g, (token) => values[token] ?? token);
}

/** Digits only, because wa.me wants the full international number. */
export function phoneDigits(phone: string | null | undefined) {
  return (phone ?? "").replace(/\D/g, "");
}

export function whatsappHref(phone: string | null | undefined, text: string) {
  const digits = phoneDigits(phone);
  if (digits.length < 6) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Optional phone: empty is allowed, otherwise digits with an optional leading +. */
export function isPhoneLike(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  return /^\+?[0-9][0-9\s().-]{4,19}$/.test(trimmed);
}
