import { formatMoney, type Invoice, type IssuerSettings } from "@/lib/platform-types";

/**
 * The invoice, turned into an email the owner sends from their own mailbox.
 *
 * There is no mail server behind this product: sending a note means opening the
 * owner's mail app with the message already written, exactly like the WhatsApp
 * buttons. That keeps the sender address recognisable to the client, avoids a
 * third-party provider and leaves the final Send in the owner's hands. Kept
 * pure so the wording is testable.
 */

const dateFmt = new Intl.DateTimeFormat("ro-RO", { dateStyle: "long", timeZone: "UTC" });

/** Formats `YYYY-MM-DD` or a full timestamp; empty string when unusable. */
export function invoiceDate(value: string | null): string {
  if (!value) return "";
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFmt.format(date);
}

/** A deliberately strict check: one @, a dot in the domain, no separators. */
export function isEmailLike(value: string): boolean {
  return /^[^\s@,;:"<>()[\]]+@[^\s@,;:"<>()[\]]+\.[^\s@,;:"<>()[\]]{2,}$/.test(value.trim());
}

export function invoiceEmailSubject(invoice: Invoice, issuer: IssuerSettings): string {
  const from = issuer.issuerName.trim();
  return from ? `Notă de plată nr. ${invoice.number} — ${from}` : `Notă de plată nr. ${invoice.number}`;
}

export function invoiceEmailBody(invoice: Invoice, issuer: IssuerSettings): string {
  const name = invoice.clientName.trim();
  const issued = invoiceDate(invoice.issuedAt);
  const paragraphs: string[] = [];
  // The email is plain text: a non-breaking space would be pasted as-is by some
  // clients, so use the ordinary one.
  const money = formatMoney(invoice.amount, invoice.currency).replace(/\u00a0/g, " ");

  paragraphs.push(name ? `Bună ziua, ${name},` : "Bună ziua,");
  paragraphs.push(
    `Vă trimit nota de plată nr. ${invoice.number}${issued ? ` din ${issued}` : ""}.`
  );
  paragraphs.push(`${invoice.description}\nTotal de plată: ${money}`);

  if (invoice.paid) {
    const paidAt = invoiceDate(invoice.paidAt);
    paragraphs.push(`Stare: plătită${paidAt ? ` la ${paidAt}` : ""}.`);
  } else {
    const iban = issuer.issuerIban.trim();
    if (iban) {
      const bank = issuer.issuerBank.trim();
      paragraphs.push(
        `Stare: neplătită. Se poate achita în contul ${bank ? `${bank}, ` : ""}IBAN ${iban}.`
      );
    } else {
      paragraphs.push("Stare: neplătită.");
    }
  }

  if (invoice.notes) paragraphs.push(invoice.notes);
  if (issuer.footerNote) paragraphs.push(issuer.footerNote);

  const signature = [
    issuer.issuerName.trim(),
    issuer.issuerAddress.trim(),
    issuer.issuerTaxId.trim() ? `CUI/CNP: ${issuer.issuerTaxId.trim()}` : "",
    [issuer.issuerEmail.trim(), issuer.issuerPhone.trim()].filter(Boolean).join(" · "),
  ].filter(Boolean);
  if (signature.length > 0) paragraphs.push(signature.join("\n"));

  return paragraphs.join("\n\n");
}

/**
 * `mailto:` with everything already written, so the owner only types/changes the
 * address and presses Send. Line breaks must be CRLF, otherwise Outlook pastes
 * the whole message on one line.
 */
export function invoiceMailto(invoice: Invoice, issuer: IssuerSettings, to: string): string {
  const subject = invoiceEmailSubject(invoice, issuer);
  const body = invoiceEmailBody(invoice, issuer);
  const encode = (value: string) => encodeURIComponent(value).replace(/%0A/g, "%0D%0A");
  return `mailto:${to.trim()}?subject=${encode(subject)}&body=${encode(body)}`;
}

/** What "copiază mesajul" puts on the clipboard, for webmail without a mail handler. */
export function invoiceEmailCopy(invoice: Invoice, issuer: IssuerSettings): string {
  return `${invoiceEmailSubject(invoice, issuer)}\n\n${invoiceEmailBody(invoice, issuer)}`;
}

/**
 * Where the message is written. `mailto:` is only one of the answers: on a
 * machine with no mail app installed Windows answers it with "how do you want
 * to open this?" and then an empty tab, so webmail has to be opened directly.
 */
export type MailProvider = "gmail" | "outlook" | "office" | "yahoo" | "app";

export const MAIL_PROVIDERS: { id: MailProvider; label: string }[] = [
  { id: "gmail", label: "Gmail" },
  { id: "outlook", label: "Outlook / Hotmail" },
  { id: "office", label: "Outlook de la serviciu" },
  { id: "yahoo", label: "Yahoo Mail" },
  { id: "app", label: "Aplicația mea de email" },
];

export function isMailProvider(value: string | null): value is MailProvider {
  return MAIL_PROVIDERS.some((item) => item.id === value);
}

/** True when the link opens a web page instead of the installed mail app. */
export function mailProviderOpensTab(provider: MailProvider): boolean {
  return provider !== "app";
}

/**
 * The compose window of the chosen mail service, with the note already written.
 * Every one of these is a documented deep link that works while signed in; the
 * owner only presses Send.
 */
export function invoiceEmailUrl(
  provider: MailProvider,
  invoice: Invoice,
  issuer: IssuerSettings,
  to: string
): string {
  const address = encodeURIComponent(to.trim());
  if (provider === "app") return invoiceMailto(invoice, issuer, to);

  const subject = encodeURIComponent(invoiceEmailSubject(invoice, issuer));
  const body = encodeURIComponent(invoiceEmailBody(invoice, issuer));

  switch (provider) {
    case "outlook":
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${address}&subject=${subject}&body=${body}`;
    case "office":
      return `https://outlook.office.com/mail/deeplink/compose?to=${address}&subject=${subject}&body=${body}`;
    case "yahoo":
      return `https://compose.mail.yahoo.com/?to=${address}&subject=${subject}&body=${body}`;
    default:
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${address}&su=${subject}&body=${body}`;
  }
}

