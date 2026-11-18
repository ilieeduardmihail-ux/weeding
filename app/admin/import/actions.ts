"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminBasePath, currentAdminSlug, currentTenantId } from "@/lib/tenant-session";
import { MAX_IMPORT_NAMES, NAME_MAX_LENGTH, NAME_MIN_LENGTH } from "@/lib/import-names";

const guestSchema = z.object({
  name: z.string().max(300),
  group: z.string().max(120).optional(),
  isChild: z.boolean().optional(),
  allergies: z.string().max(500).optional(),
  phone: z.string().max(40).optional(),
});

const schema = z.object({
  guests: z.array(guestSchema).min(1).max(MAX_IMPORT_NAMES),
});

export type ImportGuestInput = {
  name: string;
  group?: string;
  isChild?: boolean;
  allergies?: string;
  phone?: string;
};

export type ImportResult =
  | { ok: true; inserted: number; skipped: number; tooLong: number; tooShort: number }
  | { ok: false; error: string };

export async function importGuests(input: { guests: ImportGuestInput[] }): Promise<ImportResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: `Poți importa între 1 și ${MAX_IMPORT_NAMES} nume o dată.` };
  }

  // One over-long row must not throw away the other four hundred, and the rows
  // that survive keep their child/allergy details.
  const valid: {
    full_name: string;
    group_name: string | null;
    is_child: boolean;
    allergies: string | null;
    phone: string | null;
  }[] = [];
  let tooLong = 0;
  let tooShort = 0;

  for (const guest of parsed.data.guests) {
    const name = guest.name.replace(/\s+/g, " ").trim();
    if (!name) continue;
    if (name.length > NAME_MAX_LENGTH) {
      tooLong += 1;
      continue;
    }
    if (name.length < NAME_MIN_LENGTH) {
      tooShort += 1;
      continue;
    }
    valid.push({
      full_name: name,
      group_name: guest.group?.trim() || null,
      is_child: guest.isChild === true,
      allergies: guest.allergies?.trim() || null,
      phone: guest.phone?.trim() || null,
    });
  }

  if (valid.length === 0) {
    return {
      ok: false,
      error:
        "Niciun nume nu are între 2 și 120 de caractere. Verifică lista și încearcă din nou.",
    };
  }

  const supabase = await createClient();
  const tenantId = await currentTenantId();
  if (!tenantId) {
    return {
      ok: false,
      error: "Nunta nu este activă sau sesiunea a expirat. Intră din nou în panou.",
    };
  }

  const { data, error } = await supabase.rpc("import_guests", {
    p_guests: valid,
    p_tenant: tenantId,
  });

  if (error) {
    // The panel used to show one generic sentence for every failure, so a
    // membership problem looked like a network hiccup. Keep the details here.
    const message = String(error.message ?? "");
    const slug = await currentAdminSlug();
    const { data: auth } = await supabase.auth.getUser();
    console.error("[import_guests] failed", {
      tenant: tenantId,
      slug,
      email: auth?.user?.email ?? null,
      names: valid.length,
      error: message,
    });

    if (message.includes("not allowed")) {
      return {
        ok: false,
        error:
          "Contul tău nu este administrator al acestei nunți, deci nu poate importa invitați.",
      };
    }
    if (message.includes("too many")) {
      return { ok: false, error: `Importă cel mult ${MAX_IMPORT_NAMES} nume o dată.` };
    }
    if (message.includes("tenant unavailable")) {
      return { ok: false, error: "Accesul acestei nunți a expirat. Reînnoiește-l din platformă." };
    }
    return {
      ok: false,
      error: "Nu am putut importa lista. Eroarea a fost notată; încearcă din nou în câteva secunde.",
    };
  }

  const inserted = Number(data ?? 0);
  const base = await adminBasePath();
  revalidatePath(base, "layout");
  revalidatePath(`${base}/seating`);
  return { ok: true, inserted, skipped: valid.length - inserted, tooLong, tooShort };
}
