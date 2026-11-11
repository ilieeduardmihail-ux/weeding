"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { demoMode } from "@/lib/demo/mode";
import { PUBLIC_SITE_URL } from "@/lib/message-template";

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

/* ------------------------------------------------------------ new password */

export type PasswordEmailResult = { ok: true; email: string } | { ok: false; error: string };

/** Sends the "choose your own password" email to the signed-in admin. */
export async function sendPasswordResetEmail(): Promise<PasswordEmailResult> {
  if (demoMode) {
    return { ok: false, error: "Emailul de schimbare a parolei merge doar pe site-ul real." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou." };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${PUBLIC_SITE_URL}/auth/confirm?next=${encodeURIComponent("/admin/parola-noua")}`,
  });
  if (error) {
    return { ok: false, error: "Nu am putut trimite emailul. Încearcă din nou peste câteva minute." };
  }
  return { ok: true, email };
}

export type NewPasswordState = { error?: string };

/** Called from the emailed link, after /auth/confirm established the session. */
export async function updatePassword(
  _previous: NewPasswordState,
  formData: FormData,
): Promise<NewPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "Parola trebuie să aibă cel puțin 8 caractere." };
  }
  if (password !== confirm) return { error: "Parolele nu coincid." };
  if (demoMode) {
    return { error: "Schimbarea parolei merge doar pe site-ul real." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { error: "Sesiunea a expirat. Cere un link nou din admin." };
  }

  // Clearing the flag in the same call also stops the first-login notice.
  const { error } = await supabase.auth.updateUser({
    password,
    data: { must_change_password: false },
  });
  if (error) {
    return { error: "Nu am putut salva parola. Linkul poate fi expirat — cere unul nou." };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
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
  revalidatePath("/admin", "layout");
  return { ok: true };
}
