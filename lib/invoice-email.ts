import { formatMoney, type Invoice, type IssuerSettings } from "@/lib/platform-types";

/**
 * The invoice, turned into the text of an email.
 *
 * The message is written for the client, in Romanian, and it is the same one
 * whether it is sent by the server (with the PDF attached) or copied by hand.
 * Kept pure so the wording is testable.
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

export function invoiceEmailBody(
  invoice: Invoice,
  issuer: IssuerSettings,
  options: { attachment?: boolean } = {}
): string {
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
  if (options.attachment) paragraphs.push("Atașat găsiți nota de plată în format PDF.");

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

/** What "copiază mesajul" puts on the clipboard, for sending it by hand. */
export function invoiceEmailCopy(invoice: Invoice, issuer: IssuerSettings): string {
  return `${invoiceEmailSubject(invoice, issuer)}\n\n${invoiceEmailBody(invoice, issuer)}`;
}
