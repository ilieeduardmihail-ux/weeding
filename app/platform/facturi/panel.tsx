"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast, useToast } from "@/components/ui/toast";
import { formatMoney, invoiceTotals, type Invoice, type IssuerSettings } from "@/lib/platform-types";
import {
  createInvoice,
  deleteInvoice,
  saveIssuerSettings,
  setInvoicePaid,
} from "@/app/platform/actions";

export type InvoiceClient = {
  id: string;
  slug: string;
  displayName: string;
  email: string | null;
};

const dateFmt = new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" });

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFmt.format(new Date(value));
}

/** Accepts a Romanian-style amount ("1.200,50") and returns a number. */
function parseAmount(value: string) {
  const clean = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const amount = Number(clean);
  return Number.isFinite(amount) ? amount : 0;
}

export function InvoicesPanel({
  invoices,
  issuer,
  clients,
  today,
  configured,
  ownerEmail,
}: {
  invoices: Invoice[];
  issuer: IssuerSettings;
  clients: InvoiceClient[];
  today: string;
  configured: boolean;
  ownerEmail: string;
}) {
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [pending, start] = useTransition();

  const totals = invoiceTotals(invoices);
  const currency = issuer.currency || "RON";
  const run = (task: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const result = await task();
      if (!result.ok) {
        show(result.error ?? "Eroare.");
        return;
      }
      show(success, "success");
      router.refresh();
    });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Platformă</p>
          <h1 className="font-display text-4xl">Facturi</h1>
          <p className="mt-1 text-sm text-ink/65">
            Note de plată simple, fără TVA. Suma se scrie liber pe fiecare factură.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/platform">Clienți</Link>
          </Button>
        </div>
      </header>

      {!configured && (
        <p
          role="alert"
          className="glass mb-8 rounded-xl border border-amber-600/40 p-4 text-sm text-amber-900"
        >
          Cheia de service (SUPABASE_SERVICE_ROLE_KEY) nu este configurată, așa că facturile nu pot
          fi salvate.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Facturat", formatMoney(totals.total, currency), `${totals.count} facturi`],
          ["Încasat", formatMoney(totals.paid, currency), "facturi plătite"],
          ["De încasat", formatMoney(totals.unpaid, currency), "facturi neplătite"],
          ["Emitent", issuer.issuerName || "Necompletat", ownerEmail],
        ].map(([label, value, hint]) => (
          <div key={label} className="glass rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{label}</p>
            <p className="mt-1 font-display text-2xl">{value}</p>
            <p className="text-xs text-ink/55">{hint}</p>
          </div>
        ))}
      </section>

      <IssuerForm issuer={issuer} disabled={!configured || pending} />

      <NewInvoiceForm
        clients={clients}
        today={today}
        currency={currency}
        disabled={!configured || pending}
        onCreate={(input) => run(() => createInvoice(input), "Factură emisă.")}
      />

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl">Toate facturile</h2>
        {invoices.length === 0 ? (
          <p className="glass rounded-xl p-6 text-sm text-ink/70">Nu există încă nicio factură.</p>
        ) : (
          <div className="glass overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="px-4 py-3">Nr.</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Descriere</th>
                  <th className="px-4 py-3 text-right">Sumă</th>
                  <th className="px-4 py-3">Stare</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-ink/10 align-middle">
                    <td className="px-4 py-3 font-mono">{invoice.number}</td>
                    <td className="px-4 py-3">{formatDate(invoice.issuedAt)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{invoice.clientName}</span>
                      {invoice.clientSlug && (
                        <span className="block text-xs text-ink/55">/{invoice.clientSlug}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/75">{invoice.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-4 py-3">
                      {invoice.paid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800">
                          <CheckCircle2 className="size-3.5" aria-hidden="true" /> Plătită
                        </span>
                      ) : (
                        <span className="text-amber-800">Neplătită</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/platform/facturi/${invoice.id}`} aria-label="Deschide factura">
                            <FileText aria-hidden="true" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () => setInvoicePaid({ id: invoice.id, paid: !invoice.paid }),
                              invoice.paid ? "Factură marcată neplătită." : "Factură marcată plătită."
                            )
                          }
                        >
                          {invoice.paid ? "Neplătită" : "Încasată"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          aria-label="Șterge factura"
                          className="text-red-800 hover:bg-red-700/10"
                          onClick={() => {
                            if (!window.confirm(`Ștergi factura #${invoice.number}?`)) return;
                            run(() => deleteInvoice({ id: invoice.id }), "Factură ștearsă.");
                          }}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Toast toast={toast} onDismiss={dismiss} />
    </main>
  );
}

function IssuerForm({ issuer, disabled }: { issuer: IssuerSettings; disabled: boolean }) {
  const [pending, start] = useTransition();
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    start(async () => {
      const result = await saveIssuerSettings({
        issuerName: String(data.get("issuerName") ?? ""),
        issuerAddress: String(data.get("issuerAddress") ?? ""),
        issuerEmail: String(data.get("issuerEmail") ?? ""),
        issuerPhone: String(data.get("issuerPhone") ?? ""),
        issuerTaxId: String(data.get("issuerTaxId") ?? ""),
        issuerBank: String(data.get("issuerBank") ?? ""),
        issuerIban: String(data.get("issuerIban") ?? ""),
        currency: String(data.get("currency") ?? "RON"),
        footerNote: String(data.get("footerNote") ?? ""),
      });
      if (!result.ok) window.alert(result.error);
    });
  };

  const field = (name: string, label: string, value: string, placeholder = "") => (
    <div className="space-y-1">
      <Label htmlFor={`is-${name}`} className="text-xs">
        {label}
      </Label>
      <Input id={`is-${name}`} name={name} defaultValue={value} placeholder={placeholder} />
    </div>
  );

  return (
    <details className="glass mt-8 rounded-xl p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Date emitent (apar pe fiecare factură)
      </summary>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        {field("issuerName", "Nume / firmă", issuer.issuerName, "Numele tău sau al firmei")}
        {field("issuerTaxId", "CUI / CNP", issuer.issuerTaxId)}
        {field("issuerEmail", "Email", issuer.issuerEmail)}
        {field("issuerPhone", "Telefon", issuer.issuerPhone)}
        {field("issuerBank", "Bancă", issuer.issuerBank)}
        {field("issuerIban", "IBAN", issuer.issuerIban)}
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="is-issuerAddress" className="text-xs">
            Adresă
          </Label>
          <Input id="is-issuerAddress" name="issuerAddress" defaultValue={issuer.issuerAddress} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="is-currency" className="text-xs">
            Monedă implicită
          </Label>
          <Input id="is-currency" name="currency" defaultValue={issuer.currency} maxLength={8} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="is-footerNote" className="text-xs">
            Notă de subsol
          </Label>
          <Input
            id="is-footerNote"
            name="footerNote"
            defaultValue={issuer.footerNote}
            placeholder="Mulțumim!"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" variant="outline" disabled={disabled || pending}>
            Salvează datele emitentului
          </Button>
        </div>
      </form>
    </details>
  );
}

function NewInvoiceForm({
  clients,
  today,
  currency,
  disabled,
  onCreate,
}: {
  clients: InvoiceClient[];
  today: string;
  currency: string;
  disabled: boolean;
  onCreate: (input: {
    tenantId: string;
    clientName: string;
    clientEmail: string;
    clientSlug: string;
    issuedAt: string;
    description: string;
    amount: number;
    currency: string;
    notes: string;
  }) => void;
}) {
  const first = clients[0];
  const [clientId, setClientId] = useState(first?.id ?? "");
  const [name, setName] = useState(first?.displayName ?? "");
  const [slug, setSlug] = useState(first?.slug ?? "");
  const [email, setEmail] = useState(first?.email ?? "");

  const pick = (id: string) => {
    setClientId(id);
    const client = clients.find((item) => item.id === id);
    if (!client) {
      // "fără client (manual)": start from a blank note instead of keeping the
      // previous client's details.
      setName("");
      setSlug("");
      setEmail("");
      return;
    }
    setName(client.displayName);
    setSlug(client.slug);
    setEmail(client.email ?? "");
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    onCreate({
      tenantId: clientId,
      clientName: name,
      clientEmail: email,
      clientSlug: slug,
      issuedAt: String(data.get("issuedAt") ?? today),
      description: String(data.get("description") ?? "").trim(),
      amount: parseAmount(String(data.get("amount") ?? "")),
      currency: String(data.get("currency") ?? currency),
      notes: String(data.get("notes") ?? "").trim(),
    });
    form.reset();
    if (first) pick(first.id);
    else {
      setName("");
      setSlug("");
      setEmail("");
    }
  };

  return (
    <section className="glass mt-8 rounded-xl p-6">
      <h2 className="flex items-center gap-2 font-display text-2xl">
        <Receipt className="size-5" aria-hidden="true" /> Factură nouă
      </h2>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="inv-client" className="text-xs">
            Client
          </Label>
          <select
            id="inv-client"
            value={clientId}
            onChange={(event) => pick(event.target.value)}
            className="h-9 w-full rounded-md border border-ink/20 bg-transparent px-3 text-sm"
          >
            <option value="">— fără client (manual) —</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.displayName} (/{client.slug})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-issuedAt" className="text-xs">
            Data
          </Label>
          <Input id="inv-issuedAt" name="issuedAt" type="date" defaultValue={today} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-name" className="text-xs">
            Nume pe factură
          </Label>
          <Input
            id="inv-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ana & Stefan"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-email" className="text-xs">
            Email client (opțional)
          </Label>
          <Input
            id="inv-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="client@exemplu.ro"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="inv-slug" className="text-xs">
            Adresă (opțional)
          </Label>
          <Input id="inv-slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="inv-desc" className="text-xs">
            Descriere
          </Label>
          <Input
            id="inv-desc"
            name="description"
            defaultValue="Acces site invitație nuntă"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-amount" className="text-xs">
            Sumă
          </Label>
          <Input id="inv-amount" name="amount" inputMode="decimal" required placeholder="500" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-currency" className="text-xs">
            Monedă
          </Label>
          <Input id="inv-currency" name="currency" defaultValue={currency} maxLength={8} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="inv-notes" className="text-xs">
            Note (opțional)
          </Label>
          <Input id="inv-notes" name="notes" />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={disabled} className="bg-ink text-sea">
            <Plus aria-hidden="true" /> Emite factura
          </Button>
        </div>
      </form>
    </section>
  );
}
