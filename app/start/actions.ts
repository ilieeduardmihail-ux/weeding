"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hashAccessKey, platformIsConfigured, serviceClient } from "@/lib/platform";

export type ActivateResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  key: z.string().trim().min(6, "Introdu cheia primită.").max(64),
  email: z.string().trim().toLowerCase().email("Adresa de email nu pare validă."),
  password: z
    .string()
    .min(8, "Parola trebuie să aibă cel puțin 8 caractere.")
    .max(72, "Parola este prea lungă."),
});

type ServiceClient = ReturnType<typeof serviceClient>;

/**
 * Redeems an access key: creates the account, links it to the key's wedding,
 * starts the validity period and signs the client straight into the panel.
 */
export async function activateAccount(input: z.infer<typeof schema>): Promise<ActivateResult> {
  if (!platformIsConfigured()) {
    return { ok: false, error: "Activarea nu este disponibilă momentan. Încearcă mai târziu." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică datele introduse." };
  }
  const { email, password } = parsed.data;

  const service = serviceClient();
  const codeHash = hashAccessKey(parsed.data.key);

  const { data: key } = await service
    .from("access_keys")
    .select("id, tenant_id, duration_days, used_at, revoked_at")
    .eq("code_hash", codeHash)
    .maybeSingle();

  if (!key || key.used_at || key.revoked_at) {
    return { ok: false, error: "Cheia nu este validă sau a fost deja folosită." };
  }

  // Claim first, conditionally: two people racing on the same key cannot both win.
  const { data: claimed } = await service
    .from("access_keys")
    .update({ used_at: new Date().toISOString(), used_by_email: email })
    .eq("id", key.id)
    .is("used_at", null)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (!claimed) return { ok: false, error: "Cheia tocmai a fost folosită. Cere una nouă." };

  const { error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { must_change_password: false },
  });

  if (createError) {
    // Give the key back so a typo does not burn it.
    await service.from("access_keys").update({ used_at: null, used_by_email: null }).eq("id", key.id);
    return {
      ok: false,
      error: createError.message.includes("already")
        ? "Există deja un cont cu acest email. Intră în admin sau folosește alt email."
        : "Nu am putut crea contul. Încearcă din nou.",
    };
  }

  const { error: linkError } = await service
    .from("tenant_admins")
    .insert({ tenant_id: key.tenant_id, email });

  // A duplicate membership is fine (the account already administers this wedding).
  if (linkError && !linkError.message.includes("duplicate")) {
    return { ok: false, error: "Contul a fost creat, dar nu a putut fi legat de nuntă. Contactează-ne." };
  }

  await activateFromKey(key.tenant_id, key.duration_days, service);

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });
  redirect("/admin");
}

/** Starts (or extends) the validity window from the moment of activation. */
async function activateFromKey(tenantId: string, days: number, service: ServiceClient) {
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
