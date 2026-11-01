import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type ReportRow = {
  kind: "rsvp" | "plus" | "guest";
  name: string;
  is_child: boolean;
  table_number: number | null;
  counted: boolean;
};

const kindLabel: Record<ReportRow["kind"], string> = {
  rsvp: "Reply",
  plus: "Plus-one",
  guest: "Guest list",
};

function byTable(a: ReportRow, b: ReportRow) {
  if (a.table_number === b.table_number) return a.name.localeCompare(b.name);
  if (a.table_number === null) return 1;
  if (b.table_number === null) return -1;
  return a.table_number - b.table_number;
}

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) redirect("/admin/login");

  const { data } = await supabase.from("venue_report").select("*");
  const rows = ((data ?? []) as ReportRow[]).sort(byTable);

  const counted = rows.filter((row) => row.counted);
  const adults = counted.filter((row) => !row.is_child).length;
  const children = counted.filter((row) => row.is_child).length;
  const unassigned = rows.filter((row) => row.table_number === null).length;

  const groups = new Map<number | null, ReportRow[]>();
  for (const row of rows) {
    const list = groups.get(row.table_number) ?? [];
    list.push(row);
    groups.set(row.table_number, list);
  }

  const stats = [
    ["Headcount", counted.length, "seated and confirmed"],
    ["Adults", adults, "excluding children"],
    ["Children", children, "confirmed"],
    ["Unassigned", unassigned, "no table yet"],
  ] as const;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-4xl">Venue report</h1>
      <p className="mt-2 text-ink/70">
        Everyone the venue needs to plan for, grouped by table. Imported guests count only once they
        have a table.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(([label, value, hint]) => (
          <div key={label} className="rounded-lg bg-mist/70 p-5">
            <dd className="font-display text-4xl tabular-nums">{value}</dd>
            <dt className="text-sm text-ink/70">{label}</dt>
            <p className="mt-1 text-xs text-ink/50">{hint}</p>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <p className="mt-12 text-ink/70">Nothing to report yet — no replies or imported guests.</p>
      ) : (
        <div className="mt-12 space-y-10">
          {[...groups.entries()].map(([table, people]) => (
            <section key={table ?? "unassigned"}>
              <h2 className="font-display text-2xl">
                {table === null ? "Unassigned" : `Table ${table}`}
                <span className="ml-2 text-sm font-sans text-ink/50">{people.length} people</span>
              </h2>
              <table className="mt-3 w-full border-collapse text-left text-sm">
                <thead className="border-b border-ink/20 text-xs uppercase tracking-wide text-ink/50">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Source</th>
                    <th className="py-2 font-medium">Child</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((row, index) => (
                    <tr key={`${row.kind}-${row.name}-${index}`} className="border-b border-ink/10">
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2 pr-4 text-ink/60">{kindLabel[row.kind]}</td>
                      <td className="py-2 text-ink/60">{row.is_child ? "Yes" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
