import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteRsvp, signOut } from "./actions";
import { Button } from "@/components/ui/button";

type Row = {
  id: string; name: string; attending: boolean; message: string | null; created_at: string; table_number: number | null;
  rsvp_guests: { id: string; name: string; is_child: boolean; table_number: number | null }[];
};

const tableLabel = (n: number | null) => (n === null ? "no table" : `Table ${n}`);

export default async function Dashboard() {
  // Admin data is per-request; never prerender a snapshot of the guest list.
  await connection();
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/login");

  const { data } = await supabase.from("rsvps").select("*, rsvp_guests(*)").order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  const yes = rows.filter((r) => r.attending);
  const guests = yes.flatMap((r) => r.rsvp_guests);
  const stats = [
    ["Replies", rows.length],
    ["Declined", rows.length - yes.length],
    ["Attending (total)", yes.length + guests.length],
    ["Children", guests.filter((g) => g.is_child).length],
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">Guest list</h1>
        <div className="flex gap-3">
          <Button asChild variant="outline"><a href="/admin/export">Export CSV</a></Button>
          <form action={signOut}><Button variant="ghost">Sign out</Button></form>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-mist/70 p-5">
            <dd className="font-display text-4xl tabular-nums">{value}</dd>
            <dt className="text-sm text-ink/70">{label}</dt>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <p className="mt-12 text-ink/70">No replies yet. Share the site link to start collecting RSVPs.</p>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b border-ink/25 text-sm text-ink/70">
              <tr><th className="py-2">Name</th><th>Status</th><th>Party</th><th>Message</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-ink/10 align-top">
                  <td className="py-3 pr-4">
                    <p>{r.name}</p>
                    <p className="text-sm text-ink/60">
                      {new Date(r.created_at).toLocaleDateString("en-GB")}
                      {r.attending && `, ${tableLabel(r.table_number)}`}
                    </p>
                  </td>
                  <td className="pr-4">{r.attending ? "Attending" : "Declined"}</td>
                  <td className="pr-4 text-sm">
                    {r.rsvp_guests.map((g) => (
                      <p key={g.id}>{g.name}{g.is_child ? " (child)" : ""}, {tableLabel(g.table_number)}</p>
                    ))}
                  </td>
                  <td className="pr-4 text-sm text-ink/75">{r.message}</td>
                  <td>
                    <form action={deleteRsvp}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button variant="ghost" size="sm">Delete</Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
