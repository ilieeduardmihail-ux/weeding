import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeSettings } from "@/lib/event-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSettings } from "./actions";

// Reads searchParams (for the success/error banner), which blocks prerendering.
export const instant = false;

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

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) redirect("/admin/login");

  const { data } = await supabase.from("event_settings").select("*").eq("id", 1).maybeSingle();
  const settings = normalizeSettings(data as Record<string, unknown> | null);
  const { saved, error } = await searchParams;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-4xl">Wedding settings</h1>
      <p className="mt-2 text-ink/70">
        These values power the public page, the countdown and the RSVP cutoff.
      </p>

      {saved && (
        <p role="status" className="mt-6 rounded-lg bg-mist p-4 text-ink">
          Saved. The public page now shows the new values.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-red-100 p-4 text-red-800">
          {error === "save"
            ? "Could not save. Check the database connection and try again."
            : "Some fields are invalid. Check the dates, the time and the URL."}
        </p>
      )}

      <form action={saveSettings} className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="First name">
          <Input name="partner_1" defaultValue={settings.partner_1} required minLength={2} maxLength={80} />
        </Field>
        <Field label="Second name">
          <Input name="partner_2" defaultValue={settings.partner_2} required minLength={2} maxLength={80} />
        </Field>

        <Field label="Date">
          <Input type="date" name="event_date" defaultValue={settings.event_date} required />
        </Field>
        <Field label="Time">
          <Input type="time" name="event_time" defaultValue={settings.event_time} required />
        </Field>

        <Field label="City">
          <Input name="city" defaultValue={settings.city} required minLength={2} maxLength={80} />
        </Field>
        <Field label="Timezone" hint="Used for the countdown and the RSVP cutoff.">
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

        <Field label="RSVP closes on" hint="Leave empty to keep the form open indefinitely.">
          <Input type="date" name="rsvp_cutoff_date" defaultValue={settings.rsvp_cutoff_date ?? ""} />
        </Field>
        <Field label="Public URL" hint="Optional, must start with https://.">
          <Input
            type="url"
            name="public_url"
            defaultValue={settings.public_url ?? ""}
            placeholder="https://example.com"
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
            Publish the seating plan on the public page
          </label>
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" className="bg-ink text-sea hover:bg-ink/85">
            Save settings
          </Button>
        </div>
      </form>
    </main>
  );
}
