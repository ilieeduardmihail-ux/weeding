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
import { DEFAULT_TENANT_SLUG } from "@/lib/tenants";

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

/* ----------------------------------------------------------------- invoices */

const invoiceSchema = z.object({
  tenantId: z.string().uuid().or(z.literal("")).optional(),
  clientName: z.string().trim().min(2, "Scrie numele clientului.").max(120),
  clientEmail: emailSchema.or(z.literal("")).optional(),
  clientSlug: z.string().trim().max(60).optional(),
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data nu pare validă."),
  description: z.string().trim().min(2, "Adaugă o descriere.").max(200),
  amount: z.number().positive("Suma trebuie să fie mai mare decât 0.").max(1_000_000),
  currency: z.string().trim().min(1).max(8),
  notes: z.string().trim().max(2000).optional(),
});

/** Issues a simple payment note. There is no VAT: the amount is entered freely. */
export async function createInvoice(input: z.infer<typeof invoiceSchema>): Promise<Result> {
  if (!(await isOwnerRequest())) return { ok: false, error: "Sesiunea a expirat." };
  if (!platformIsConfigured()) return { ok: false, error: "Cheia de service nu este configurată." };

  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică datele." };
  const d = parsed.data;

  const { error } = await serviceClient().from("invoices").insert({
    tenant_id: d.tenantId || null,
    client_name: d.clientName,
    client_email: d.clientEmail || null,
    client_slug: d.clientSlug || null,
    issued_at: d.issuedAt,
    description: d.description,
    amount: d.amount,
    currency: d.currency,
    notes: d.notes || null,
  });
  if (error) return { ok: false, error: "Nu am putut salva factura. Încearcă din nou." };

  revalidatePath("/platform/facturi");
  return { ok: true };
}

const invoiceIdSchema = z.object({ id: z.string().uuid() });

export async function deleteInvoice(input: z.infer<typeof invoiceIdSchema>): Promise<Result> {
  if (!(await isOwnerRequest())) return { ok: false, error: "Sesiunea a expirat." };
  if (!platformIsConfigured()) return { ok: false, error: "Cheia de service nu este configurată." };

  const parsed = invoiceIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cerere invalidă." };

  const { error } = await serviceClient().from("invoices").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, error: "Nu am putut șterge factura." };

  revalidatePath("/platform/facturi");
  return { ok: true };
}

const invoicePaidSchema = z.object({ id: z.string().uuid(), paid: z.boolean() });

export async function setInvoicePaid(input: z.infer<typeof invoicePaidSchema>): Promise<Result> {
  if (!(await isOwnerRequest())) return { ok: false, error: "Sesiunea a expirat." };
  if (!platformIsConfigured()) return { ok: false, error: "Cheia de service nu este configurată." };

  const parsed = invoicePaidSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cerere invalidă." };

  const { error } = await serviceClient()
    .from("invoices")
    .update({
      paid: parsed.data.paid,
      paid_at: parsed.data.paid ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: "Nu am putut actualiza factura." };

  revalidatePath("/platform/facturi");
  return { ok: true };
}

const issuerSchema = z.object({
  issuerName: z.string().trim().max(160).optional(),
  issuerAddress: z.string().trim().max(300).optional(),
  issuerEmail: emailSchema.or(z.literal("")).optional(),
  issuerPhone: z.string().trim().max(40).optional(),
  issuerTaxId: z.string().trim().max(40).optional(),
  issuerBank: z.string().trim().max(120).optional(),
  issuerIban: z.string().trim().max(60).optional(),
  currency: z.string().trim().min(1).max(8).optional(),
  footerNote: z.string().trim().max(300).optional(),
});

/** Saves the issuer details printed on every invoice. Filled in whenever wanted. */
export async function saveIssuerSettings(input: z.infer<typeof issuerSchema>): Promise<Result> {
  if (!(await isOwnerRequest())) return { ok: false, error: "Sesiunea a expirat." };
  if (!platformIsConfigured()) return { ok: false, error: "Cheia de service nu este configurată." };

  const parsed = issuerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică datele." };
  const d = parsed.data;

  const { error } = await serviceClient()
    .from("platform_settings")
    .upsert(
      {
        id: 1,
        issuer_name: d.issuerName || null,
        issuer_address: d.issuerAddress || null,
        issuer_email: d.issuerEmail || null,
        issuer_phone: d.issuerPhone || null,
        issuer_tax_id: d.issuerTaxId || null,
        issuer_bank: d.issuerBank || null,
        issuer_iban: d.issuerIban || null,
        currency: d.currency || "RON",
        footer_note: d.footerNote || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (error) return { ok: false, error: "Nu am putut salva datele emitentului." };

  revalidatePath("/platform/facturi");
  return { ok: true };
}

/* ------------------------------------------------------------------ helpers */

type Service = ReturnType<typeof serviceClient>;

const deleteSchema = z.object({
  tenantId: z.string().uuid(),
  confirmSlug: z.string().trim(),
});

/**
 * Removes a client for good: the wedding row (every tenant-scoped table
 * cascades), its invitation photo, its access keys and the auth accounts that
 * belonged only to it. Accounts shared with another wedding, or owners, are
 * kept. The wedding served at the domain root is never deletable.
 */
export async function deleteTenant(input: z.infer<typeof deleteSchema>): Promise<Result> {
  if (!(await isOwnerRequest())) return { ok: false, error: "Sesiunea a expirat." };
  if (!platformIsConfigured()) return { ok: false, error: "Cheia de service nu este configurată." };

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cerere invalidă." };

  const service = serviceClient();
  const { data: tenant } = await service
    .from("tenants")
    .select("id, slug")
    .eq("id", parsed.data.tenantId)
    .maybeSingle();
  if (!tenant) return { ok: false, error: "Clientul nu există." };

  // The root wedding keeps every link already sent to guests working.
  if (tenant.slug === DEFAULT_TENANT_SLUG) {
    return { ok: false, error: "Nunta de la rădăcina domeniului nu poate fi ștearsă." };
  }
  if (parsed.data.confirmSlug.toLowerCase() !== tenant.slug) {
    return { ok: false, error: `Scrie adresa clientului (${tenant.slug}) pentru a confirma.` };
  }

  // Read what must survive the cascade: admins and the invitation photo.
  const [adminsResult, settingsResult] = await Promise.all([
    service.from("tenant_admins").select("email").eq("tenant_id", tenant.id),
    service.from("event_settings").select("invitation_image_url").eq("tenant_id", tenant.id).maybeSingle(),
  ]);
  const emails = [
    ...new Set(
      ((adminsResult.data ?? []) as { email: string | null }[])
        .map((row) => row.email?.toLowerCase())
        .filter((email): email is string => Boolean(email))
    ),
  ];
  const photoPath = storagePathFromUrl(settingsResult.data?.invitation_image_url ?? null);

  // The wedding and everything scoped to it disappear in one statement.
  const { error } = await service.from("tenants").delete().eq("id", tenant.id);
  if (error) return { ok: false, error: "Nu am putut șterge clientul. Încearcă din nou." };

  // Best-effort cleanup: the client is already gone, so failures here are only
  // logged by the platform, never surfaced as a failed deletion.
  if (photoPath) await service.storage.from("invitation").remove([photoPath]);
  await deleteOrphanAccounts(service, emails);

  revalidatePath("/platform");
  revalidatePath("/");
  return { ok: true };
}

/** The object path inside the `invitation` bucket, or null for data URLs. */
function storagePathFromUrl(url: string | null): string | null {
  if (!url || !url.startsWith("http")) return null;
  const marker = "/storage/v1/object/";
  const at = url.indexOf(marker);
  if (at === -1) return null;

  const parts = url.slice(at + marker.length).split("/");
  const bucketIndex = parts[0] === "public" || parts[0] === "sign" ? 1 : 0;
  if (parts[bucketIndex] !== "invitation") return null;

  const path = parts.slice(bucketIndex + 1).join("/").split("?")[0];
  return path ? decodeURIComponent(path) : null;
}

/**
 * Deletes the auth accounts whose only wedding was just removed. An email that
 * still administers another wedding, or belongs to a platform owner, keeps its
 * account. The admin API has no lookup by email, so we page through the users.
 */
async function deleteOrphanAccounts(service: Service, emails: string[]) {
  if (emails.length === 0) return;

  const [adminsResult, ownersResult] = await Promise.all([
    service.from("tenant_admins").select("email"),
    service.from("platform_owners").select("email"),
  ]);
  const keep = new Set(
    [...(adminsResult.data ?? []), ...(ownersResult.data ?? [])]
      .map((row) => String((row as { email: string | null }).email ?? "").toLowerCase())
      .filter(Boolean)
  );

  const wanted = new Set(emails.filter((email) => !keep.has(email)));
  if (wanted.size === 0) return;

  const found = new Set<string>();
  const ids: string[] = [];
  const perPage = 200;
  // Bounded: 50 pages × 200 is far beyond any realistic account count.
  for (let page = 1; page <= 50 && found.size < wanted.size; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    const users = data?.users ?? [];
    if (error || users.length === 0) break;
    for (const user of users) {
      const email = user.email?.toLowerCase();
      if (email && wanted.has(email) && !found.has(email)) {
        found.add(email);
        ids.push(user.id);
      }
    }
    if (users.length < perPage) break;
  }

  await Promise.all(ids.map((id) => service.auth.admin.deleteUser(id)));
}

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