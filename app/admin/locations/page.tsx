import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLocation } from "./actions";
import { cleanLocation } from "@/lib/location-text";

export const instant = false;

type LocationRow = {
  key: "church" | "venue";
  label: string;
  name: string;
  address: string;
  event_time: string;
  embed_url: string | null;
};

const FALLBACK: LocationRow[] = [
  {
    key: "church",
    label: "Biserică",
    name: "",
    address: "",
    event_time: "16:00",
    embed_url: null,
  },
  {
    key: "venue",
    label: "Local",
    name: "",
    address: "",
    event_time: "19:30",
    embed_url: null,
  },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-ink/60">{hint}</p>}
    </div>
  );
}

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await connection();
  const supabase = await createClient();
  // Admin check and data start together: one round trip instead of two.
  const [{ data: isAdmin }, { data }, { saved, error }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase
      .from("locations")
      .select("key, label, name, address, event_time, embed_url")
      .order("key", { ascending: true }),
    searchParams,
  ]);
  if (isAdmin !== true) redirect("/admin/login");

  const rows = ((data ?? []) as LocationRow[]).map((row) => cleanLocation(row) as LocationRow);
  const locations = (["church", "venue"] as const).map(
    (key) => rows.find((row) => row.key === key) ?? FALLBACK.find((row) => row.key === key)!
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl">Locații</h1>
      <p className="mt-2 text-ink/70">
        Aici schimbi numele și adresele care apar pe pagina principală, la secțiunea
        „Unde ne găsești”. Modificările se văd imediat după salvare.
      </p>

      {saved && (
        <p role="status" className="mt-6 rounded-lg bg-mist p-4 text-ink">
          Salvat. Pagina publică afișează acum adresele noi.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-red-500/15 p-4 text-red-200">
          {error === "save"
            ? "Nu am putut salva. Verifică legătura la baza de date și încearcă din nou."
            : "Unele câmpuri nu sunt valide. Completează numele, adresa și ora, iar linkul de hartă trebuie să înceapă cu https://www.google.com/maps."}
        </p>
      )}

      <div className="mt-8 space-y-8">
        {locations.map((location) => (
          <form
            key={location.key}
            action={saveLocation}
            className="glass grid gap-5 rounded-xl p-5 transition-colors duration-300 focus-within:border-gold/30 sm:grid-cols-2"
          >
            <input type="hidden" name="key" value={location.key} />
            <h2 className="font-display text-2xl sm:col-span-2">
              {location.key === "church" ? "Biserica" : "Localul"}
            </h2>

            <Field label="Etichetă" hint="Numele scurt afișat pe pagina publică.">
              <Input name="label" defaultValue={location.label} required minLength={2} maxLength={60} />
            </Field>
            <Field label="Ora" hint="Ex. 16:00">
              <Input type="time" name="event_time" defaultValue={location.event_time} required />
            </Field>

            <Field label="Numele locației">
              <Input name="name" defaultValue={location.name} required minLength={2} maxLength={160} />
            </Field>
            <Field label="Adresa completă">
              <Input name="address" defaultValue={location.address} required minLength={5} maxLength={300} />
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Link hartă Google Maps (opțional)"
                hint="Din Google Maps: Partajare → Încorporează o hartă → copiază linkul din src. Trebuie să înceapă cu https://www.google.com/maps"
              >
                <Input
                  type="url"
                  name="embed_url"
                  defaultValue={location.embed_url ?? ""}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" className="bg-ink text-sea hover:bg-ink/85">
                Salvează locația
              </Button>
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}
