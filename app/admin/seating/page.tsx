import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SeatingBoard, type Kind, type Person } from "@/components/admin/seating-board";
import type { SeatingTable } from "@/lib/seating";

export const instant = false;

export default async function SeatingPage() {
  await connection();
  const supabase = await createClient();
  const [{ data: peopleData }, { data: tablesData, error: tablesError }] = await Promise.all([
    supabase.from("seating_people").select("id, kind, name, table_number").order("name"),
    supabase.from("seating_tables").select("number, capacity").order("number"),
  ]);

  const people: Person[] = (peopleData ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    kind: r.kind as Kind,
    name: r.name as string,
    table: (r.table_number as number | null) ?? null,
  }));

  // Before migration v8 the table does not exist yet: keep the old fixed layout
  // visible instead of showing an empty board.
  const tables: SeatingTable[] = tablesError
    ? Array.from({ length: 10 }, (_, i) => ({ number: i + 1, capacity: 10 }))
    : (tablesData ?? []).map((r: Record<string, unknown>) => ({
        number: Number(r.number),
        capacity: Number(r.capacity),
      }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-4xl">Așezare la mese</h1>
      <SeatingBoard initial={people} initialTables={tables} />
    </main>
  );
}
