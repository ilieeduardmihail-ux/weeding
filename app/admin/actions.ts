"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminBasePath } from "@/lib/tenant-session";
import { demoMode } from "@/lib/demo/mode";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const base = await adminBasePath();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect(`${base}/login?error=1`);

  // Valid Supabase account but not one of the couple: sign straight back out
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    redirect(`${base}/login?error=1`); // same message, so nobody learns which accounts exist
  }
  // Back to where the middleware caught them, or to the resolver (which
  // forwards to the signed-in account's own /<slug>/admin panel).
  redirect(safeAdminPath(formData.get("redirect")) ?? "/admin");
}

/**
 * Only a same-origin admin path is accepted, so a crafted `?redirect=` link can
 * never bounce the person to another site or into a non-admin area.
 */
function safeAdminPath(value: FormDataEntryValue | null): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  // A client panel (/<slug>/admin/...) or the legacy /admin resolver.
  if (raw === "/admin" || raw.startsWith("/admin/")) return raw;
  if (/^\/[^/]+\/admin(\/|$)/.test(raw)) return raw;
  return null;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`${await adminBasePath()}/login`);
}

/* ------------------------------------------------------------ new password */

export type PasswordState = { error?: string; ok?: boolean };

/**
 * First-login flow: accounts created with a generated password pick their own
 * password here. Clearing the flag in the same call also stops the notice from
 * showing up again after the next refresh.
 */
export async function setInitialPassword(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "Parola trebuie să aibă cel puțin 8 caractere." };
  }
  if (password !== confirm) return { error: "Parolele nu coincid." };
  if (demoMode) return { error: "Schimbarea parolei merge doar pe site-ul real." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Sesiunea a expirat. Autentifică-te din nou." };

  const { error } = await supabase.auth.updateUser({
    password,
    data: { must_change_password: false },
  });
  if (error) return { error: "Nu am putut salva parola. Încearcă din nou." };

  // No revalidatePath here: the notice shows a confirmation first and refreshes
  // the layout itself when the owner closes it.
  return { ok: true };
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
  revalidatePath(await adminBasePath(), "layout");
  return { ok: true };
}
