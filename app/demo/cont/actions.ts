"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { clientKey } from "@/lib/client-key";
import { createSandboxFor } from "@/lib/demo/sandbox";
import {
  checkLeadCode,
  deleteLeadData,
  markLeadVerified,
  normalizeEmail,
  notifyOwnerOfLead,
  startLeadCode,
} from "@/lib/leads";
import { platformIsConfigured, serviceClient } from "@/lib/platform";

/* ------------------------------------------------------------------ throttle */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, { count: number; resetAt: number }>();

function allowed(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    if (hits.size > 5000) {
      for (const [stale, value] of hits) if (now > value.resetAt) hits.delete(stale);
    }
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

/* -------------------------------------------------------------------- signup */

const signupSchema = z.object({
  name: z.string().trim().min(2, "Scrie numele tău.").max(80, "Numele este prea lung."),
  email: z.string().trim().toLowerCase().email("Adresa de email nu pare validă."),
  password: z
    .string()
    .min(8, "Parola trebuie să aibă cel puțin 8 caractere.")
    .max(72, "Parola este prea lungă."),
  consent: z.boolean().refine((value) => value === true, {
    message: "Bifează acordul pentru prelucrarea datelor.",
  }),
  /** Separate opt-in for an offer; not required for the demo account. */
  marketing: z.boolean().optional(),
  /** Honeypot: a person never sees this field. */
  website: z.string().optional(),
});

export type SignupResult = { ok: true; email: string; devCode?: string } | { ok: false; error: string };

/** Step 1: save the code against the address and email it. */
export async function startDemoSignup(input: z.infer<typeof signupSchema>): Promise<SignupResult> {
  if (!platformIsConfigured()) {
    return { ok: false, error: "Conturile demo nu sunt disponibile acum. Scrie-ne pe email." };
  }

  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică datele introduse." };
  }
  // A bot filled the invisible field: answer as if it worked, send nothing.
  if (parsed.data.website) return { ok: true, email: parsed.data.email };

  if (!allowed(await clientKey())) {
    return { ok: false, error: "Prea multe cereri de pe această conexiune. Încearcă peste câteva minute." };
  }

  const result = await startLeadCode({
    name: parsed.data.name,
    email: parsed.data.email,
    purpose: "signup",
    marketing: parsed.data.marketing === true,
  });
  if (!result.ok) return result;
  return { ok: true, email: parsed.data.email, devCode: result.devCode };
}

/** «Trimite din nou» — same path, without the name. */
export async function resendDemoCode(email: string): Promise<SignupResult> {
  if (!platformIsConfigured()) return { ok: false, error: "Conturile demo nu sunt disponibile acum." };
  if (!z.string().email().safeParse(email).success) {
    return { ok: false, error: "Adresa de email nu pare validă." };
  }
  if (!allowed(await clientKey())) {
    return { ok: false, error: "Prea multe cereri. Încearcă peste câteva minute." };
  }

  const result = await startLeadCode({ email, purpose: "signup" });
  if (!result.ok) return result;
  return { ok: true, email: normalizeEmail(email), devCode: result.devCode };
}

const confirmSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresa de email nu pare validă."),
  code: z.string().trim().regex(/^\d{6}$/, "Codul are exact 6 cifre."),
  password: z
    .string()
    .min(8, "Parola trebuie să aibă cel puțin 8 caractere.")
    .max(72, "Parola este prea lungă."),
});

export type ConfirmResult = { ok: false; error: string };

/**
 * Step 2: the code opens the account. Only now does the Supabase user exist,
 * only now is the demo copy created, and only now is the person signed in.
 */
export async function confirmDemoSignup(input: z.infer<typeof confirmSchema>): Promise<ConfirmResult> {
  if (!platformIsConfigured()) return { ok: false, error: "Conturile demo nu sunt disponibile acum." };

  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică datele introduse." };
  }
  const { email, code, password } = parsed.data;

  const check = await checkLeadCode(email, code, "signup");
  if (!check.ok) return { ok: false, error: check.error };

  const service = serviceClient();
  const metadata = { name: check.lead.name ?? undefined };

  // Normally the seven-day sweep already removed the old user, so this is a
  // new account. If a deletion failed and the user is still there, reuse it
  // rather than telling the visitor their own address is taken.
  let createdNow = false;
  let userId = null as string | null;

  if (check.lead.user_id) {
    const { error } = await service.auth.admin.updateUserById(check.lead.user_id, {
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (!error) userId = check.lead.user_id;
  }

  if (!userId) {
    const { data: created, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error || !created?.user) {
      return {
        ok: false,
        error: /already|registered|exists/i.test(error?.message ?? "")
          ? "Există deja un cont cu această adresă. Intră la „Am deja cont”."
          : "Nu am putut crea contul. Încearcă din nou.",
      };
    }
    userId = created.user.id;
    createdNow = true;
  }

  const sandbox = await createSandboxFor(email);
  if (!sandbox) {
    // No panel, no new account: leaving a user behind would strand them. An
    // account that already existed before this step is left untouched.
    if (createdNow && userId) {
      await service.auth.admin.deleteUser(userId).catch(() => undefined);
    }
    return { ok: false, error: "Nu am putut pregăti panoul demo. Încearcă din nou." };
  }

  await markLeadVerified(check.lead.id, { userId, sandboxTenantId: sandbox.id });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { ok: false, error: "Contul este creat, dar intrarea a eșuat. Folosește „Am deja cont”." };
  }

  // The owner's email must not delay the visitor's first look at the panel.
  after(async () => {
    await notifyOwnerOfLead({
      name: check.lead.name,
      email,
      sandboxSlug: sandbox.slug,
      marketing: Boolean(check.lead.marketing_at),
    });
  });

  redirect(`/${sandbox.slug}/admin`);
}

/* --------------------------------------------------------------------- login */

export async function signInDemo(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/demo/cont?eroare=1&tab=login");

  // The resolver forwards to the panel this account can actually use.
  redirect("/admin");
}

/* ------------------------------------------------------------ password reset */

export async function startPasswordReset(email: string): Promise<SignupResult> {
  if (!platformIsConfigured()) return { ok: false, error: "Resetarea nu este disponibilă acum." };
  if (!z.string().email().safeParse(email).success) {
    return { ok: false, error: "Adresa de email nu pare validă." };
  }
  if (!allowed(await clientKey())) {
    return { ok: false, error: "Prea multe cereri. Încearcă peste câteva minute." };
  }

  const result = await startLeadCode({ email, purpose: "reset" });
  if (!result.ok) return result;
  return { ok: true, email: normalizeEmail(email), devCode: result.devCode };
}

export async function confirmPasswordReset(
  input: z.infer<typeof confirmSchema>
): Promise<ConfirmResult> {
  if (!platformIsConfigured()) return { ok: false, error: "Resetarea nu este disponibilă acum." };

  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică datele introduse." };
  }
  const { email, code, password } = parsed.data;

  const check = await checkLeadCode(email, code, "reset");
  if (!check.ok) return { ok: false, error: check.error };
  if (!check.lead.user_id) {
    return {
      ok: false,
      error: "Contul demo a expirat, iar parola nu mai există. Îți poți face un cont nou.",
    };
  }

  const { error } = await serviceClient().auth.admin.updateUserById(check.lead.user_id, {
    password,
    email_confirm: true,
  });
  if (error) return { ok: false, error: "Nu am putut schimba parola. Încearcă din nou." };

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { ok: false, error: "Parola a fost schimbată. Intră cu ea în „Am deja cont”." };

  redirect("/admin");
}

/* -------------------------------------------------------------------- closing */

/** GDPR: the visitor deletes the account and everything it owns, in one click. */
export async function deleteDemoAccount() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data?.user?.email ?? null;

  await supabase.auth.signOut();
  if (email) await deleteLeadData(email);
  redirect("/demo/cont?sters=1");
}
