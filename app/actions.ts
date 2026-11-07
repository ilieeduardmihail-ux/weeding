"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { clientKey } from "@/lib/client-key";
import { rsvpSchema, type RsvpInput } from "@/lib/schemas";
import type { RsvpStatus } from "@/lib/rsvp-types";

type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitRsvp(input: RsvpInput): Promise<SubmitResult> {
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Verifică câmpurile marcate și încearcă din nou." };
  const d = parsed.data;

  if (d.website) return { ok: true }; // honeypot filled: pretend it worked, save nothing

  const attending = d.attending === "yes";
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_rsvp", {
    p_name: d.name,
    p_attending: attending,
    p_message: d.message ?? "",
    p_guests: attending ? d.guests : [],
    p_ip_hash: await clientKey(),
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
  name: string
): Promise<{ ok: true; status: RsvpStatus | null } | { ok: false; error: string }> {
  const parsed = z.string().trim().min(3, "Introdu numele complet.").max(120).safeParse(name);
  if (!parsed.success) return { ok: false, error: "Introdu numele complet." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_rsvp_status", {
    p_name: parsed.data,
    p_ip_hash: await clientKey(),
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
