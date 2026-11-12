"use client";
import { useRef, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { MAX_GUESTS } from "@/lib/config";
import { hasErrors, toRsvpInput, validateRsvp, type RsvpErrors } from "@/lib/rsvp-validation";
import { submitRsvp } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Guest = { id: number; name: string; isChild: boolean };

const NO_ERRORS: RsvpErrors = { guests: {} };

export function RsvpForm({ token, slug, initialName = "", onDone }: { token: string; slug: string; initialName?: string; onDone: (name: string) => void }) {
  const [name, setName] = useState(initialName);
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<RsvpErrors>(NO_ERRORS);
  const [serverError, setServerError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [pending, start] = useTransition();
  // Honeypot stays uncontrolled: it must not re-render anything while typing.
  const website = useRef<HTMLInputElement>(null);
  const nextGuest = useRef(0);
  // When the form appeared, so the server can tell a person from an instant bot.
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const clearError = (key: "name" | "message") =>
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));

  const addGuest = () => {
    if (guests.length >= MAX_GUESTS) return;
    nextGuest.current += 1;
    setGuests((current) => [...current, { id: nextGuest.current, name: "", isChild: false }]);
  };

  const removeGuest = (index: number) => {
    setGuests((current) => current.filter((_, i) => i !== index));
    // Guest errors are keyed by position, so they all shift with the list.
    setErrors((current) => ({ ...current, guests: {} }));
  };

  const updateGuest = (index: number, patch: Partial<Guest>) => {
    setGuests((current) => current.map((guest, i) => (i === index ? { ...guest, ...patch } : guest)));
    setErrors((current) => {
      if (!current.guests[index]) return current;
      const next = { ...current.guests };
      delete next[index];
      return { ...current, guests: next };
    });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = { name, attending, guests, message };
    const found = validateRsvp(draft);
    setErrors(found);
    if (!consent) setConsentError(true);

    if (hasErrors(found)) {
      const firstGuest = Object.keys(found.guests)[0];
      const target = found.name ? "name" : firstGuest !== undefined ? `guest-${firstGuest}` : "message";
      document.getElementById(target)?.focus();
      return;
    }
    if (!consent) return;

    setServerError(null);
    start(async () => {
      const res = await submitRsvp(
        { ...toRsvpInput(draft), website: website.current?.value ?? "", consent: true, elapsedMs: Date.now() - openedAt.current },
        token
      );
      if (res.ok) onDone(draft.name.trim());
      else setServerError(res.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="glass mt-8 space-y-6 rounded-xl p-5" noValidate>
      {/* Honeypot: off-screen, skipped by keyboards and screen readers, still visible to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Website <input ref={website} type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Numele complet</Label>
        <Input
          id="name"
          autoComplete="name"
          value={name}
          onChange={(event) => { setName(event.target.value); clearError("name"); }}
          aria-invalid={!!errors.name}
          aria-describedby="name-hint"
        />
        <p id="name-hint" className="text-sm text-ink/60">Folosește numele de pe invitație. Îl vei folosi și ca să-ți verifici răspunsul.</p>
        {errors.name && <p className="text-sm text-red-700">{errors.name}</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Poți ajunge?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={attending === v}
              onClick={() => setAttending(v)}
              className={`rounded-md border px-4 py-3 transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                attending === v ? "border-ink bg-ink text-sea shadow-lg shadow-black/20" : "border-ink/30 hover:border-ink hover:bg-ink/5"
              }`}
            >
              {v === "yes" ? "Da, vin cu drag" : "Din păcate, nu pot"}
            </button>
          ))}
        </div>
      </fieldset>

      {attending === "yes" && (
        <div className="animate-drop-in motion-reduce:animate-none">
          <div className="space-y-4 pb-1">
            <p className="text-sm font-medium">Alte persoane din grupul tău</p>
            {guests.map((guest, i) => (
              <div key={guest.id} className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <Input
                    id={`guest-${i}`}
                    aria-label={`Numele persoanei ${i + 1}`}
                    placeholder="Nume complet"
                    value={guest.name}
                    onChange={(event) => updateGuest(i, { name: event.target.value })}
                    aria-invalid={!!errors.guests[i]}
                  />
                  {errors.guests[i] && <p className="text-sm text-red-700">{errors.guests[i]}</p>}
                  <label className="flex items-center gap-2 text-sm text-ink/75">
                    <input type="checkbox" checked={guest.isChild} onChange={(event) => updateGuest(i, { isChild: event.target.checked })} /> Copil
                  </label>
                </div>
                <Button type="button" variant="ghost" onClick={() => removeGuest(i)}>Elimină</Button>
              </div>
            ))}
            {guests.length < MAX_GUESTS && (
              <Button type="button" variant="outline" onClick={addGuest}>Adaugă o persoană</Button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="message">Mesaj pentru mir(i) (opțional)</Label>
        <textarea id="message" rows={3} value={message}
          onChange={(event) => { setMessage(event.target.value); clearError("message"); }}
          aria-invalid={!!errors.message}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 transition-[border-color,box-shadow] duration-200 focus-visible:border-gold focus-visible:outline-2 focus-visible:outline-gold" />
        {errors.message && <p className="text-sm text-red-700">{errors.message}</p>}
      </div>

      <div className="space-y-2 rounded-lg border border-ink/15 bg-ink/5 p-3">
        <label className="flex items-start gap-3 text-sm text-ink/80">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0"
            checked={consent}
            aria-invalid={consentError}
            aria-describedby="consent-hint"
            onChange={(event) => {
              setConsent(event.target.checked);
              if (event.target.checked) setConsentError(false);
            }}
          />
          <span>
            Sunt de acord ca numele meu și răspunsul să fie prelucrate pentru organizarea nunții,
            conform{" "}
            <Link
              href={`/${slug}/confidentialitate`}
              target="_blank"
              className="underline decoration-gold underline-offset-4 hover:text-ink"
            >
              politicii de confidențialitate
            </Link>
            .
          </span>
        </label>
        <p id="consent-hint" className="text-xs text-ink/55">
          Operatorul datelor este perechea care organizează nunta. Poți cere oricând ștergerea
          răspunsului.
        </p>
        {consentError && (
          <p role="alert" className="text-sm text-red-700">
            Bifează acordul ca să putem salva răspunsul.
          </p>
        )}
      </div>

      {serverError && <p role="alert" className="text-red-700">{serverError}</p>}
      <Button type="submit" size="lg" disabled={pending} className="w-full bg-ink text-sea hover:bg-ink/85">
        {pending ? "Se trimite..." : "Trimite răspunsul"}
      </Button>
    </form>
  );
}
