import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SeatingBoard, type Kind, type Person } from "@/components/admin/seating-board";

export default async function SeatingPage() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("seating_people").select("id, kind, name, table_number").order("name");
  const people: Person[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    kind: r.kind as Kind,
    name: r.name as string,
    table: (r.table_number as number | null) ?? null,
  }));
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-4xl">Așezare la mese</h1>
      <SeatingBoard initial={people} />
    </main>
  );
}
