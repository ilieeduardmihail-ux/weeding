"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ names: z.array(z.string().trim().min(2).max(120)).min(1).max(500) });

export async function importGuests(
  input: { names: string[] }
): Promise<{ ok: true; inserted: number; skipped: number } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the list: 1 to 500 names, each 2 to 120 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("import_guests", {
    p_guests: parsed.data.names.map((full_name) => ({ full_name })),
  });
  if (error) return { ok: false, error: "Couldn’t import the list. Please try again." };

  const inserted = Number(data ?? 0);
  revalidatePath("/admin/seating");
  return { ok: true, inserted, skipped: parsed.data.names.length - inserted };
}
