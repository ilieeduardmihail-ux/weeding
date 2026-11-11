"use client";

import { Suspense, useEffect, useState, useTransition, type CSSProperties } from "react";
import { Check, Palette as PaletteIcon, RotateCcw, Sparkles } from "lucide-react";
import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { FloralDecor } from "@/components/floral-decor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast, useToast } from "@/components/ui/toast";
import { formatEventDate, type EventSettings } from "@/lib/event-settings";
import {
  FLORAL_INTENSITIES,
  FLORAL_PLACEMENTS,
  FLORAL_SETS,
  PALETTES,
  paletteById,
  resolveTheme,
  type FloralIntensity,
  type FloralPlacement,
  type Theme,
} from "@/lib/theme";
import { saveTheme } from "@/app/admin/theme/actions";

/* ------------------------------------------------------------------ colours */

function ColorField({
  label,
  hint,
  custom,
  value,
  fallback,
  onToggle,
  onChange,
}: {
  label: string;
  hint: string;
  custom: boolean;
  value: string;
  fallback: string;
  onToggle: (value: boolean) => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-ink/12 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-ink/60">{hint}</p>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={custom}
            onChange={(event) => onToggle(event.target.checked)}
            className="size-4 accent-ink"
          />
          Personalizat
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="color"
          value={custom ? value : fallback}
          disabled={!custom}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="h-10 w-14 cursor-pointer rounded-md border border-ink/20 bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input
          value={custom ? value : fallback}
          readOnly={!custom}
          onChange={(event) => onChange(event.target.value)}
          maxLength={7}
          spellCheck={false}
          className="font-mono disabled:opacity-60"
          disabled={!custom}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ preview */

function Preview({
  theme,
  settings,
}: {
  theme: Theme;
  settings: EventSettings;
}) {
  const resolved = resolveTheme(theme);
  return (
    <div
      className="theme-canvas relative flex h-72 items-center justify-center overflow-hidden rounded-xl border border-ink/15"
      style={resolved.cssVars as CSSProperties}
    >
      {resolved.floral.enabled && (
        <FloralDecor
          set={resolved.floral.set}
          intensity={resolved.floral.intensity}
          placement={resolved.floral.placement}
          id="flora-preview"
        />
      )}
      <div className="relative z-10 px-6 text-center">
        <p className="font-display text-[clamp(2rem,5vw,3.25rem)] leading-tight">
          {settings.partner_1}
          <span className="block italic text-gold">&amp;</span>
          {settings.partner_2}
        </p>
        <p className="mt-3 text-sm opacity-80">
          {formatEventDate(settings)} · ora {settings.event_time}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- editor */

function ThemeEditor({ theme, settings }: { theme: Theme; settings: EventSettings }) {
  const { refresh } = useAdminData();
  const { toast, show, dismiss } = useToast();
  const [pending, start] = useTransition();

  const initial = paletteById(theme.palette);

  const [palette, setPalette] = useState(theme.palette);
  const [customBg, setCustomBg] = useState(Boolean(theme.colors.background));
  const [bg, setBg] = useState(theme.colors.background ?? initial.bg);
  const [customText, setCustomText] = useState(Boolean(theme.colors.text));
  const [text, setText] = useState(theme.colors.text ?? initial.text);
  const [customAccent, setCustomAccent] = useState(Boolean(theme.colors.accent));
  const [accent, setAccent] = useState(theme.colors.accent ?? initial.accent);

  const [floralEnabled, setFloralEnabled] = useState(theme.floral.enabled);
  const [floralSet, setFloralSet] = useState(theme.floral.set);
  const [intensity, setIntensity] = useState<FloralIntensity>(theme.floral.intensity);
  const [placement, setPlacement] = useState<FloralPlacement>(theme.floral.placement);

  // Switching palette nudges the colours that are still following it.
  useEffect(() => {
    const next = paletteById(palette);
    if (!customBg) setBg(next.bg);
    if (!customText) setText(next.text);
    if (!customAccent) setAccent(next.accent);
  }, [palette, customBg, customText, customAccent]);

  const draft: Theme = {
    palette,
    colors: {
      background: customBg ? bg : undefined,
      text: customText ? text : undefined,
      accent: customAccent ? accent : undefined,
    },
    floral: { enabled: floralEnabled, set: floralSet, intensity, placement },
  };

  const save = () => {
    start(async () => {
      const result = await saveTheme(draft);
      if (!result.ok) {
        show(result.error);
        return;
      }
      await refresh();
      show("Temă salvată. Pagina publică arată acum așa.", "success");
    });
  };

  const reset = () => {
    const base = paletteById(palette);
    setCustomBg(false);
    setBg(base.bg);
    setCustomText(false);
    setText(base.text);
    setCustomAccent(false);
    setAccent(base.accent);
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-4xl">Temă</h1>
      <p className="mt-2 max-w-2xl text-ink/70">
        Alege paleta și decorul paginii publice. Schimbările se văd imediat după salvare, atât pe
        pagina principală, cât și pe adresa nunții voastre.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <section className="glass rounded-xl p-5">
            <h2 className="flex items-center gap-2 font-display text-2xl">
              <PaletteIcon className="size-5" aria-hidden="true" /> Paletă de culori
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PALETTES.map((option) => {
                const active = option.id === palette;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPalette(option.id)}
                    aria-pressed={active}
                    className={`group flex flex-col gap-2 rounded-lg border p-3 text-left transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px ${
                      active ? "border-gold/70 shadow-md shadow-black/10" : "border-ink/15"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="flex size-8 items-center justify-center rounded-full border border-black/10"
                        style={{ backgroundColor: option.bg }}
                      >
                        <span className="size-3.5 rounded-full" style={{ backgroundColor: option.accent }} />
                      </span>
                      {active && <Check className="size-4 text-gold" aria-hidden="true" />}
                    </span>
                    <span className="text-xs font-medium leading-tight">{option.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="glass rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Culori</h2>
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                <RotateCcw aria-hidden="true" /> Revino la paletă
              </Button>
            </div>
            <p className="mt-1 text-sm text-ink/65">
              Poți ajusta fin fundalul, textul și accentele aurii. Dacă nu bifezi „Personalizat”,
              culoarea urmează paleta aleasă.
            </p>
            <div className="mt-5 space-y-3">
              <ColorField
                label="Fundal"
                hint="Culoarea de bază a paginii."
                custom={customBg}
                value={bg}
                fallback={paletteById(palette).bg}
                onToggle={setCustomBg}
                onChange={setBg}
              />
              <ColorField
                label="Text"
                hint="Culoarea textului principal."
                custom={customText}
                value={text}
                fallback={paletteById(palette).text}
                onToggle={setCustomText}
                onChange={setText}
              />
              <ColorField
                label="Accent"
                hint="Linkuri, linii fine și simbolul &."
                custom={customAccent}
                value={accent}
                fallback={paletteById(palette).accent}
                onToggle={setCustomAccent}
                onChange={setAccent}
              />
            </div>
          </section>

          <section className="glass rounded-xl p-5">
            <h2 className="flex items-center gap-2 font-display text-2xl">
              <Sparkles className="size-5" aria-hidden="true" /> Decor floral
            </h2>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={floralEnabled}
                onChange={(event) => setFloralEnabled(event.target.checked)}
                className="size-4 accent-ink"
              />
              Afișează decorul floral pe prima pagină
            </label>

            <fieldset disabled={!floralEnabled} className="mt-5 space-y-5 disabled:opacity-50">
              <div>
                <Label>Cum arată decorul</Label>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {FLORAL_SETS.map((set) => {
                    const active = set.id === floralSet;
                    return (
                      <button
                        key={set.id}
                        type="button"
                        onClick={() => setFloralSet(set.id)}
                        aria-pressed={active}
                        className={`rounded-md border px-3 py-2 text-xs transition-[border-color,background-color] duration-200 ease-out ${
                          active ? "border-gold/70 bg-ink/5 font-medium" : "border-ink/15 hover:bg-ink/5"
                        }`}
                      >
                        {set.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="intensity">Cât de prezent</Label>
                  <select
                    id="intensity"
                    value={intensity}
                    onChange={(event) => setIntensity(event.target.value as FloralIntensity)}
                    className="flex h-10 w-full rounded-md border border-ink/20 bg-ink/10 px-3 text-sm text-ink focus-visible:border-gold/60 focus-visible:outline-none"
                  >
                    {FLORAL_INTENSITIES.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placement">Unde stă</Label>
                  <select
                    id="placement"
                    value={placement}
                    onChange={(event) => setPlacement(event.target.value as FloralPlacement)}
                    className="flex h-10 w-full rounded-md border border-ink/20 bg-ink/10 px-3 text-sm text-ink focus-visible:border-gold/60 focus-visible:outline-none"
                  >
                    {FLORAL_PLACEMENTS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-display text-2xl">Previzualizare</h2>
          <Preview theme={draft} settings={settings} />
          <Button type="button" onClick={save} disabled={pending} className="w-full bg-ink text-sea hover:bg-ink/85">
            {pending ? "Se salvează..." : "Salvează tema"}
          </Button>
          <Toast toast={toast} onDismiss={dismiss} />
        </div>
      </div>
    </main>
  );
}

function Theme() {
  const { data } = useAdminData();
  if (!data) return <AdminSectionSkeleton />;
  return <ThemeEditor theme={data.theme} settings={data.settings} />;
}

export default function ThemePage() {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <Theme />
    </Suspense>
  );
}
