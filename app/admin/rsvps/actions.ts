"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminRsvpSchema, type AdminRsvpInput } from "@/lib/admin-rsvp-schema";
import { adminBasePath, currentTenantId } from "@/lib/tenant-session";

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
  const tenantId = await currentTenantId();
  if (!tenantId) {
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
    p_tenant: tenantId,
  });

  if (error) {
    return {
      ok: false,
      error: error.message.includes("admin_update_rsvp")
        ? "Editarea nu este încă activă în baza de date. Rulează migrarea v7 în Supabase."
        : "Nu am putut salva modificările. Încearcă din nou.",
    };
  }

  // Allergies are a new column, outside the older RPC signature.
  const { error: allergyError } = await supabase
    .from("rsvps")
    .update({ allergies: d.allergies?.trim() ? d.allergies.trim() : null })
    .eq("id", d.id)
    .eq("tenant_id", tenantId);
  if (allergyError) {
    return { ok: false, error: "Modificările au fost salvate, dar alergiile nu. Încearcă din nou." };
  }

  const base = await adminBasePath();
  revalidatePath("/");
  revalidatePath(base, "layout");
  revalidatePath(base);
  revalidatePath(`${base}/rsvps/${d.id}/edit`);
  return { ok: true };
}

export type QuickResult = { ok: true } | { ok: false; error: string };

/**
 * Quick actions used by the Confirmări list. They only touch one column, so the
 * list can paint the change immediately and reconcile in the background.
 */
export async function setRsvpAttending(id: string, attending: boolean): Promise<QuickResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Cerere invalidă." };
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("rsvps")
    .update({ attending })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) return { ok: false, error: "Nu am putut salva prezența. Încearcă din nou." };
  return { ok: true };
}

/** Switches one person between the standard menu and the children's menu. */
export async function setGuestChild(id: string, isChild: boolean): Promise<QuickResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Cerere invalidă." };
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("rsvp_guests")
    .update({ is_child: isChild })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) return { ok: false, error: "Nu am putut schimba meniul. Încearcă din nou." };
  return { ok: true };
}
