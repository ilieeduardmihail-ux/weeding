import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { GuestList, type GuestRow } from "@/components/admin/guest-list";
import { Button } from "@/components/ui/button";

export const instant = false;

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ edited?: string; error?: string }>;
}) {
  // Admin data is per-request; never prerender a snapshot of the guest list.
  await connection();
  const supabase = await createClient();
  // Admin check and data start together: one round trip instead of two.
  const [{ data: isAdmin }, { data }, { edited, error }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.from("rsvps").select("*, rsvp_guests(*)").order("created_at", { ascending: false }),
    searchParams,
  ]);
  if (!isAdmin) redirect("/admin/login");

  const rows = (data ?? []) as GuestRow[];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">Lista invitaților</h1>
        <div className="flex gap-3">
          <Button asChild variant="outline"><a href="/admin/export">Export CSV</a></Button>
          <form action={signOut}><Button variant="ghost">Ieși din cont</Button></form>
        </div>
      </div>

      <GuestList rows={rows} edited={edited} error={error} />
    </main>
  );
}
