"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TABLE_CAPACITY, TABLE_COUNT } from "@/lib/admin-config";

type Result = { ok: true } | { ok: false; error: string };

const assignSchema = z.object({
  kind: z.enum(["rsvp", "plus", "guest"]),
  id: z.string().uuid(),
  table: z.number().int().min(1).max(TABLE_COUNT).nullable(),
});

export async function assignTable(kind: string, id: string, table: number | null): Promise<Result> {
  const parsed = assignSchema.safeParse({ kind, id, table });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_table", {
    p_kind: parsed.data.kind,
    p_id: parsed.data.id,
    p_table: parsed.data.table,
    p_cap: TABLE_CAPACITY,
  });
  if (error) {
    return { ok: false, error: error.message.includes("table full") ? "That table is full." : "Couldn’t save the change." };
  }
  return { ok: true };
}

export async function deleteGuest(id: string): Promise<Result> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid request." };
  const supabase = await createClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  return error ? { ok: false, error: "Couldn’t remove that guest." } : { ok: true };
}
