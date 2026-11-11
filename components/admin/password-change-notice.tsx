"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { KeyRound, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendPasswordResetEmail } from "@/app/admin/actions";

/**
 * First-login notice for accounts created with a generated password.
 * It stays out of the way (one click to postpone) but comes back on the next
 * admin load until the owner actually sets a password.
 */
export function PasswordChangeNotice({ email }: { email: string }) {
  const [open, setOpen] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    primary.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const send = () =>
    startTransition(async () => {
      setError(null);
      const result = await sendPasswordResetEmail();
      if (result.ok) setSent(true);
      else setError(result.error);
    });

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
          onClick={() => setOpen(false)}
          aria-label="Închide"
          className="absolute right-3 top-3 rounded-md p-1.5 text-ink/60 transition-colors duration-150 hover:bg-ink/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
            <KeyRound className="size-5" aria-hidden />
          </span>
          <h2 id="password-notice-title" className="font-display text-2xl leading-tight">
            {sent ? "Email trimis" : "Alege-ți parola"}
          </h2>
        </div>

        {sent ? (
          <>
            <p id="password-notice-text" className="mt-4 text-sm leading-relaxed text-ink/75">
              Ți-am trimis un email la <strong className="text-ink">{email}</strong> cu un
              link sigur pentru schimbarea parolei. Deschide-l și setează parola dorită.
              Verifică și folderul Spam.
            </p>
            <Button
              ref={primary}
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full"
            >
              Am înțeles
            </Button>
          </>
        ) : (
          <>
            <p id="password-notice-text" className="mt-4 text-sm leading-relaxed text-ink/75">
              Contul acesta a fost creat cu o parolă generată automat. Îți trimitem un
              email cu un link prin care îți alegi propria parolă, ca să nu rămână cea
              primită la început.
            </p>
            <p className="mt-2 text-xs text-ink/50">
              Emailul ajunge la {email}. Poți amâna, dar îți vom reaminti la următoarea
              autentificare.
            </p>
            {error && (
              <p role="alert" className="mt-3 rounded-md border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Mai târziu
              </Button>
              <Button ref={primary} type="button" onClick={send} disabled={pending}>
                <Mail className="size-4" aria-hidden />
                {pending ? "Se trimite…" : "Trimite emailul"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
