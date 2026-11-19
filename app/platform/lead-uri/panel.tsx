"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Mail,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast, useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/marketing/theme-toggle";
import { normalizeSlug } from "@/lib/slug";
import type { PlatformLead } from "@/lib/platform-types";
import { archiveLead, convertLead, deleteLead, setLeadNote } from "@/app/platform/actions";

const dateFmt = new Intl.DateTimeFormat("ro-RO", {
  timeZone: "Europe/Bucharest",
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFmt.format(new Date(value));
}

const DAY = 86_400_000;

function daysLeft(expiresAt: string | null, now: number) {
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / DAY));
}

type Filter = "toate" | "noi" | "contactate" | "clienti" | "arhivate";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "toate", label: "Toate" },
  { id: "noi", label: "Noi" },
  { id: "contactate", label: "Contactate" },
  { id: "clienti", label: "Clienți" },
  { id: "arhivate", label: "Arhivate" },
];

const fieldClass =
  "flex w-full rounded-md border border-ink/20 bg-ink/10 px-3 py-2 text-base text-ink placeholder:text-ink/40 transition-[border-color,box-shadow,background-color] duration-200 ease-out hover:border-ink/35 focus-visible:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30";

function isConverted(lead: PlatformLead) {
  return Boolean(lead.sandboxTenantId) && !lead.isSandbox;
}

function StatusChips({ lead, now }: { lead: PlatformLead; now: number }) {
  const left = lead.isSandbox ? daysLeft(lead.expiresAt, now) : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      {lead.verifiedAt ? (
        <span className="rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-ok">
          Email confirmat
        </span>
      ) : (
        <span className="rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-warn">
          Cod neconfirmat
        </span>
      )}
      {lead.archivedAt ? (
        <span className="rounded-full border border-ink/20 bg-ink/5 px-2 py-0.5 text-ink/60">Arhivat</span>
      ) : null}
      {isConverted(lead) ? (
        <span className="rounded-full border border-gold/50 bg-gold/15 px-2 py-0.5 text-ink">Client</span>
      ) : lead.isSandbox && lead.sandboxTenantId ? (
        <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-ink">
          Demo{left === null ? "" : left === 0 ? " — expiră azi" : ` — ${left} ${left === 1 ? "zi" : "zile"}`}
        </span>
      ) : (
        <span className="rounded-full border border-ink/20 bg-ink/5 px-2 py-0.5 text-ink/60">
          Fără copie demo
        </span>
      )}
    </div>
  );
}

function ConvertForm({
  lead,
  onDone,
  show,
}: {
  lead: PlatformLead;
  onDone: (slug: string, days: number) => void;
  show: (message: string, tone?: "error" | "success") => void;
}) {
  const [displayName, setDisplayName] = useState(lead.name ?? "");
  const [slug, setSlug] = useState(() => normalizeSlug(lead.name ?? ""));
  const [days, setDays] = useState(365);
  const [plan, setPlan] = useState<"standard" | "premium">("standard");
  const [busy, start] = useTransition();

  const preview = slug || "adresa";

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    start(async () => {
      const result = await convertLead({ id: lead.id, slug, displayName, days, plan });
      if (!result.ok) {
        show(result.error);
        return;
      }
      onDone(result.slug, days);
      show(
        result.mailWarning
          ? result.mailWarning
          : `Nuntă activă la /${result.slug}. Clientul a primit emailul.`,
        result.mailWarning ? "error" : "success"
      );
    });
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Sparkles aria-hidden="true" className="size-4 text-gold" />
        Transformă copia demo în nuntă reală
      </p>
      <p className="mt-1 text-xs text-ink/65">
        Tot ce a lucrat rămâne. Se deblochează publicarea, exporturile, importul și tema.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Numele mirilor</Label>
          <input
            className={fieldClass}
            value={displayName}
            onChange={(event) => {
              const value = event.target.value;
              setDisplayName(value);
              setSlug(normalizeSlug(value));
            }}
            required
            minLength={2}
            maxLength={120}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Adresa publică</Label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-ink/50">/</span>
            <Input
              value={slug}
              onChange={(event) => setSlug(normalizeSlug(event.target.value))}
              required
              minLength={2}
              maxLength={60}
            />
          </div>
          <p className="text-[11px] text-ink/50">Se publică la /{preview}</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Perioada plătită</Label>
          <select
            className={fieldClass}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={180}>6 luni</option>
            <option value={365}>1 an</option>
            <option value={540}>1 an și 6 luni</option>
            <option value={730}>2 ani</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Pachet</Label>
          <select
            className={fieldClass}
            value={plan}
            onChange={(event) => setPlan(event.target.value === "premium" ? "premium" : "standard")}
          >
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy} className="bg-ink text-sea">
          <Wand2 aria-hidden="true" /> {busy ? "Se activează..." : "Activează nunta"}
        </Button>
        <p className="text-[11px] text-ink/55">
          Clientul primește un email cu linkul panoului. Dacă emailul eșuează, nunta rămâne activă.
        </p>
      </div>
    </form>
  );
}

function LeadCard({
  lead,
  now,
  onPatch,
  onRemove,
  show,
}: {
  lead: PlatformLead;
  now: number;
  onPatch: (id: string, patch: Partial<PlatformLead>) => void;
  onRemove: (id: string) => void;
  show: (message: string, tone?: "error" | "success") => void;
}) {
  const [note, setNote] = useState(lead.note ?? "");
  const [editing, setEditing] = useState(false);
  const [busy, start] = useTransition();

  const saveNote = () => {
    start(async () => {
      const result = await setLeadNote({ id: lead.id, note });
      if (!result.ok) {
        show(result.error);
        return;
      }
      onPatch(lead.id, { note: note.trim() || null });
      setEditing(false);
    });
  };

  const toggleArchive = () => {
    const archived = !lead.archivedAt;
    start(async () => {
      const result = await archiveLead({ id: lead.id, archived });
      if (!result.ok) {
        show(result.error);
        return;
      }
      onPatch(lead.id, { archivedAt: archived ? new Date().toISOString() : null });
    });
  };

  const remove = () => {
    const ok = window.confirm(
      `Ștergi lead-ul ${lead.email}? Dispare și copia demo, contul și tot ce a lucrat. Nu se poate anula.`
    );
    if (!ok) return;
    start(async () => {
      const result = await deleteLead({ id: lead.id });
      if (!result.ok) {
        show(result.error);
        return;
      }
      onRemove(lead.id);
      show("Lead-ul a fost șters.");
    });
  };

  return (
    <article className="glass rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-xl">
            {lead.name?.trim() || lead.email}
          </p>
          {lead.name?.trim() ? (
            <p className="truncate text-sm text-ink/65">{lead.email}</p>
          ) : null}
          <div className="mt-2">
            <StatusChips lead={lead} now={now} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {lead.sandboxSlug ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/${lead.sandboxSlug}/admin`} target="_blank">
                <ExternalLink aria-hidden="true" /> Panou
              </Link>
            </Button>
          ) : null}
          {isConverted(lead) && lead.sandboxSlug ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/${lead.sandboxSlug}`} target="_blank">
                <ExternalLink aria-hidden="true" /> Site
              </Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <a href={`mailto:${lead.email}`}>
              <Mail aria-hidden="true" /> Email
            </a>
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleArchive} disabled={busy}>
            {lead.archivedAt ? (
              <>
                <ArchiveRestore aria-hidden="true" /> Scoate din arhivă
              </>
            ) : (
              <>
                <Archive aria-hidden="true" /> Arhivează
              </>
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={remove} disabled={busy} className="text-red-700">
            <Trash2 aria-hidden="true" /> Șterge
          </Button>
        </div>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-ink/60 sm:grid-cols-3">
        <div>
          <dt className="inline text-ink/45">Înscris: </dt>
          <dd className="inline">{formatDate(lead.createdAt)}</dd>
        </div>
        <div>
          <dt className="inline text-ink/45">Confirmat: </dt>
          <dd className="inline">{formatDate(lead.verifiedAt)}</dd>
        </div>
        <div>
          <dt className="inline text-ink/45">
            {isConverted(lead) ? "Acces până la: " : "Expiră: "}
          </dt>
          <dd className="inline">{formatDate(lead.expiresAt)}</dd>
        </div>
      </dl>

      <div className="mt-3">
        {editing ? (
          <div className="space-y-2">
            <textarea
              className={`${fieldClass} min-h-20`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              placeholder="Ex: am sunat pe 20.11, revine după ce vorbește cu părinții."
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveNote} disabled={busy}>
                {busy ? "Se salvează..." : "Salvează nota"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNote(lead.note ?? "");
                  setEditing(false);
                }}
              >
                Renunță
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full rounded-lg border border-dashed border-ink/20 px-3 py-2 text-left text-xs text-ink/60 transition-colors hover:border-ink/35 hover:text-ink"
          >
            {lead.note ? (
              <>
                <span className="text-ink/45">Nota ta: </span>
                {lead.note}
              </>
            ) : (
              "Adaugă o notă — ce ai vorbit, când să revii."
            )}
          </button>
        )}
      </div>

      {lead.isSandbox && lead.sandboxTenantId ? (
        <ConvertForm
          lead={lead}
          onDone={(slug, days) =>
            onPatch(lead.id, {
              isSandbox: false,
              sandboxSlug: slug,
              expiresAt: new Date(Date.now() + days * DAY).toISOString(),
            })
          }
          show={show}
        />
      ) : null}
    </article>
  );
}

export function LeadsPanel({ leads, configured, now }: { leads: PlatformLead[]; configured: boolean; now: number }) {
  const [items, setItems] = useState(leads);
  const [filter, setFilter] = useState<Filter>("toate");
  const [query, setQuery] = useState("");
  const { toast, show, dismiss } = useToast();

  const patch = (id: string, changes: Partial<PlatformLead>) =>
    setItems((previous) => previous.map((lead) => (lead.id === id ? { ...lead, ...changes } : lead)));

  const remove = (id: string) => setItems((previous) => previous.filter((lead) => lead.id !== id));

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((lead) => {
      if (filter === "noi" && (lead.archivedAt || !lead.verifiedAt || lead.note)) return false;
      if (filter === "contactate" && (lead.archivedAt || !lead.note)) return false;
      if (filter === "clienti" && !isConverted(lead)) return false;
      if (filter === "arhivate" && !lead.archivedAt) return false;
      if (filter !== "arhivate" && lead.archivedAt) return false;
      if (!needle) return true;
      return `${lead.name ?? ""} ${lead.email} ${lead.note ?? ""}`.toLowerCase().includes(needle);
    });
  }, [items, filter, query]);

  const confirmed = items.filter((lead) => lead.verifiedAt).length;
  const active = items.filter((lead) => lead.isSandbox && lead.sandboxTenantId).length;
  const converted = items.filter(isConverted).length;
  const fresh = items.filter((lead) => lead.verifiedAt && !lead.archivedAt && !lead.note).length;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink/60">Platformă</p>
          <h1 className="font-display text-4xl">Lead-uri</h1>
          <p className="mt-1 text-sm text-ink/65">
            Vizitatori care și-au făcut cont demo și au confirmat codul. Copia lor trăiește 7 zile;
            dintr-un click devine nuntă reală.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link href="/platform/mesaje">Mesaje</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/platform">Clienți</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/platform/lead-uri/export" prefetch={false}>
              <Download aria-hidden="true" /> CSV
            </Link>
          </Button>
        </div>
      </header>

      {!configured && (
        <p role="alert" className="glass mb-8 rounded-xl border border-warn/40 p-4 text-sm text-warn">
          Cheia de service nu este configurată, așa că lead-urile nu pot fi citite.
        </p>
      )}

      <section className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          ["Confirmați", String(confirmed), "adrese reale"],
          ["Copy demo active", String(active), "în ultimele 7 zile"],
          ["Fără notă", String(fresh), "de sunat"],
          ["Clienți", String(converted), "convertiți din demo"],
        ].map(([label, value, hint]) => (
          <div key={label} className="glass rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">{label}</p>
            <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
            <p className="text-xs text-ink/65">{hint}</p>
          </div>
        ))}
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                filter === option.id
                  ? "border-ink bg-ink text-sea"
                  : "border-ink/25 hover:bg-ink/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Caută nume, email sau notă"
          className="w-full sm:w-64"
        />
      </div>

      <div className="space-y-3">
        {shown.map((lead) => (
          <LeadCard key={lead.id} lead={lead} now={now} onPatch={patch} onRemove={remove} show={show} />
        ))}

        {shown.length === 0 && (
          <p className="glass rounded-xl p-8 text-center text-sm text-ink/65">
            {items.length === 0
              ? "Încă niciun lead. Vizitatorii apar aici după ce confirmă codul din email."
              : "Nimic în filtrul ales."}
          </p>
        )}
      </div>

      <p className="mt-8 flex items-center gap-2 text-xs text-ink/50">
        <Clock aria-hidden="true" className="size-3.5" />
        Copiile demo expirate se șterg automat cu tot cu contul lor; lead-ul rămâne pentru un
        telefon.
        <CheckCircle2 aria-hidden="true" className="size-3.5" />
        Codul de email garantează că adresa este reală.
      </p>

      <Toast toast={toast} onDismiss={dismiss} />
    </main>
  );
}
