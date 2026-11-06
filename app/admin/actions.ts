"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect("/admin/login?error=1");

  // Valid Supabase account but not one of the couple: sign straight back out
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=1"); // same message, so nobody learns which accounts exist
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export type DeleteRsvpResult = { ok: true } | { ok: false; error: string };

/**
 * Deletes a response without revalidating the page: the list removes the row
 * optimistically and the live subscription refreshes it in the background.
 */
export async function deleteRsvp(id: string): Promise<DeleteRsvpResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Cerere invalidă." };

  const supabase = await createClient();
  const { error } = await supabase.from("rsvps").delete().eq("id", id); // RLS: admins only
  if (error) return { ok: false, error: "Nu am putut șterge răspunsul. Încearcă din nou." };
  return { ok: true };
}
