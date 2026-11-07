import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RsvpEditor, type RsvpForEdit } from "@/components/admin/rsvp-editor";

export const instant = false;

type RsvpRow = {
  id: string;
  name: string;
  attending: boolean;
  message: string | null;
  rsvp_guests: { id: string; name: string; is_child: boolean; table_number: number | null }[];
};

export default async function EditRsvpPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();

  // Admin check and data start together: one round trip instead of two.
  const [{ data: isAdmin }, { data }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase
      .from("rsvps")
      .select("id, name, attending, message, rsvp_guests(id, name, is_child, table_number)")
      .eq("id", id)
      .maybeSingle(),
  ]);
  if (isAdmin !== true) redirect("/admin/login");

  if (!data) redirect("/admin?error=missing");

  const row = data as RsvpRow;
  const rsvp: RsvpForEdit = {
    id: row.id,
    name: row.name,
    attending: row.attending,
    message: row.message,
    guests: (row.rsvp_guests ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      is_child: g.is_child,
      table_number: g.table_number,
    })),
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/admin" className="text-sm text-ink/60 underline-offset-4 hover:underline">
        ← Lista invitaților
      </Link>
      <h1 className="mt-4 font-display text-4xl">Editează răspunsul</h1>
      <p className="mt-2 text-ink/70">
        Modifică numele, prezența, mesajul și însoțitorii. Mesele deja alocate se păstrează.
      </p>
      <RsvpEditor rsvp={rsvp} />
    </main>
  );
}
