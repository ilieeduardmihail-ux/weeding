"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { demoMode } from "@/lib/demo/mode";
import { adminBasePath, currentTenantId } from "@/lib/tenant-session";

type Result = { ok: true } | { ok: false; error: string };
type UploadResult = { ok: true; url: string } | { ok: false; error: string };

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
  const tenantId = await currentTenantId();
  if (!tenantId) {
    return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };
  }

  const { error } = await supabase
    .from("event_settings")
    .update({ invite_message: parsed.data })
    .eq("tenant_id", tenantId);
  if (error) {
    return { ok: false, error: "Nu am putut salva mesajul. Rulează migrarea v10 în Supabase." };
  }

  revalidatePath(await adminBasePath(), "layout");
  return { ok: true };
}

/* ------------------------------------------------------------ invitation photo */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Deletes the previous object so the bucket never piles up old photos. */
async function removeStoredPhoto(supabase: Awaited<ReturnType<typeof createClient>>, url: string) {
  const marker = "/storage/v1/object/public/invitation/";
  const at = url.indexOf(marker);
  if (at === -1) return;
  const path = decodeURIComponent(url.slice(at + marker.length).split("?")[0] ?? "");
  if (!path) return;
  try {
    await supabase.storage.from("invitation").remove([path]);
  } catch {
    // Best effort: the new photo is already saved, an orphan file is harmless.
  }
}

/** Uploads the invitation photo shown in the WhatsApp preview and share sheet. */
export async function uploadInvitationImage(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Alege o poză cu invitația." };
  }
  if (!IMAGE_TYPES[file.type]) {
    return { ok: false, error: "Poza trebuie să fie JPG, PNG sau WebP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Poza e prea mare. Alege una sub 8 MB." };
  }

  const supabase = await createClient();
  const tenantId = await currentTenantId();
  if (!tenantId) {
    return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };
  }

  const extension = IMAGE_TYPES[file.type];

  // Demo mode has no storage bucket: keep the photo in memory as a data URL.
  if (demoMode) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = `data:${file.type};base64,${buffer.toString("base64")}`;
    const { error } = await supabase
      .from("event_settings")
      .update({ invitation_image_url: url })
      .eq("tenant_id", tenantId);
    if (error) return { ok: false, error: "Nu am putut salva poza în demo." };
    revalidatePath("/");
    revalidatePath(await adminBasePath(), "layout");
    return { ok: true, url };
  }

  const { data: current } = await supabase
    .from("event_settings")
    .select("invitation_image_url")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const path = `invitation-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("invitation")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (uploadError) {
    return { ok: false, error: "Nu am putut încărca poza. Rulează migrarea v11 în Supabase." };
  }

  const { data: published } = supabase.storage.from("invitation").getPublicUrl(path);
  const url: string | undefined = published?.publicUrl;
  if (!url) return { ok: false, error: "Nu am putut obține linkul pozei." };

  const { error } = await supabase
    .from("event_settings")
    .update({ invitation_image_url: url })
    .eq("tenant_id", tenantId);
  if (error) {
    return { ok: false, error: "Poza a urcat, dar nu am putut salva linkul. Rulează migrarea v11." };
  }

  const previous = current?.invitation_image_url;
  if (typeof previous === "string" && previous !== url) await removeStoredPhoto(supabase, previous);

  revalidatePath("/");
  revalidatePath(await adminBasePath(), "layout");
  return { ok: true, url };
}

/** Removes the uploaded photo and clears the public link. */
export async function removeInvitationImage(): Promise<Result> {
  const supabase = await createClient();
  const tenantId = await currentTenantId();
  if (!tenantId) {
    return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };
  }

  const { data: current } = await supabase
    .from("event_settings")
    .select("invitation_image_url")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const { error } = await supabase
    .from("event_settings")
    .update({ invitation_image_url: null })
    .eq("tenant_id", tenantId);
  if (error) {
    return { ok: false, error: "Nu am putut șterge poza. Rulează migrarea v11 în Supabase." };
  }

  const previous = current?.invitation_image_url;
  if (!demoMode && typeof previous === "string") await removeStoredPhoto(supabase, previous);

  revalidatePath("/");
  revalidatePath(await adminBasePath(), "layout");
  return { ok: true };
}
