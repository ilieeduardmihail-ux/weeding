"use server";

import { z } from "zod";
import { clientKey } from "@/lib/client-key";
import { contactBody, contactPeriod, contactSubject } from "@/lib/contact-message";
import { mailConfigured, mailError, sendTextMail } from "@/lib/mail";
import { serviceClient } from "@/lib/platform";
import { BRAND, CONTACT_EMAIL } from "@/lib/marketing";

export type ContactResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Scrieți numele, ca să știm cui răspundem.")
    .max(80, "Numele este prea lung."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Adresa de email nu pare validă.")
    .max(160, "Adresa de email este prea lungă."),
  phone: z.string().trim().max(30, "Numărul de telefon este prea lung."),
  period: z.string().trim().max(40),
  message: z
    .string()
    .trim()
    .min(10, "Scrieți câteva cuvinte despre ce vă doriți.")
    .max(2000, "Mesajul este prea lung. Rezumați-l în câteva rânduri."),
  /** Invisible to people, irresistible to bots. */
  website: z.string().max(200).optional(),
});

/**
 * A small in-memory brake, enough to stop a form being hammered from one
 * address. Serverless instances are recycled, so this is a speed bump, not a
 * guarantee — the honeypot above and the length caps carry the rest.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, { count: number; resetAt: number }>();

function allowed(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    if (hits.size > 5000) {
      for (const [stale, value] of hits) if (now > value.resetAt) hits.delete(stale);
    }
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

export async function sendContactRequest(
  input: z.infer<typeof schema>
): Promise<ContactResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Verificați câmpurile și încercați din nou." };
  }

  // A bot filled a field no person can see. Answer as if it worked, send nothing.
  if (parsed.data.website) return { ok: true };

  if (!allowed(await clientKey())) {
    return {
      ok: false,
      error: `Ați trimis deja câteva mesaje. Încercați din nou peste câteva minute sau scrieți-ne direct la ${CONTACT_EMAIL}.`,
    };
  }

  if (!mailConfigured()) {
    return {
      ok: false,
      error: `Formularul nu este disponibil acum. Scrieți-ne direct la ${CONTACT_EMAIL}.`,
    };
  }

  const request = {
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    period: contactPeriod(parsed.data.period),
    message: parsed.data.message,
  };

  // The request is written down before the notification is sent. If the email
  // fails, the message is not lost: the owner still finds it in /platform/mesaje
  // and can answer from there. The table is optional until the migration runs.
  let stored: { id: string } | null = null;
  let service: ReturnType<typeof serviceClient> | null = null;
  try {
    service = serviceClient();
    const { data } = await service
      .from("offer_requests")
      .insert({
        name: request.name,
        email: request.email,
        phone: request.phone || null,
        period: request.period || null,
        message: request.message,
      })
      .select("id")
      .maybeSingle();
    stored = (data as { id: string } | null) ?? null;
  } catch {
    // Reading the request in the panel is a bonus; the email itself matters more.
  }

  try {
    const messageId = await sendTextMail({
      to: CONTACT_EMAIL,
      fromName: `${BRAND} — site`,
      replyTo: request.email,
      subject: contactSubject(request),
      text: contactBody(request),
      kind: "oferta",
    });

    // Răspunsul trimis din panou pornește de la acest Message-ID, ca să intre în
    // același fir al conversației, nu ca un email nou.
    if (stored && messageId && service) {
      await service.from("offer_requests").update({ mail_message_id: messageId }).eq("id", stored.id);
    }
  } catch (error) {
    return { ok: false, error: mailError(error) };
  }

  return { ok: true };
}
