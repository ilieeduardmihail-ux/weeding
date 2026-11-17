"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MailEntry } from "@/lib/platform-types";

const dateFmt = new Intl.DateTimeFormat("ro-RO", {
  timeZone: "Europe/Bucharest",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const KIND_LABEL: Record<MailEntry["kind"], string> = {
  oferta: "Cerere de ofertă",
  raspuns: "Răspuns la cerere",
  factura: "Factură",
  cheie: "Cheie de acces",
};

type Filter = "all" | MailEntry["kind"];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Toate" },
  { id: "oferta", label: "Cereri" },
  { id: "raspuns", label: "Răspunsuri" },
  { id: "factura", label: "Facturi" },
  { id: "cheie", label: "Chei" },
];

/**
 * Only what the application sent, and only metadata: the text of an offer
 * request stays in Gmail, on purpose. Emails written by hand in Gmail are not
 * here — they never passed through the app.
 */
export function MailPanel({ mails, configured }: { mails: MailEntry[]; configured: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return mails.filter((mail) => {
      if (filter !== "all" && mail.kind !== filter) return false;
      if (!needle) return true;
      return `${mail.to} ${mail.subject} ${mail.tenantName ?? ""}`.toLowerCase().includes(needle);
    });
  }, [mails, filter, query]);

  const failed = mails.filter((mail) => !mail.ok).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Platformă</p>
          <h1 className="font-display text-4xl">Emailuri trimise</h1>
          <p className="mt-1 text-sm text-ink/65">
            Doar mesajele trimise din platformă, cu metadate. Conținutul rămâne în Gmail.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/platform">Clienți</Link>
        </Button>
      </header>

      {!configured && (
        <p
          role="alert"
          className="glass mb-8 rounded-xl border border-amber-600/40 p-4 text-sm text-amber-900"
        >
          Cheia de service nu este configurată, așa că jurnalul nu poate fi citit.
        </p>
      )}

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Trimise", String(mails.length), "ultimele 200"],
          ["Eșuate", String(failed), failed ? "verifică mai jos" : "niciuna"],
          ["Gmail", "Manual", "mesajele scrise de tine nu apar aici"],
        ].map(([label, value, hint]) => (
          <div key={label} className="glass rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{label}</p>
            <p className="mt-1 font-display text-2xl">{value}</p>
            <p className="text-xs text-ink/55">{hint}</p>
          </div>
        ))}
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                filter === option.id ? "border-ink bg-ink text-sea" : "border-ink/25 hover:bg-ink/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Caută adresă, subiect sau nuntă"
          className="w-full sm:w-72"
          aria-label="Caută în emailuri"
        />
      </div>

      {shown.length === 0 ? (
        <p className="glass rounded-xl border border-ink/15 p-6 text-sm text-ink/60">
          {mails.length === 0
            ? "Niciun email încă. Aici apar cererile de ofertă și facturile trimise din platformă, imediat după ce pleacă."
            : "Niciun email nu se potrivește cu filtrele."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-ink/25 text-xs uppercase tracking-[0.15em] text-ink/55">
              <tr>
                <th className="py-2 pr-3">Când</th>
                <th className="pr-3">Tip</th>
                <th className="pr-3">Către</th>
                <th className="pr-3">Subiect</th>
                <th className="pr-3">Nuntă</th>
                <th>Stare</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((mail) => (
                <tr key={mail.id} className="border-b border-ink/10 align-top">
                  <td className="whitespace-nowrap py-3 pr-3 text-ink/70">{dateFmt.format(new Date(mail.at))}</td>
                  <td className="pr-3">{KIND_LABEL[mail.kind]}</td>
                  <td className="pr-3">
                    <span className="select-all">{mail.to}</span>
                    {mail.replyTo && (
                      <span className="block text-xs text-ink/50">răspuns: {mail.replyTo}</span>
                    )}
                  </td>
                  <td className="pr-3">{mail.subject}</td>
                  <td className="pr-3 text-ink/70">{mail.tenantName ?? "—"}</td>
                  <td>
                    {mail.ok ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 aria-hidden className="size-4" /> trimis
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-red-800" title={mail.error ?? undefined}>
                        <AlertCircle aria-hidden className="size-4" /> eșuat
                        {mail.error && <span className="text-xs text-ink/55">({mail.error})</span>}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 flex items-center gap-2 text-xs text-ink/50">
        <Mail aria-hidden className="size-4" />
        Mesajele scrise manual în Gmail (șabloanele de ofertă, trimiterea cheii) nu trec prin aplicație,
        deci nu apar aici.
      </p>
    </main>
  );
}
