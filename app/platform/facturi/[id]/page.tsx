import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isOwnerRequest, platformIsConfigured } from "@/lib/platform";
import { loadInvoice } from "@/lib/platform-data";
import { formatMoney } from "@/lib/platform-types";
import { EmailInvoice } from "./email-invoice";
import { PrintButton } from "./print-button";

export const instant = false;

export const metadata: Metadata = {
  title: "Factură",
  robots: { index: false, follow: false },
};

const dateFmt = new Intl.DateTimeFormat("ro-RO", { dateStyle: "long" });

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFmt.format(new Date(value));
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  if (!(await isOwnerRequest())) redirect("/platform/login");
  if (!platformIsConfigured()) redirect("/platform/facturi");

  const { id } = await params;
  const loaded = await loadInvoice(id);
  if (!loaded) notFound();

  const { invoice, issuer } = loaded;
  const money = (amount: number) => formatMoney(amount, invoice.currency);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <ButtonLike />
        <PrintButton />
      </div>

      <EmailInvoice invoice={invoice} issuer={issuer} />

      <article className="glass rounded-xl p-10 print:border-0 print:bg-white print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-ink/15 pb-6">
          <div>
            <p className="font-display text-3xl">Notă de plată</p>
            <p className="text-sm text-ink/60">Fără TVA</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">Nr. {invoice.number}</p>
            <p className="text-ink/65">Data: {formatDate(invoice.issuedAt)}</p>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Emitent</p>
            <p className="mt-1 font-medium">{issuer.issuerName || "—"}</p>
            {issuer.issuerAddress && <p className="text-sm text-ink/70">{issuer.issuerAddress}</p>}
            {issuer.issuerTaxId && <p className="text-sm text-ink/70">CUI/CNP: {issuer.issuerTaxId}</p>}
            {issuer.issuerEmail && <p className="text-sm text-ink/70">{issuer.issuerEmail}</p>}
            {issuer.issuerPhone && <p className="text-sm text-ink/70">{issuer.issuerPhone}</p>}
            {issuer.issuerIban && (
              <p className="text-sm text-ink/70">
                {issuer.issuerBank ? `${issuer.issuerBank} · ` : ""}IBAN: {issuer.issuerIban}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Client</p>
            <p className="mt-1 font-medium">{invoice.clientName}</p>
            {invoice.clientSlug && <p className="text-sm text-ink/70">Site: /{invoice.clientSlug}</p>}
            {invoice.clientEmail && <p className="text-sm text-ink/70">{invoice.clientEmail}</p>}
          </div>
        </section>

        <table className="mt-8 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-ink/50">
            <tr className="border-b border-ink/15">
              <th className="py-2">Descriere</th>
              <th className="py-2 text-right">Sumă</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ink/10">
              <td className="py-3">{invoice.description}</td>
              <td className="py-3 text-right tabular-nums">{money(invoice.amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 text-right font-medium">Total de plată</td>
              <td className="py-3 text-right font-display text-xl tabular-nums">
                {money(invoice.amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-6 text-sm text-ink/70">
          Stare:{" "}
          {invoice.paid ? `plătită${invoice.paidAt ? ` la ${formatDate(invoice.paidAt)}` : ""}` : "neplătită"}
          {!invoice.paid && issuer.issuerIban ? ` · se poate achita în contul IBAN de mai sus.` : "."}
        </p>

        {invoice.notes && <p className="mt-4 text-sm text-ink/70">{invoice.notes}</p>}

        {issuer.footerNote && (
          <p className="mt-8 border-t border-ink/15 pt-4 text-sm text-ink/60">{issuer.footerNote}</p>
        )}
      </article>
    </main>
  );
}

function ButtonLike() {
  return (
    <Link
      href="/platform/facturi"
      className="inline-flex items-center gap-2 text-sm text-ink/70 underline-offset-4 transition-colors hover:text-ink hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" /> Înapoi la facturi
    </Link>
  );
}
