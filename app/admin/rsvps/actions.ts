"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminRsvpSchema, type AdminRsvpInput } from "@/lib/admin-rsvp-schema";

export type UpdateRsvpResult = { ok: true } | { ok: false; error: string };

export async function updateRsvp(input: AdminRsvpInput): Promise<UpdateRsvpResult> {
  const parsed = adminRsvpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Verifică numele, mesajul și însoțitorii, apoi încearcă din nou." };
  }

  const d = parsed.data;
  const supabase = await createClient();

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };
  }

  const attending = d.attending === "yes";
  const { error } = await supabase.rpc("admin_update_rsvp", {
    p_id: d.id,
    p_name: d.name,
    p_attending: attending,
    p_message: d.message ?? "",
    p_guests: attending
      ? d.guests.map((g) => ({ id: g.guestId === "" ? null : g.guestId, name: g.name, isChild: g.isChild }))
      : [],
  });

  if (error) {
    return {
      ok: false,
      error: error.message.includes("admin_update_rsvp")
        ? "Editarea nu este încă activă în baza de date. Rulează migrarea v7 în Supabase."
        : "Nu am putut salva modificările. Încearcă din nou.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/rsvps/${d.id}/edit`);
  return { ok: true };
}
