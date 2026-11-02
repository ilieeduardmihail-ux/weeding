"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ names: z.array(z.string().trim().min(2).max(120)).min(1).max(500) });

export async function importGuests(
  input: { names: string[] }
): Promise<{ ok: true; inserted: number; skipped: number } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Verifică lista: între 1 și 500 de nume, fiecare între 2 și 120 de caractere." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("import_guests", {
    p_guests: parsed.data.names.map((full_name) => ({ full_name })),
  });
  if (error) return { ok: false, error: "Nu am putut importa lista. Te rugăm să încerci din nou." };

  const inserted = Number(data ?? 0);
  revalidatePath("/admin/seating");
  return { ok: true, inserted, skipped: parsed.data.names.length - inserted };
}
