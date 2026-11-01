"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { clientKey } from "@/lib/client-key";
import { rsvpSchema, type RsvpInput } from "@/lib/schemas";
import type { RsvpStatus } from "@/lib/rsvp-types";

type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitRsvp(input: RsvpInput): Promise<SubmitResult> {
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields and try again." };
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
        ? "Too many attempts. Please try again later."
        : error.message.includes("rsvp closed")
          ? "The RSVP form is closed. Please contact us directly if you need to change your reply."
          : "We couldn’t save your reply. Please try again.",
    };
  }
  return { ok: true };
}

/**
 * Guests type their name and get back only their own status. Matching ignores case,
 * extra spaces and diacritics. The tables stay closed to the public: this goes through
 * a SQL function that is rate limited.
 */
export async function checkRsvpStatus(
  name: string
): Promise<{ ok: true; status: RsvpStatus | null } | { ok: false; error: string }> {
  const parsed = z.string().trim().min(3, "Enter your full name.").max(120).safeParse(name);
  if (!parsed.success) return { ok: false, error: "Enter your full name." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_rsvp_status", {
    p_name: parsed.data,
    p_ip_hash: await clientKey(),
  });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("rate limited")
        ? "Too many attempts. Please wait a few minutes and try again."
        : "We couldn’t check right now. Please try again.",
    };
  }
  return { ok: true, status: (data as RsvpStatus | null) ?? null };
}
