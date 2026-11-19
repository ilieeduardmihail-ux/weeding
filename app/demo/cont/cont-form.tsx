"use client";

import { useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmDemoSignup,
  resendDemoCode,
  signInDemo,
  startDemoSignup,
} from "./actions";

type Props = {
  initialTab?: "signup" | "login";
  initialEmail?: string;
  /** A message that follows a redirect (?eroare=1, ?sters=1, ?expirat=1). */
  notice?: string | null;
};

/**
 * The two halves of the account, in one card.
 *
 * Step 1 collects everything and asks for a code; step 2 asks for the code and
 * opens the panel. The password stays in this component's memory between the
 * two steps — it is never written to a cookie or a URL, so a reload simply
 * means starting over.
 */
export function ContForm({ initialTab = "signup", initialEmail = "", notice }: Props) {
  const [tab, setTab] = useState<"signup" | "login">(initialTab);
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const ids = useId();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submitStep1 = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);
    start(async () => {
      const result = await startDemoSignup({
        name,
        email,
        password,
        consent,
        website: String(data.get("website") ?? ""),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEmail(result.email);
      setCode("");
      setDevCode(result.devCode ?? null);
      setCooldown(60);
      setStep(2);
    });
  };

  const submitStep2 = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    start(async () => {
      // On success the action redirects to the visitor's own panel.
      const result = await confirmDemoSignup({ email, code, password });
      if (!result.ok) setError(result.error);
    });
  };

  const resend = () => {
    setError(null);
    start(async () => {
      const result = await resendDemoCode(email);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDevCode(result.devCode ?? null);
      setCooldown(60);
    });
  };

  return (
    <div className="glass w-full rounded-2xl p-6 sm:p-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Cont demo</p>
        <h1 className="mt-2 font-display text-3xl">Panoul demo</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Invitația demo de la <Link href="/demo" className="underline decoration-gold underline-offset-4">/demo</Link>{" "}
          rămâne liberă. Contul îți deschide panoul de organizare, cu o copie a nunții demo
          doar a ta, în care poți lucra liniștit.
        </p>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-sky-700/30 bg-sky-700/10 px-4 py-3 text-sm text-sky-900"
        >
          {notice}
        </p>
      )}

      {step === 1 && (
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-ink/5 p-1 text-sm">
          {(["signup", "login"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                setError(null);
              }}
              aria-pressed={tab === value}
              className={`rounded-md px-3 py-2 transition-colors duration-200 ${
                tab === value ? "bg-sea font-medium text-ink shadow-sm" : "text-ink/60 hover:text-ink"
              }`}
            >
              {value === "signup" ? "Cont nou" : "Am deja cont"}
            </button>
          ))}
        </div>
      )}

      {tab === "signup" && step === 1 && (
        <form onSubmit={submitStep1} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${ids}-name`}>Numele tău</Label>
            <Input
              id={`${ids}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder="Ana Popescu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${ids}-email`}>Email</Label>
            <Input
              id={`${ids}-email`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="ana@exemplu.ro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${ids}-password`}>Parolă</Label>
            <Input
              id={`${ids}-password`}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
            />
            <p className="text-xs text-ink/55">Cel puțin 8 caractere. O folosești ca să intri altă dată.</p>
          </div>

          {/* Honeypot: hidden from people, filled by bots. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />

          <label className="flex items-start gap-3 rounded-lg bg-ink/5 p-3 text-xs leading-relaxed text-ink/75">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-gold)]"
            />
            <span>
              Sunt de acord cu prelucrarea datelor mele pentru acest cont demo, conform{" "}
              <Link href="/confidentialitate" className="underline decoration-gold underline-offset-4">
                politicii de confidențialitate
              </Link>
              . Pot șterge contul oricând, dintr-un click.
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={pending || !consent} className="w-full bg-ink text-sea">
            <Mail aria-hidden="true" /> {pending ? "Se trimite codul..." : "Trimite-mi codul"}
          </Button>

          <p className="text-center text-xs leading-relaxed text-ink/55">
            Primești un cod de 6 cifre pe email. Fără el, contul rămâne inactiv.
          </p>
        </form>
      )}

      {tab === "signup" && step === 2 && (
        <form onSubmit={submitStep2} className="mt-6 space-y-4">
          <div className="rounded-lg bg-ink/5 p-3 text-sm text-ink/75">
            Am trimis codul la <strong className="text-ink">{email}</strong>.{" "}
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
                setCode("");
              }}
              className="underline decoration-gold underline-offset-4"
            >
              Schimbă adresa
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${ids}-code`}>Codul din email</Label>
            <Input
              id={`${ids}-code`}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              className="text-center font-mono text-2xl tracking-[0.5em]"
            />
          </div>

          {devCode && (
            <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900">
              Mod local: Gmail nu este configurat, așa că codul este <strong>{devCode}</strong>.
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={pending || code.length !== 6} className="w-full bg-ink text-sea">
            <ShieldCheck aria-hidden="true" /> {pending ? "Se verifică..." : "Activează și intră în panou"}
          </Button>

          <div className="flex items-center justify-between text-xs text-ink/60">
            <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1">
              <ArrowLeft aria-hidden="true" className="size-3.5" /> Înapoi
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={pending || cooldown > 0}
              className="underline decoration-gold underline-offset-4 disabled:no-underline disabled:opacity-60"
            >
              {cooldown > 0 ? `Trimite din nou în ${cooldown}s` : "Trimite din nou codul"}
            </button>
          </div>
        </form>
      )}

      {tab === "login" && (
        <form action={signInDemo} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${ids}-login-email`}>Email</Label>
            <Input
              id={`${ids}-login-email`}
              name="email"
              type="email"
              defaultValue={initialEmail}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${ids}-login-password`}>Parolă</Label>
            <Input
              id={`${ids}-login-password`}
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full bg-ink text-sea">
            <ArrowRight aria-hidden="true" /> Intră în panou
          </Button>

          <p className="text-center text-xs text-ink/60">
            <Link href="/demo/cont/parola" className="underline decoration-gold underline-offset-4">
              Am uitat parola
            </Link>
          </p>
        </form>
      )}

      <p className="mt-6 border-t border-ink/10 pt-4 text-center text-xs leading-relaxed text-ink/55">
        Copia ta de lucru se păstrează 7 zile, apoi se șterge automat. Poți cere ștergerea
        oricând, din bara panoului.
      </p>
    </div>
  );
}
