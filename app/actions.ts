"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/platform";
import { demoMode } from "@/lib/demo/mode";
import { clientKey } from "@/lib/client-key";
import { readTenantToken } from "@/lib/tenant-token";
import { rsvpSchema, type RsvpInput } from "@/lib/schemas";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";
import type { RsvpStatus } from "@/lib/rsvp-types";

type SubmitResult = { ok: true } | { ok: false; error: string };

const UNAVAILABLE = "Invitația nu este disponibilă.";

/**
 * These two calls run with the service role instead of the public key.
 *
 * `submit_rsvp` and `check_rsvp_status` are no longer executable by `anon` in the
 * database, so this is the only way in. That matters for spam: the IP hash used
 * for rate limiting is computed here, on the server, from the request headers.
 * While the functions were public, anyone could call PostgREST directly with a
 * made-up `p_ip_hash` and skip the limit entirely.
 */
async function publicClient() {
  if (demoMode) return createClient();
  try {
    return serviceClient();
  } catch {
    return null;
  }
}

export async function submitRsvp(input: RsvpInput, token: string): Promise<SubmitResult> {
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Verifică câmpurile marcate și încearcă din nou." };
  const d = parsed.data;

  if (d.website) return { ok: true }; // honeypot filled: pretend it worked, save nothing
  // Time trap: dropped as silently as the honeypot. A real person needs far
  // more than 2.5s to pick attendance and type names.
  if (d.elapsedMs !== undefined && d.elapsedMs < 2500) return { ok: true };
  // Consent is required to store the reply at all (GDPR). The form sends the
  // checkbox value; older cached pages that omit it are refused, not stored.
  if (d.consent !== true) {
    return { ok: false, error: "Bifează acordul pentru prelucrarea datelor ca să trimitem răspunsul." };
  }

  // The wedding comes from a token this server signed, never from the request.
  const tenantId = readTenantToken(token);
  if (!tenantId) return { ok: false, error: UNAVAILABLE };

  const supabase = await publicClient();
  if (!supabase) return { ok: false, error: UNAVAILABLE };

  const attending = d.attending === "yes";
  const { error } = await supabase.rpc("submit_rsvp", {
    p_name: d.name,
    p_attending: attending,
    p_message: d.message ?? "",
    p_guests: attending ? d.guests : [],
    p_ip_hash: await clientKey(),
    p_tenant: tenantId,
    p_consent_at: new Date().toISOString(),
    p_policy_version: PRIVACY_POLICY_VERSION,
  });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("rate limited")
        ? "Prea multe încercări. Te rugăm să revii mai târziu."
        : error.message.includes("rsvp closed")
          ? "Formularul de confirmare este închis. Scrie-ne direct dacă vrei să modifici ceva."
          : "Nu am putut salva răspunsul. Te rugăm să încerci din nou.",
    };
  }
  return { ok: true };
}

/**
 * Guests type their name and get back only their own status. Matching ignores case,
 * extra spaces and diacritics. Table assignments are stripped here, so they can
 * never reach the guest view even if the SQL function still returns them.
 */
export async function checkRsvpStatus(
  name: string,
  token: string
): Promise<{ ok: true; status: RsvpStatus | null } | { ok: false; error: string }> {
  const parsed = z.string().trim().min(3, "Introdu numele complet.").max(120).safeParse(name);
  if (!parsed.success) return { ok: false, error: "Introdu numele complet." };

  const tenantId = readTenantToken(token);
  if (!tenantId) return { ok: false, error: UNAVAILABLE };

  const supabase = await publicClient();
  if (!supabase) return { ok: false, error: UNAVAILABLE };

  const { data, error } = await supabase.rpc("check_rsvp_status", {
    p_name: parsed.data,
    p_ip_hash: await clientKey(),
    p_tenant: tenantId,
  });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("rate limited")
        ? "Prea multe încercări. Așteaptă câteva minute și încearcă din nou."
        : "Nu am putut verifica acum. Te rugăm să încerci din nou.",
    };
  }

  const raw = data as {
    name: string;
    attending: boolean;
    booked_by?: string | null;
    party?: { name: string }[] | null;
  } | null;
  if (!raw) return { ok: true, status: null };

  return {
    ok: true,
    status: {
      name: raw.name,
      attending: raw.attending,
      booked_by: raw.booked_by ?? null,
      party: (raw.party ?? []).map((p) => ({ name: p.name })),
    },
  };
}
