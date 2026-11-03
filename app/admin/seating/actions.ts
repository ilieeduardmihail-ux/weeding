"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MAX_TABLE_NUMBER, MAX_TABLE_CAPACITY, MIN_TABLE_CAPACITY } from "@/lib/seating";

type Result = { ok: true } | { ok: false; error: string };

const assignSchema = z.object({
  kind: z.enum(["rsvp", "plus", "guest"]),
  id: z.string().uuid(),
  table: z.number().int().min(1).max(MAX_TABLE_NUMBER).nullable(),
});

export async function assignTable(kind: string, id: string, table: number | null): Promise<Result> {
  const parsed = assignSchema.safeParse({ kind, id, table });
  if (!parsed.success) return { ok: false, error: "Cerere invalidă." };

  const supabase = await createClient();
  const { error } = parsed.data.table === null
    ? await supabase.rpc("unassign_table", {
        p_kind: parsed.data.kind,
        p_id: parsed.data.id,
      })
    : await supabase.rpc("assign_table", {
        p_kind: parsed.data.kind,
        p_id: parsed.data.id,
        p_table: parsed.data.table,
      });
  if (error) {
    const message = error.message;
    if (message.includes("table full")) return { ok: false, error: "Masa este plină." };
    if (message.includes("table missing")) return { ok: false, error: "Masa nu mai există." };
    return { ok: false, error: "Nu am putut salva modificarea. Rulează migrarea v9 în Supabase." };
  }
  return { ok: true };
}

export async function deleteGuest(id: string): Promise<Result> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Cerere invalidă." };
  const supabase = await createClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  return error ? { ok: false, error: "Nu am putut șterge invitatul." } : { ok: true };
}

const capacitySchema = z.number().int().min(MIN_TABLE_CAPACITY).max(MAX_TABLE_CAPACITY);
const numberSchema = z.number().int().min(1).max(MAX_TABLE_NUMBER);

export async function addTable(
  number: number | null,
  capacity: number,
): Promise<Result & { number?: number }> {
  if (number !== null && !numberSchema.safeParse(number).success) {
    return { ok: false, error: "Numărul mesei trebuie să fie între 1 și 99." };
  }
  if (!capacitySchema.safeParse(capacity).success) {
    return { ok: false, error: `Capacitatea trebuie să fie între ${MIN_TABLE_CAPACITY} și ${MAX_TABLE_CAPACITY}.` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_seating_table", {
    p_number: number,
    p_capacity: capacity,
  });
  if (error) {
    const message = error.message;
    if (message.includes("table exists")) return { ok: false, error: "Există deja o masă cu acest număr." };
    if (message.includes("no numbers left")) return { ok: false, error: "Nu mai există numere libere." };
    return { ok: false, error: "Nu am putut adăuga masa. Rulează migrarea v8 în Supabase." };
  }
  revalidatePath("/admin/seating");
  return { ok: true, number: typeof data === "number" ? data : (number ?? undefined) };
}

export async function deleteTable(number: number): Promise<Result> {
  if (!numberSchema.safeParse(number).success) return { ok: false, error: "Cerere invalidă." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_seating_table", { p_number: number });
  if (error) {
    return { ok: false, error: "Nu am putut șterge masa. Rulează migrarea v8 în Supabase." };
  }
  revalidatePath("/admin/seating");
  return { ok: true };
}

export async function setTableCapacity(number: number, capacity: number): Promise<Result> {
  if (!numberSchema.safeParse(number).success) return { ok: false, error: "Cerere invalidă." };
  if (!capacitySchema.safeParse(capacity).success) {
    return { ok: false, error: `Capacitatea trebuie să fie între ${MIN_TABLE_CAPACITY} și ${MAX_TABLE_CAPACITY}.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_table_capacity", {
    p_number: number,
    p_capacity: capacity,
  });
  if (error) {
    const message = error.message;
    if (message.includes("table occupied")) {
      return { ok: false, error: "Masa are deja mai mulți invitați decât capacitatea nouă." };
    }
    return { ok: false, error: "Nu am putut salva capacitatea." };
  }
  revalidatePath("/admin/seating");
  return { ok: true };
}
