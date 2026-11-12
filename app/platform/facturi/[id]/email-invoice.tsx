"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Invoice, IssuerSettings } from "@/lib/platform-types";
import {
  invoiceEmailBody,
  invoiceEmailCopy,
  invoiceEmailSubject,
  invoiceMailto,
  isEmailLike,
} from "@/lib/invoice-email";

/**
 * Sending a note means opening the owner's own mail app, not a server: the
 * address is typed here (prefilled when the invoice already has one, editable),
 * the message is already written, and the owner presses Send from a mailbox the
 * client recognises.
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
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // The "Trimite" icon in the invoice list links to `#email`.
  useEffect(() => {
    if (window.location.hash === "#email" && details.current) details.current.open = true;
  }, []);

  const send = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const to = address.trim();
    if (!isEmailLike(to)) {
      setError("Scrie o adresă de email validă.");
      return;
    }
    setError(null);
    window.location.href = invoiceMailto(invoice, issuer, to);
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

  return (
    <details ref={details} id="email" className="glass mb-8 rounded-xl p-5 print:hidden">
      <summary className="cursor-pointer text-sm font-medium">Trimite pe email</summary>

      <form onSubmit={send} className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
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
        <Button type="submit" className="bg-ink text-sea">
          <Mail aria-hidden="true" /> Deschide emailul
        </Button>
      </form>

      {error && (
        <p id="invoice-email-error" role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-ink/60">
        Se deschide aplicația ta de email cu mesajul scris și factura în text. Adresa o poți
        schimba oricând, iar trimiterea rămâne la tine. Subiect: „{invoiceEmailSubject(invoice, issuer)}”.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copiat" : "Copiază mesajul"}
        </Button>
        <span className="text-xs text-ink/55">
          Folosește asta dacă îți citești emailul în browser.
        </span>
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ink/45">Mesajul care pleacă</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink/60">{invoiceEmailBody(invoice, issuer)}</p>
    </details>
  );
}
