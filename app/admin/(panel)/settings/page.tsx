"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSettings } from "@/app/admin/settings/actions";

const TIMEZONES = [
  "Europe/Bucharest",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Vienna",
  "Europe/Berlin",
  "Europe/Athens",
  "Europe/Istanbul",
  "UTC",
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

function SettingsFeedback() {
  const params = useSearchParams();
  const { refresh } = useAdminData();
  const saved = params.get("saved");
  const error = params.get("error");

  useEffect(() => {
    if (saved || error) void refresh();
  }, [saved, error, refresh]);

  return (
    <>
      {saved && (
        <p role="status" className="mt-6 rounded-lg bg-mist p-4 text-ink">
          Salvat. Pagina publică afișează acum valorile noi.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-red-500/15 p-4 text-red-200">
          {error === "save"
            ? "Nu am putut salva. Verifică legătura la baza de date și încearcă din nou."
            : "Unele câmpuri nu sunt valide. Verifică datele, ora și linkul."}
        </p>
      )}
    </>
  );
}

function Settings() {
  const { data } = useAdminData();
  if (!data) return <AdminSectionSkeleton />;
  const settings = data.settings;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-4xl">Setările nunții</h1>
      <p className="mt-2 text-ink/70">
        Aceste valori apar pe pagina publică, în numărătoare și la termenul de confirmare.
      </p>

      <Suspense fallback={null}>
        <SettingsFeedback />
      </Suspense>

      <form key={JSON.stringify(settings)} action={saveSettings} className="glass mt-8 grid gap-5 rounded-xl p-5 transition-colors duration-300 focus-within:border-gold/30 sm:grid-cols-2">
        <Field label="Primul nume">
          <Input name="partner_1" defaultValue={settings.partner_1} required minLength={2} maxLength={80} />
        </Field>
        <Field label="Al doilea nume">
          <Input name="partner_2" defaultValue={settings.partner_2} required minLength={2} maxLength={80} />
        </Field>

        <Field label="Data">
          <Input type="date" name="event_date" defaultValue={settings.event_date} required />
        </Field>
        <Field label="Ora">
          <Input type="time" name="event_time" defaultValue={settings.event_time} required />
        </Field>

        <Field label="Orașul">
          <Input name="city" defaultValue={settings.city} required minLength={2} maxLength={80} />
        </Field>
        <Field label="Fus orar" hint="Folosit pentru numărătoare și termenul de confirmare.">
          <Input
            list="timezones"
            name="timezone"
            defaultValue={settings.timezone}
            required
            minLength={3}
            maxLength={64}
          />
          <datalist id="timezones">
            {TIMEZONES.map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Email de contact"
            hint="Apare în footer și pe pagina de confidențialitate, pentru întrebări legate de nuntă."
          >
            <Input type="email" name="contact_email" defaultValue={settings.contact_email} required maxLength={200} />
          </Field>
        </div>

        <Field label="Confirmările se închid pe" hint="Lasă gol ca formularul să rămână deschis fără termen.">
          <Input type="date" name="rsvp_cutoff_date" defaultValue={settings.rsvp_cutoff_date ?? ""} />
        </Field>
        <Field label="Link public" hint="Opțional, trebuie să înceapă cu https://.">
          <Input
            type="url"
            name="public_url"
            defaultValue={settings.public_url ?? ""}
            placeholder="https://exemplu.ro"
          />
        </Field>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="seating_published"
              defaultChecked={settings.seating_published}
              className="size-4 accent-ink"
            />
            Publică planul meselor pe pagina publică
          </label>
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" className="bg-ink text-sea hover:bg-ink/85">
            Salvează setările
          </Button>
        </div>
      </form>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <Settings />
    </Suspense>
  );
}
