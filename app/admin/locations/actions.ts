"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { locationSchema } from "@/lib/location-schema";

export async function saveLocation(formData: FormData) {
  const supabase = await createClient();

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) redirect("/admin/login");

  const parsed = locationSchema.safeParse({
    key: String(formData.get("key") ?? ""),
    label: String(formData.get("label") ?? ""),
    name: String(formData.get("name") ?? ""),
    address: String(formData.get("address") ?? ""),
    event_time: String(formData.get("event_time") ?? "").slice(0, 5),
    embed_url: String(formData.get("embed_url") ?? ""),
  });

  if (!parsed.success) redirect("/admin/locations?error=validation");

  const { error } = await supabase.from("locations").upsert(
    {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) redirect("/admin/locations?error=save");

  revalidatePath("/");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/locations");
  redirect("/admin/locations?saved=1");
}

/**
 * The optional note above the "Unde ne găsești" heading. Cleared text is saved as
 * NULL, so the public section renders exactly as before (no empty gap).
 */
export async function saveLocationsIntro(formData: FormData) {
  const supabase = await createClient();

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) redirect("/admin/login");

  const intro = String(formData.get("locations_intro") ?? "")
    .replace(/\r\n/g, "\n")
    .trim();

  if (intro.length > 600) redirect("/admin/locations?error=intro-length");

  const { error } = await supabase
    .from("event_settings")
    .update({ locations_intro: intro === "" ? null : intro })
    .eq("id", 1);
  if (error) {
    // Before migration v12 is applied PostgREST reports the missing column.
    const missingColumn =
      error.code === "PGRST204" || String(error.message).includes("locations_intro");
    redirect(`/admin/locations?error=${missingColumn ? "intro-migration" : "intro-save"}`);
  }

  revalidatePath("/");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/locations");
  redirect("/admin/locations?saved=intro");
}
