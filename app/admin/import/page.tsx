import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GuestImport } from "@/components/admin/guest-import";

export default async function ImportPage() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("guests").select("full_name");
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-4xl">Import guests</h1>
      <GuestImport existing={(data ?? []).map((g: Record<string, unknown>) => g.full_name as string)} />
    </main>
  );
}
