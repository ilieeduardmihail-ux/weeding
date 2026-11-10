"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isPhoneLike } from "@/lib/message-template";

type Result = { ok: true } | { ok: false; error: string };

const messageSchema = z
  .string()
  .trim()
  .min(10, "Mesajul este prea scurt.")
  .max(2000, "Mesajul este prea lung.");

export async function saveInviteMessage(body: string): Promise<Result> {
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică mesajul." };
  }

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };
  }

  const { error } = await supabase
    .from("event_settings")
    .update({ invite_message: parsed.data })
    .eq("id", 1);
  if (error) {
    return { ok: false, error: "Nu am putut salva mesajul. Rulează migrarea v10 în Supabase." };
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}

const phoneEntrySchema = z.object({
  kind: z.enum(["rsvp", "guest"]),
  id: z.string().uuid(),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine(isPhoneLike, "Numărul de telefon nu pare valid."),
});

export type PhoneEntry = z.infer<typeof phoneEntrySchema>;

const phonesSchema = z.array(phoneEntrySchema).min(1).max(500);

/** Saves the phone numbers the couple typed for the selected guests. */
export async function savePhones(entries: PhoneEntry[]): Promise<Result> {
  const parsed = phonesSchema.safeParse(entries);
  if (!parsed.success) {
    return { ok: false, error: "Unele numere de telefon nu par valide. Include prefixul țării." };
  }

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };
  }

  for (const entry of parsed.data) {
    const table = entry.kind === "rsvp" ? "rsvps" : "guests";
    const { error } = await supabase
      .from(table)
      .update({ phone: entry.phone === "" ? null : entry.phone })
      .eq("id", entry.id);
    if (error) {
      return { ok: false, error: "Nu am putut salva telefoanele. Rulează migrarea v10 în Supabase." };
    }
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}
