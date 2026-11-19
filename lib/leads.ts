/**
 * Conturile demo: codul de 6 cifre trimis pe email și rândul din `leads`.
 *
 * Fluxul are două jumătăți care se ating doar aici:
 *   1. `startLeadCode` salvează (hash-uit) un cod și trimite emailul.
 *   2. `checkLeadCode` îl verifică, cu expirare și număr de încercări.
 *
 * Codurile nu sunt niciodată stocate în clar: în bază ajunge doar un HMAC, iar
 * comparația se face în timp constant. Tot ce ține de contul Supabase (creare,
 * parolă, sesiune) rămâne în acțiunile server, nu aici.
 */
import "server-only";

import { purgeExpiredSandboxes } from "@/lib/demo/sandbox";
import { mailConfigured, sendTextMail } from "@/lib/mail";
import { demoCodeMail, leadNoticeMail } from "@/lib/mail-templates";
import { BRAND, CONTACT_EMAIL } from "@/lib/marketing";
import { PUBLIC_SITE_URL } from "@/lib/message-template";
import { platformIsConfigured, serviceClient } from "@/lib/platform";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";
import {
  CODE_MAX_ATTEMPTS,
  CODE_TTL_MINUTES,
  codeMatches,
  generateLeadCode,
  hashLeadCode,
  normalizeEmail,
  resendWaitSeconds,
} from "@/lib/leads-code";

/**
 * The pure half (hashing, the code, the clocks) lives in `lib/leads-code.ts`.
 * Re-exported so callers keep one import for everything about demo accounts.
 */
export {
  CODE_MAX_ATTEMPTS,
  CODE_RESEND_SECONDS,
  CODE_TTL_MINUTES,
  generateLeadCode,
  hashLeadCode,
  normalizeEmail,
  sandboxDaysLeft,
} from "@/lib/leads-code";

export type Lead = {
  id: string;
  email: string;
  name: string | null;
  user_id: string | null;
  verified_at: string | null;
  sandbox_tenant_id: string | null;
  code_hash: string | null;
  code_purpose: string | null;
  code_expires_at: string | null;
  code_attempts: number;
  code_sent_at: string | null;
};

const LEAD_COLUMNS =
  "id, email, name, user_id, verified_at, sandbox_tenant_id, code_hash, code_purpose, code_expires_at, code_attempts, code_sent_at";

/* --------------------------------------------------------------- persistence */

export function leadsConfigured(): boolean {
  return platformIsConfigured();
}

export async function findLead(email: string): Promise<Lead | null> {
  const { data } = await serviceClient()
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("email", normalizeEmail(email))
    .maybeSingle();
  return (data as Lead | null) ?? null;
}

export type StartResult = { ok: true; devCode?: string } | { ok: false; error: string };

/**
 * Writes a fresh code for this address and emails it. The row is saved before
 * the message is sent: a failed send leaves an unusable code, never a code in
 * someone's inbox that the database has never heard of.
 */
export async function startLeadCode(input: {
  name?: string | null;
  email: string;
  purpose: "signup" | "reset";
}): Promise<StartResult> {
  if (!platformIsConfigured()) {
    return { ok: false, error: "Înscrierea nu este disponibilă acum. Scrie-ne pe email." };
  }

  const email = normalizeEmail(input.email);
  const service = serviceClient();
  await purgeExpiredSandboxes();

  const lead = await findLead(email);

  // A confirmed address whose copy still exists cannot start over. Once the
  // seven days are gone the copy and the login are deleted by the sweep above,
  // so the same person can make a fresh one instead of being locked out.
  if (input.purpose === "signup" && lead?.verified_at && lead.sandbox_tenant_id) {
    return { ok: false, error: "Există deja un cont cu această adresă. Intră la „Am deja cont”." };
  }
  if (input.purpose === "reset" && !lead?.user_id) {
    return {
      ok: false,
      error: "Nu găsim un cont activ cu această adresă. Îți poți face unul în câteva secunde.",
    };
  }

  const now = Date.now();
  const wait = resendWaitSeconds(lead?.code_sent_at ?? null, now);
  if (wait > 0) {
    return { ok: false, error: `Am trimis deja un cod. Încearcă din nou în ${wait} secunde.` };
  }

  const code = generateLeadCode();
  const sentAt = new Date(now).toISOString();
  const patch = {
    code_hash: hashLeadCode(code, email),
    code_purpose: input.purpose,
    code_expires_at: new Date(now + CODE_TTL_MINUTES * 60_000).toISOString(),
    code_attempts: 0,
    code_sent_at: sentAt,
  };

  if (lead) {
    const { error } = await service
      .from("leads")
      .update({
        ...patch,
        ...(input.purpose === "signup"
          ? {
              name: input.name?.trim() || lead.name,
              consent_at: sentAt,
              policy_version: PRIVACY_POLICY_VERSION,
            }
          : {}),
      })
      .eq("id", lead.id);
    if (error) return { ok: false, error: "Nu am putut salva codul. Încearcă din nou." };
  } else {
    const { error } = await service.from("leads").insert({
      email,
      name: input.name?.trim() || null,
      source: "demo-panou",
      consent_at: sentAt,
      policy_version: PRIVACY_POLICY_VERSION,
      ...patch,
    });
    if (error) return { ok: false, error: "Nu am putut salva codul. Încearcă din nou." };
  }

  const mail = demoCodeMail({ code, minutes: CODE_TTL_MINUTES, purpose: input.purpose });

  if (!mailConfigured()) {
    // Local review without Gmail credentials: the code goes to the server log so
    // the flow can be walked end to end. In production this is an error, never a
    // code shown on screen.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[demo] Cod pentru ${email}: ${code}`);
      return { ok: true, devCode: code };
    }
    return { ok: false, error: `Nu putem trimite emailuri acum. Scrie-ne la ${CONTACT_EMAIL}.` };
  }

  try {
    await sendTextMail({
      to: email,
      fromName: BRAND,
      subject: mail.subject,
      text: mail.text,
      kind: "cod",
    });
  } catch {
    return { ok: false, error: "Nu am putut trimite emailul. Verifică adresa și încearcă din nou." };
  }

  return { ok: true };
}

export type CodeCheck = { ok: true; lead: Lead } | { ok: false; error: string };

/** Checks a code against the stored hash. A wrong try costs one attempt. */
export async function checkLeadCode(
  email: string,
  code: string,
  purpose: "signup" | "reset"
): Promise<CodeCheck> {
  const clean = normalizeEmail(email);
  const lead = await findLead(clean);

  if (!lead?.code_hash || lead.code_purpose !== purpose) {
    return { ok: false, error: "Codul nu mai este valabil. Cere un cod nou." };
  }
  if (lead.code_attempts >= CODE_MAX_ATTEMPTS) {
    return { ok: false, error: "Prea multe încercări. Cere un cod nou." };
  }
  if (!lead.code_expires_at || new Date(lead.code_expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Codul a expirat. Cere un cod nou." };
  }
  if (!codeMatches(code, clean, lead.code_hash)) {
    const attempts = lead.code_attempts + 1;
    await serviceClient().from("leads").update({ code_attempts: attempts }).eq("id", lead.id);
    const left = CODE_MAX_ATTEMPTS - attempts;
    return {
      ok: false,
      error:
        left > 0
          ? `Codul nu este corect. Mai ai ${left} ${left === 1 ? "încercare" : "încercări"}.`
          : "Prea multe încercări. Cere un cod nou.",
    };
  }

  // A code that worked is spent, whatever happens next.
  await serviceClient()
    .from("leads")
    .update({ code_hash: null, code_purpose: null, code_expires_at: null, code_attempts: 0 })
    .eq("id", lead.id);

  return { ok: true, lead };
}

export async function markLeadVerified(
  leadId: string,
  data: { userId: string; sandboxTenantId: string }
): Promise<void> {
  const now = new Date().toISOString();
  await serviceClient()
    .from("leads")
    .update({
      user_id: data.userId,
      verified_at: now,
      last_seen_at: now,
      sandbox_tenant_id: data.sandboxTenantId,
    })
    .eq("id", leadId);
}

export function sandboxPanelUrl(slug: string): string {
  return `${PUBLIC_SITE_URL.replace(/\/+$/, "")}/${slug}/admin`;
}

/** Tells the owner a real person just confirmed an address. Best effort. */
export async function notifyOwnerOfLead(input: {
  name: string | null;
  email: string;
  sandboxSlug: string | null;
}): Promise<void> {
  if (!mailConfigured()) return;
  try {
    const when = new Date().toLocaleString("ro-RO", {
      timeZone: "Europe/Bucharest",
      dateStyle: "short",
      timeStyle: "short",
    });
    const mail = leadNoticeMail({
      name: input.name,
      email: input.email,
      sandboxUrl: input.sandboxSlug
        ? sandboxPanelUrl(input.sandboxSlug)
        : `${PUBLIC_SITE_URL.replace(/\/+$/, "")}/platform/lead-uri`,
      when,
    });
    await sendTextMail({
      to: CONTACT_EMAIL,
      fromName: `${BRAND} — site`,
      replyTo: input.email,
      subject: mail.subject,
      text: mail.text,
      kind: "lead",
    });
  } catch {
    // The lead is already in /platform/lead-uri; a lost notification is a nudge,
    // not a failure of the signup.
  }
}

/** Deletes everything a demo account owns: sandbox, auth user and lead row. */
export async function deleteLeadData(email: string): Promise<void> {
  if (!platformIsConfigured()) return;
  const service = serviceClient();
  const lead = await findLead(email);
  if (!lead) return;

  if (lead.sandbox_tenant_id) {
    const { data: tenant } = await service
      .from("tenants")
      .select("is_sandbox")
      .eq("id", lead.sandbox_tenant_id)
      .maybeSingle();

    // A lead that became a paying wedding is no longer a demo account: deleting
    // it here would erase a client. Only the clients list may do that.
    if (tenant?.is_sandbox !== true) return;

    await service.from("tenants").delete().eq("id", lead.sandbox_tenant_id);
  }
  if (lead.user_id) {
    await service.auth.admin.deleteUser(lead.user_id).catch(() => undefined);
  }
  await service.from("leads").delete().eq("email", normalizeEmail(email));
}
