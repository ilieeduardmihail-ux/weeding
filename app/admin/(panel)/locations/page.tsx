"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLocation } from "@/app/admin/locations/actions";

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

function LocationsFeedback() {
  const params = useSearchParams();
  const { refresh } = useAdminData();
  const saved = params.get("saved");
  const error = params.get("error");

  // The save action redirects back here; the shared dataset is refreshed in the
  // background while the already rendered form stays on screen.
  useEffect(() => {
    if (saved || error) void refresh();
  }, [saved, error, refresh]);

  return (
    <>
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
    </>
  );
}

function Locations() {
  const { data } = useAdminData();
  if (!data) return <AdminSectionSkeleton />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl">Locații</h1>
      <p className="mt-2 text-ink/70">
        Aici schimbi numele și adresele care apar pe pagina principală, la secțiunea
        „Unde ne găsești”. Modificările se văd imediat după salvare.
      </p>

      <Suspense fallback={null}>
        <LocationsFeedback />
      </Suspense>

      <div className="mt-8 space-y-8">
        {data.locations.map((location) => (
          <form
            key={`${location.key}:${location.label}:${location.name}:${location.address}:${location.event_time}:${location.embed_url ?? ""}`}
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

export default function LocationsPage() {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <Locations />
    </Suspense>
  );
}
