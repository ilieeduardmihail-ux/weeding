"use client";

import { useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmPasswordReset, startPasswordReset } from "../actions";

/**
 * Password recovery for demo accounts. Same two-step shape as the signup — a
 * code by email, then the new password — because there is no magic link to
 * click: every auth email is sent by us, from the platform's own address.
 */
export function ResetForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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

  const request = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    start(async () => {
      const result = await startPasswordReset(email);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEmail(result.email);
      setDevCode(result.devCode ?? null);
      setCooldown(60);
      setStep(2);
    });
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirm) {
      setError("Parolele nu coincid.");
      return;
    }
    setError(null);
    start(async () => {
      // On success the action signs the person in and redirects to the panel.
      const result = await confirmPasswordReset({ email, code, password });
      if (!result.ok) setError(result.error);
    });
  };

  const resend = () => {
    setError(null);
    start(async () => {
      const result = await startPasswordReset(email);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDevCode(result.devCode ?? null);
      setCooldown(60);
    });
  };

  if (step === 1) {
    return (
      <form onSubmit={request} className="glass space-y-4 rounded-2xl p-6">
        <div className="space-y-2">
          <Label htmlFor={`${ids}-email`}>Emailul contului</Label>
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

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full bg-ink text-sea">
          <KeyRound aria-hidden="true" /> {pending ? "Se trimite..." : "Trimite-mi un cod"}
        </Button>

        <p className="text-center text-xs text-ink/60">
          <Link href="/demo/cont" className="underline decoration-gold underline-offset-4">
            Înapoi la cont
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={save} className="glass space-y-4 rounded-2xl p-6">
      <div className="rounded-lg bg-ink/5 p-3 text-sm text-ink/75">
        Codul a plecat la <strong className="text-ink">{email}</strong>.
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${ids}-password`}>Parolă nouă</Label>
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
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${ids}-confirm`}>Confirmă parola</Label>
          <Input
            id={`${ids}-confirm`}
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
          />
        </div>
      </div>

      {devCode && (
        <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900">
          Mod local: codul este <strong>{devCode}</strong>.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending || code.length !== 6} className="w-full bg-ink text-sea">
        <KeyRound aria-hidden="true" /> {pending ? "Se salvează..." : "Setează parola și intră"}
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
          {cooldown > 0 ? `Alt cod în ${cooldown}s` : "Cere alt cod"}
        </button>
      </div>
    </form>
  );
}
