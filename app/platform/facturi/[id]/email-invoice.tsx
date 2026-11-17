"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Copy, Download, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Invoice, IssuerSettings } from "@/lib/platform-types";
import { invoiceEmailBody, invoiceEmailCopy, invoiceEmailSubject, isEmailLike } from "@/lib/invoice-email";
import { sendInvoiceEmail } from "@/app/platform/actions";

/**
 * The note goes out from the platform's own mailbox, with the PDF attached: the
 * owner types the address, presses once, and the client receives the same note
 * they would print. The address is not stored — every send can go elsewhere.
 *
 * A download and a copy button stay next to it, so the invoice can still be sent
 * by hand when mail is not configured or a send fails.
 */
export function EmailInvoice({
  invoice,
  issuer,
  sender,
}: {
  invoice: Invoice;
  issuer: IssuerSettings;
  /** The address invoices are sent from, or null when mail is not configured. */
  sender: string | null;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const [address, setAddress] = useState(invoice.clientEmail ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

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
    setSentTo(null);
    start(async () => {
      const result = await sendInvoiceEmail({ id: invoice.id, to });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSentTo(to);
    });
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

      {sender ? (
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
              onChange={(event) => {
                setAddress(event.target.value);
                setSentTo(null);
              }}
              placeholder="client@exemplu.ro"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "invoice-email-error" : undefined}
            />
          </div>
          <Button type="submit" disabled={pending} className="bg-ink text-sea">
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Mail aria-hidden="true" />}
            {pending ? "Se trimite…" : "Trimite factura"}
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-ink/70">
          Trimiterea automată nu este configurată. Poți descărca factura mai jos și o poți trimite
          tu, cu orice program de email.
        </p>
      )}

      {error && (
        <p id="invoice-email-error" role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      {sentTo && (
        <p role="status" className="mt-2 flex items-center gap-2 text-sm text-ok">
          <Check className="size-4" aria-hidden="true" /> Trimis către {sentTo}.
        </p>
      )}

      {sender && (
        <p className="mt-3 text-xs text-ink/60">
          Pleacă de la {sender}, cu factura atașată în format PDF. Adresa se scrie aici de fiecare
          dată și nu se salvează. Subiect: „{invoiceEmailSubject(invoice, issuer)}”.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <a href={`/platform/facturi/${invoice.id}/pdf`}>
            <Download aria-hidden="true" /> Descarcă PDF
          </a>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copiat" : "Copiază mesajul"}
        </Button>
        <span className="text-xs text-ink/55">Pentru trimitere manuală, din orice aplicație.</span>
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ink/45">Mesajul care pleacă</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink/60">
        {invoiceEmailBody(invoice, issuer, { attachment: Boolean(sender) })}
      </p>
    </details>
  );
}
