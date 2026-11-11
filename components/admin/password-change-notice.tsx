"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, KeyRound, X } from "lucide-react";
import { setInitialPassword, type PasswordState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: PasswordState = {};

/**
 * First-login notice for accounts created with a generated password.
 *
 * The owner picks a password of their own right here, without waiting for an
 * email. Dismissing it keeps the flag, so it comes back on the next admin load
 * until the password is actually changed.
 */
export function PasswordChangeNotice({
  email,
  needsPassword,
}: {
  email: string;
  needsPassword: boolean;
}) {
  const router = useRouter();
  // Kept mounted even after the flag clears, so the owner still sees the
  // confirmation instead of the dialog vanishing under their cursor.
  const [open, setOpen] = useState(needsPassword);
  const [state, action, pending] = useActionState(setInitialPassword, initial);
  const [reveal, setReveal] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);
  const doneButton = useRef<HTMLButtonElement>(null);

  const done = state.ok === true;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending]);

  useEffect(() => {
    if (!open) return;
    if (done) doneButton.current?.focus();
    else firstField.current?.focus();
  }, [open, done]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    if (done) router.refresh(); // the layout reads the flag, so it must re-render
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-notice-title"
        aria-describedby="password-notice-text"
        className="glass animate-in fade-in relative w-full max-w-md rounded-2xl border border-gold/40 p-6 shadow-2xl duration-300"
      >
        <button
          type="button"
          onClick={close}
          disabled={pending}
          aria-label="Închide"
          className="absolute right-3 top-3 rounded-md p-1.5 text-ink/60 transition-colors duration-150 hover:bg-ink/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
            {done ? <Check className="size-5" aria-hidden /> : <KeyRound className="size-5" aria-hidden />}
          </span>
          <h2 id="password-notice-title" className="font-display text-2xl leading-tight">
            {done ? "Parolă salvată" : "Alege-ți parola"}
          </h2>
        </div>

        {done ? (
          <>
            <p id="password-notice-text" className="mt-4 text-sm leading-relaxed text-ink/75">
              Parola contului <strong className="text-ink">{email}</strong> a fost schimbată.
              De acum te autentifici cu parola pe care tocmai ai ales-o.
            </p>
            <p className="mt-2 text-xs text-ink/50">
              Notificarea aceasta nu va mai apărea la următoarea autentificare.
            </p>
            <Button ref={doneButton} type="button" onClick={close} className="mt-6 w-full">
              Continuă
            </Button>
          </>
        ) : (
          <>
            <p id="password-notice-text" className="mt-4 text-sm leading-relaxed text-ink/75">
              Contul a fost creat cu o parolă generată automat. Alege-ți acum una proprie,
              ca să nu rămână cea primită la început.
            </p>

            <form action={action} className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Parolă nouă</Label>
                <div className="relative">
                  <Input
                    ref={firstField}
                    id="password"
                    name="password"
                    type={reveal ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={pending}
                    aria-describedby="password-hint"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((value) => !value)}
                    aria-label={reveal ? "Ascunde parola" : "Arată parola"}
                    aria-pressed={reveal}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-ink/50 transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
                  >
                    {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Repetă parola</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type={reveal ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={pending}
                />
              </div>

              <p id="password-hint" className="text-xs text-ink/50">
                Minim 8 caractere. Doar tu vei ști parola.
              </p>

              {state.error && (
                <p
                  role="alert"
                  className="rounded-md border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm text-red-200"
                >
                  {state.error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={close} disabled={pending}>
                  Mai târziu
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Se salvează…" : "Salvează parola"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
