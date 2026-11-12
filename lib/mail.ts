import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outgoing mail, from the platform's own Gmail account.
 *
 * Gmail is used with an **app password** (never the account password): it is a
 * 16-character token that can be revoked on its own, and it is the only thing
 * stored. Sending happens from `GMAIL_USER`, so the client sees an address the
 * owner controls and replies come back to them.
 *
 * Nothing here is imported by the browser: this module lives on the server and
 * the password never leaves it.
 */

const USER = (process.env.GMAIL_USER ?? "").trim();
const PASS = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");

/** The address invoices are sent from, or empty when mail is not configured. */
export function mailFrom(): string {
  return USER;
}

export function mailConfigured(): boolean {
  return Boolean(USER && PASS);
}

let cached: Transporter | null = null;

function transport(): Transporter {
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: USER, pass: PASS },
    // Keep a slow mail server from holding the serverless function open.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return cached;
}

export type InvoiceMail = {
  to: string;
  subject: string;
  text: string;
  fromName: string;
  replyTo?: string;
  attachment: { filename: string; content: Buffer };
};

export async function sendInvoiceMail(mail: InvoiceMail): Promise<void> {
  await transport().sendMail({
    from: { name: mail.fromName, address: USER },
    to: mail.to,
    replyTo: mail.replyTo || undefined,
    subject: mail.subject,
    text: mail.text,
    attachments: [
      {
        filename: mail.attachment.filename,
        content: mail.attachment.content,
        contentType: "application/pdf",
      },
    ],
  });
}

/** Turns a nodemailer error into a sentence the owner can act on. */
export function mailError(error: unknown): string {
  const code = String((error as { code?: unknown })?.code ?? "");
  if (code === "EAUTH" || code === "EAUTHENTICATION") {
    return "Gmail a respins parola de aplicație. Verifică GMAIL_APP_PASSWORD.";
  }
  if (code === "EENVELOPE") return "Adresa de email a fost respinsă de serverul de mail.";
  if (code === "ETIMEDOUT" || code === "ECONNECTION" || code === "ESOCKET") {
    return "Nu am putut contacta serverul de email. Încearcă din nou în câteva secunde.";
  }
  if (code === "EAI_AGAIN") return "Rețeaua nu a răspuns. Încearcă din nou.";
  return "Emailul nu a putut fi trimis. Încearcă din nou.";
}
