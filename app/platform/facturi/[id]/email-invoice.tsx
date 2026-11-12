"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Invoice, IssuerSettings } from "@/lib/platform-types";
import {
  MAIL_PROVIDERS,
  invoiceEmailBody,
  invoiceEmailCopy,
  invoiceEmailSubject,
  invoiceEmailUrl,
  isEmailLike,
  isMailProvider,
  mailProviderOpensTab,
  type MailProvider,
} from "@/lib/invoice-email";

/** The owner's usual mail service, remembered in this browser. */
const PROVIDER_KEY = "wedding:invoice-mail";

/** localStorage does not notify anyone; the choice is re-rendered from state. */
const subscribeToNothing = () => () => {};

/**
 * Sending a note opens the owner's mailbox, not a server: the address is typed
 * here (prefilled when the invoice already has one, editable), the message is
 * already written, and the owner presses Send from a mailbox the client
 * recognises.
 *
 * It opens *their* webmail directly instead of a `mailto:`, because Windows
 * answers a mailto with "how do you want to open this?" and an empty tab when no
 * mail app is installed — which is exactly the case for someone who reads mail
 * in the browser.
 */
export function EmailInvoice({
  invoice,
  issuer,
}: {
  invoice: Invoice;
  issuer: IssuerSettings;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const [address, setAddress] = useState(invoice.clientEmail ?? "");
  const [chosen, setChosen] = useState<MailProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // The "Trimite" icon in the invoice list links to `#email`.
  useEffect(() => {
    if (window.location.hash === "#email" && details.current) details.current.open = true;
  }, []);

  // A remembered choice is external state: read it through the store hook so the
  // server-rendered markup stays untouched and no effect has to set state.
  const stored = useSyncExternalStore(
    subscribeToNothing,
    () => {
      try {
        return window.localStorage.getItem(PROVIDER_KEY) ?? "";
      } catch {
        return "";
      }
    },
    () => ""
  );
  const provider: MailProvider = chosen ?? (isMailProvider(stored) ? stored : "gmail");

  const chooseProvider = (next: MailProvider) => {
    setChosen(next);
    try {
      window.localStorage.setItem(PROVIDER_KEY, next);
    } catch {
      // Not remembered; the choice still applies to this send.
    }
  };

  const send = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const to = address.trim();
    if (!isEmailLike(to)) {
      setError("Scrie o adresă de email validă.");
      return;
    }
    setError(null);
    const url = invoiceEmailUrl(provider, invoice, issuer, to);
    if (mailProviderOpensTab(provider)) {
      // A real link click opens a tab without the popup blocker's permission,
      // and drops the opener reference (rel) so the mail site cannot navigate
      // this panel.
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    } else {
      window.location.href = url;
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invoiceEmailCopy(invoice, issuer));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Browserul nu a permis copierea. Selectează textul manual.");
    }
  };

  const opensTab = mailProviderOpensTab(provider);

  return (
    <details ref={details} id="email" className="glass mb-8 rounded-xl p-5 print:hidden">
      <summary className="cursor-pointer text-sm font-medium">Trimite pe email</summary>

      <form onSubmit={send} className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="invoice-email" className="text-xs">
              Adresa clientului
            </Label>
            <Input
              id="invoice-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="client@exemplu.ro"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "invoice-email-error" : undefined}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="invoice-mail-app" className="text-xs">
              Trimit prin
            </Label>
            <select
              id="invoice-mail-app"
              value={provider}
              onChange={(event) => chooseProvider(event.target.value as MailProvider)}
              className="h-9 w-full rounded-md border border-ink/20 bg-transparent px-3 text-sm"
            >
              {MAIL_PROVIDERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button type="submit" className="mt-4 bg-ink text-sea">
          <Mail aria-hidden="true" /> Deschide emailul
        </Button>
      </form>

      {error && (
        <p id="invoice-email-error" role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-ink/60">
        {opensTab
          ? "Se deschide un tab nou cu mesajul completat; apeși Trimite acolo."
          : "Se deschide aplicația de email instalată pe calculator."}{" "}
        Adresa o poți schimba oricând, iar trimiterea rămâne la tine. Subiect: „
        {invoiceEmailSubject(invoice, issuer)}”.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copiat" : "Copiază mesajul"}
        </Button>
        <span className="text-xs text-ink/55">
          Dacă nu se deschide nimic, alege altceva la „Trimit prin” sau copiază mesajul.
        </span>
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ink/45">Mesajul care pleacă</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink/60">{invoiceEmailBody(invoice, issuer)}</p>
    </details>
  );
}
