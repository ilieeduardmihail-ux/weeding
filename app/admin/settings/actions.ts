"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { eventSettingsSchema } from "@/lib/event-settings";
import { currentTenantId } from "@/lib/tenant-session";

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();

  const tenantId = await currentTenantId();
  if (!tenantId) redirect("/admin/login");

  const parsed = eventSettingsSchema.safeParse({
    partner_1: String(formData.get("partner_1") ?? ""),
    partner_2: String(formData.get("partner_2") ?? ""),
    event_date: String(formData.get("event_date") ?? ""),
    event_time: String(formData.get("event_time") ?? "").slice(0, 5),
    city: String(formData.get("city") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    contact_email: String(formData.get("contact_email") ?? ""),
    rsvp_cutoff_date: String(formData.get("rsvp_cutoff_date") ?? ""),
    seating_published: formData.get("seating_published") === "on",
    public_url: String(formData.get("public_url") ?? ""),
  });

  if (!parsed.success) redirect("/admin/settings?error=validation");

  const { error } = await supabase.from("event_settings").update(parsed.data).eq("tenant_id", tenantId);
  if (error) redirect("/admin/settings?error=save");

  revalidatePath("/");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
