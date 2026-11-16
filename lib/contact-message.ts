/**
 * The offer request sent from the presentation page, turned into an email.
 *
 * Kept pure — no React, no mail transport — so the wording the owner reads in
 * Gmail can be tested. The server action validates the fields, then calls these
 * helpers; the visible form uses the same period list for its select.
 */

export const CONTACT_PERIODS = ["6 luni", "1 an", "1 an și 6 luni", "2 ani", "Nu știu încă"] as const;

export type ContactPeriod = (typeof CONTACT_PERIODS)[number];

export type ContactRequest = {
  name: string;
  email: string;
  phone: string;
  period: string;
  message: string;
};

const sentAt = new Intl.DateTimeFormat("ro-RO", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Bucharest",
});

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Only the periods the form offers reach the subject, so nothing free-form lands there. */
export function contactPeriod(value: string): string {
  const period = clean(value);
  return (CONTACT_PERIODS as readonly string[]).includes(period) ? period : "";
}

export function contactSubject(request: ContactRequest): string {
  const name = clean(request.name);
  const period = contactPeriod(request.period);
  return period ? `Cerere ofertă — ${name} — ${period}` : `Cerere ofertă — ${name}`;
}

/**
 * The body is plain text on purpose: it is read in Gmail, forwarded and copied
 * without losing formatting.
 */
export function contactBody(request: ContactRequest, now: Date = new Date()): string {
  const lines = [
    "Cerere de ofertă trimisă din site.",
    "",
    `Nume: ${clean(request.name)}`,
    `Email: ${clean(request.email)}`,
  ];

  const phone = clean(request.phone);
  if (phone) lines.push(`Telefon: ${phone}`);

  lines.push(
    `Perioada dorită: ${contactPeriod(request.period) || "nu a fost aleasă"}`,
    "",
    "Mesaj:",
    request.message.trim(),
    "",
    `Trimis la: ${sentAt.format(now)}`
  );

  return lines.join("\n");
}
