"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  generateAccessKey,
  hashAccessKey,
  isOwnerRequest,
  normalizeSlug,
  platformIsConfigured,
  serviceClient,
  slugProblem,
} from "@/lib/platform";

export type Result = { ok: true } | { ok: false; error: string };
export type KeyResult = { ok: true; code: string } | { ok: false; error: string };

const emailSchema = z.string().trim().toLowerCase().email("Adresa de email nu pare validă.");

/* --------------------------------------------------------------------- auth */

export async function signInOwner(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect("/platform/login?error=1");

  const { data: isOwner } = await supabase.rpc("is_platform_owner");
  if (isOwner !== true) {
    await supabase.auth.signOut();
    redirect("/platform/login?error=1");
  }
  redirect("/platform");
}

export async function signOutOwner() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/platform/login");
}

/* ------------------------------------------------------------------ tenants */

const createTenantSchema = z.object({
  slug: z.string().trim().min(2).max(60),
  displayName: z.string().trim().min(1).max(120),
  partner1: z.string().trim().max(80).optional(),
  partner2: z.string().trim().max(80).optional(),
  contactEmail: z.union([z.literal(""), emailSchema]),
});

export async function createTenant(input: z.infer<typeof createTenantSchema>): Promise<Result> {
  if (!(await isOwnerRequest())) return { ok: false, error: "Sesiunea a expirat." };
  if (!platformIsConfigured()) return { ok: false, error: "Cheia de service nu este configurată." };

  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică datele." };
  const data = parsed.data;

  const slug = normalizeSlug(data.slug);
  const problem = slugProblem(slug);
  if (problem) return { ok: false, error: problem };

  const service = serviceClient();

  const { data: existing } = await service.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (existing) return { ok: false, error: "Există deja un client cu această adresă." };

  const { data: tenant, error } = await service
    .from("tenants")
    .insert({ slug, display_name: data.displayName, status: "pending" })
    .select("id")
    .single();
  if (error || !tenant) return { ok: false, error: "Nu am putut crea clientul. Încearcă din nou." };

  const { error: settingsError } = await service.from("event_settings").insert({
    tenant_id: tenant.id,
    partner_1: data.partner1 || "Mire",
    partner_2: data.partner2 || "Mireasă",
    city: "București",
    timezone: "Europe/Bucharest",
    contact_email: data.contactEmail || null,
  });
  if (settingsError) {
    await service.from("tenants").delete().eq("id", tenant.id);
    return { ok: false, error: "Nu am putut crea setările clientului." };
  }

  // The seating board expects tables to exist; start with ten of ten seats.
  await service.from("seating_tables").insert(
    Array.from({ length: 10 }, (_, i) => ({ tenant_id: tenant.id, number: i + 1, capacity: 10 }))
  );

  revalidatePath("/platform");
  return { ok: true };
}

const keySchema = z.object({
  tenantId: z.string().uuid(),
  durationDays: z.number().int().min(1).max(3650),
  label: z.string().trim().max(120).optional(),
});

export async function generateKey(input: z.infer<typeof keySchema>): Promise<KeyResult> {
  if (!(await isOwnerRequest())) return { ok: false, error: "Sesiunea a expirat." };
  if (!platformIsConfigured()) return { ok: false, error: "Cheia de service nu este configurată." };

  const parsed = keySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Durata trebuie să fie între 1 și 3650 de zile." };

  const code = generateAccessKey();
  const service = serviceClient();
  const { error } = await service.from("access_keys").insert({
    tenant_id: parsed.data.tenantId,
    duration_days: parsed.data.durationDays,
    label: parsed.data.label || null,
    code_hash: hashAccessKey(code),
  });
  if (error) return { ok: false, error: "Nu am putut genera cheia." };

  revalidatePath("/platform");
  return { ok: true, code };
}

const adminSchema = z.object({
  tenantId: z.string().uuid(),
  email: emailSchema,
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere.").max(72),
  durationDays: z.number().int().min(1).max(3650),
});

/** Creates an account directly, without an access key, and activates the site. */
export async function createAdminAccount(input: z.infer<typeof adminSchema>): Promise<Result> {
  if (!(await isOwnerRequest())) return { ok: false, error: "Sesiunea a expirat." };
  if (!platformIsConfigured()) return { ok: false, error: "Cheia de service nu este configurată." };

  const parsed = adminSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică datele." };
  const data = parsed.data;

  const service = serviceClient();
  const { error: createError } = await service.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { must_change_password: false },
  });
  if (createError) {
    return {
      ok: false,
      error: createError.message.includes("already")
        ? "Există deja un cont cu acest email."
        : "Nu am putut crea contul. Încearcă din nou.",
    };
  }

  const { error: linkError } = await service
    .from("tenant_admins")
    .insert({ tenant_id: data.tenantId, email: data.email });
  if (linkError) return { ok: false, error: "Contul a fost creat, dar nu a putut fi legat de nuntă." };

  await activateTenant(data.tenantId, data.durationDays, service);
  revalidatePath("/platform");
  return { ok: true };
}

const renewSchema = z.object({ tenantId: z.string().uuid(), days: z.number().int().min(1).max(3650) });

export async function renewTenant(input: z.infer<typeof renewSchema>): Promise<Result> {
  if (!(await isOwnerRequest())) return { ok: false, error: "Sesiunea a expirat." };
  if (!platformIsConfigured()) return { ok: false, error: "Cheia de service nu este configurată." };

  const parsed = renewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Durata trebuie să fie între 1 și 3650 de zile." };

  const service = serviceClient();
  const { data: tenant } = await service
    .from("tenants")
    .select("expires_at")
    .eq("id", parsed.data.tenantId)
    .maybeSingle();
  if (!tenant) return { ok: false, error: "Clientul nu există." };

  const now = Date.now();
  const from = tenant.expires_at ? Math.max(now, new Date(tenant.expires_at).getTime()) : now;
  const expires = new Date(from + parsed.data.days * 86_400_000).toISOString();

  const { error } = await service
    .from("tenants")
    .update({ status: "active", expires_at: expires, activated_at: new Date(now).toISOString() })
    .eq("id", parsed.data.tenantId);
  if (error) return { ok: false, error: "Nu am putut prelungi accesul." };

  revalidatePath("/platform");
  return { ok: true };
}

const statusSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
});

export async function setTenantStatus(input: z.infer<typeof statusSchema>): Promise<Result> {
  if (!(await isOwnerRequest())) return { ok: false, error: "Sesiunea a expirat." };
  if (!platformIsConfigured()) return { ok: false, error: "Cheia de service nu este configurată." };

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cerere invalidă." };

  const service = serviceClient();
  const { error } = await service
    .from("tenants")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.tenantId);
  if (error) return { ok: false, error: "Nu am putut schimba starea." };

  revalidatePath("/platform");
  revalidatePath("/");
  return { ok: true };
}

/* ------------------------------------------------------------------ helpers */

async function activateTenant(
  tenantId: string,
  days: number,
  service: ReturnType<typeof serviceClient>
) {
  const { data: tenant } = await service
    .from("tenants")
    .select("activated_at, expires_at")
    .eq("id", tenantId)
    .maybeSingle();

  const now = Date.now();
  const from = tenant?.expires_at ? Math.max(now, new Date(tenant.expires_at).getTime()) : now;
  await service
    .from("tenants")
    .update({
      status: "active",
      activated_at: tenant?.activated_at ?? new Date(now).toISOString(),
      expires_at: new Date(from + days * 86_400_000).toISOString(),
    })
    .eq("id", tenantId);
}