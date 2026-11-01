import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET() {
  // Always export the current data, never a build-time snapshot.
  await connection();
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return new Response("Unauthorized", { status: 401 });

  const { data } = await supabase.from("rsvps").select("*, rsvp_guests(*)").order("name");
  const lines = ["name,attending,table,party,message,replied"];
  for (const r of data ?? []) {
    const party = (r.rsvp_guests as { name: string; table_number: number | null }[])
      .map((g) => `${g.name}${g.table_number ? ` (table ${g.table_number})` : ""}`)
      .join("; ");
    lines.push(
      [r.name, r.attending ? "yes" : "no", r.table_number ?? "", party, r.message, r.created_at].map(esc).join(",")
    );
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=rsvps.csv" },
  });
}
