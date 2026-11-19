/**
 * Jurnalul emailurilor trimise din platformă: doar metadate (cui, subiect, când,
 * dacă a plecat). Conținutul nu se salvează — cererile de ofertă rămân doar în
 * Gmail, ca să nu duplicăm date personale.
 *
 * Scrierea nu are voie să strice trimiterea: orice eroare aici este înghițită.
 * Tabelul este citit doar cu cheia de service, după verificarea de owner.
 */
import "server-only";

import { demoMode } from "@/lib/demo/mode";
import { serviceClient } from "@/lib/platform";

export type MailKind = "oferta" | "factura" | "cheie" | "raspuns" | "lead" | "cod";

export type MailLogEntry = {
  kind: MailKind;
  to: string;
  subject: string;
  replyTo?: string | null;
  tenantId?: string | null;
  ok: boolean;
  error?: string | null;
  messageId?: string | null;
};

export async function recordMail(entry: MailLogEntry): Promise<void> {
  if (demoMode) return;
  try {
    await serviceClient()
      .from("mail_log")
      .insert({
        kind: entry.kind,
        to_address: entry.to.slice(0, 320),
        subject: entry.subject.slice(0, 300),
        reply_to: entry.replyTo || null,
        tenant_id: entry.tenantId || null,
        ok: entry.ok,
        error: entry.error ? entry.error.slice(0, 300) : null,
        message_id: entry.messageId || null,
      });
  } catch {
    // Mail still matters more than its log.
  }
}
