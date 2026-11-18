"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  KeyRound,
  Mail,
  Phone,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast, useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/marketing/theme-toggle";
import {
  OFFER_STATUS_LABEL,
  type OfferRequest,
  type OfferStatus,
} from "@/lib/platform-types";
import {
  ACCESS_DURATIONS,
  REPLY_TEMPLATES,
  durationDaysFromPeriod,
  keyMail,
  type ReplyContext,
  type ReplyTemplate,
} from "@/lib/mail-templates";
import { PUBLIC_SITE_URL } from "@/lib/message-template";
import { normalizeSlug } from "@/lib/slug";
import { replyToOffer, sendOfferKey, setOfferStatus } from "@/app/platform/actions";

const dateFmt = new Intl.DateTimeFormat("ro-RO", {
  timeZone: "Europe/Bucharest",
  dateStyle: "medium",
  timeStyle: "short",
});

type Filter = "toate" | OfferStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "toate", label: "Toate" },
  { id: "nou", label: "Noi" },
  { id: "raspuns", label: "Răspunse" },
  { id: "inchis", label: "Închise" },
];

const fieldClass =
  "flex w-full rounded-md border border-ink/20 bg-ink/10 px-3 py-2 text-base text-ink placeholder:text-ink/40 transition-[border-color,box-shadow,background-color] duration-200 ease-out hover:border-ink/35 focus-visible:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30";

function statusChip(status: OfferStatus) {
  if (status === "nou") return "border-gold/50 bg-gold/15 text-ink";
  if (status === "raspuns") return "border-ok/30 bg-ok/10 text-ok";
  return "border-ink/20 bg-ink/5 text-ink/60";
}

function contextFor(item: OfferRequest, price: string): ReplyContext {
  return {
    name: item.name,
    period: item.period ?? "",
    price,
    startUrl: `${PUBLIC_SITE_URL}/start`,
  };
}

function findTemplate(id: ReplyTemplate["id"]) {
  return REPLY_TEMPLATES.find((row) => row.id === id) ?? REPLY_TEMPLATES[0];
}

function ReplyForm({
  item,
  onSent,
  show,
}: {
  item: OfferRequest;
  onSent: (item: OfferRequest) => void;
  show: (message: string, tone?: "error" | "success") => void;
}) {
  const [tab, setTab] = useState<"raspuns" | "cheie">("raspuns");
  const [templateId, setTemplateId] = useState<ReplyTemplate["id"]>("oferta");
  const [price, setPrice] = useState("");
  const [subject, setSubject] = useState(() => findTemplate("oferta").subject(contextFor(item, "")));
  const [text, setText] = useState(() => findTemplate("oferta").body(contextFor(item, "")));
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [displayName, setDisplayName] = useState(item.name);
  const [duration, setDuration] = useState(() => durationDaysFromPeriod(item.period));
  const [code, setCode] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyPending, startKey] = useTransition();

  const slugPreview = normalizeSlug(displayName) || "client";
  // The owner sees the exact letter before sending; only the code is a stand-in.
  const preview = keyMail({
    code: "WED-XXXX-XXXX-XXXX-XXXX",
    days: duration,
    siteUrl: PUBLIC_SITE_URL,
  });

  const copyCode = () => {
    if (!code) return;
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  const apply = (id: ReplyTemplate["id"], priceValue: string) => {
    const chosen = findTemplate(id);
    const ctx = contextFor(item, priceValue);
    setSubject(chosen.subject(ctx));
    setText(chosen.body(ctx));
    setTouched(false);
  };

  const send = () => {
    start(async () => {
      const result = await replyToOffer({ id: item.id, subject, text });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      show("Răspuns trimis. Intră în același fir la client și apare în Emailuri.", "success");
      onSent({
        ...item,
        status: "raspuns",
        repliedAt: new Date().toISOString(),
        replyCount: item.replyCount + 1,
      });
    });
  };

  const sendKey = () => {
    startKey(async () => {
      const result = await sendOfferKey({
        id: item.id,
        displayName: displayName.trim(),
        durationDays: duration,
      });
      if (!result.ok) {
        setKeyError(result.error);
        // A key that exists but did not reach the client is not lost: the owner
        // copies it from here and sends it by hand.
        if (result.code) {
          setCode(result.code);
          setSlug(result.slug ?? null);
        }
        return;
      }
      setKeyError(null);
      setCode(result.code);
      setSlug(result.slug);
      show(
        "Cheia a plecat pe email, în același fir. O vezi mai jos, dacă vrei să o copiezi.",
        "success"
      );
      onSent({
        ...item,
        status: "raspuns",
        repliedAt: new Date().toISOString(),
        replyCount: item.replyCount + 1,
        keySentAt: new Date().toISOString(),
      });
    });
  };

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-ink/15 bg-ink/5 p-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Răspuns sau cheie">
        {(
          [
            ["raspuns", "Răspuns"],
            ["cheie", "Cheie de acces"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              tab === id ? "border-ink bg-ink text-sea" : "border-ink/25 hover:bg-ink/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "raspuns" && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
            <div className="space-y-1">
              <Label htmlFor={`template-${item.id}`} className="text-xs">
                Șablon
              </Label>
              <select
                id={`template-${item.id}`}
                value={templateId}
                onChange={(event) => {
                  const next = event.target.value as ReplyTemplate["id"];
                  setTemplateId(next);
                  apply(next, price);
                }}
                className={`${fieldClass} h-10`}
              >
                {REPLY_TEMPLATES.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-ink/65">{findTemplate(templateId).hint}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`price-${item.id}`} className="text-xs">
                Preț (lei, opțional)
              </Label>
              <Input
                id={`price-${item.id}`}
                value={price}
                onChange={(event) => {
                  setPrice(event.target.value);
                  if (!touched) apply(templateId, event.target.value);
                }}
                placeholder="1.200"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`subject-${item.id}`} className="text-xs">
              Subiect
            </Label>
            <Input
              id={`subject-${item.id}`}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`text-${item.id}`} className="text-xs">
              Mesaj
            </Label>
            <textarea
              id={`text-${item.id}`}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setTouched(true);
              }}
              rows={16}
              maxLength={8000}
              className={fieldClass}
            />
            <p className="text-xs text-ink/65">
              Textul se poate modifica liber. Schimbarea prețului rescrie mesajul doar dacă nu l-ai
              atins.
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-danger/35 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={send}
              disabled={pending || text.trim().length < 10}
              className="bg-ink text-sea"
            >
              <Send aria-hidden="true" /> {pending ? "Se trimite…" : "Trimite răspunsul"}
            </Button>
            <p className="text-xs text-ink/65">
              Pleacă de pe același Gmail, către {item.email}.
            </p>
          </div>
        </div>
      )}

      {tab === "cheie" && (
        <div className="space-y-3">
          <p className="text-xs text-ink/65">
            Pleacă un email separat, în același fir, doar cu cheia și pașii de activare. Textul este
            fix, ca pașii să nu se strice.
          </p>

          <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
            <div className="space-y-1">
              <Label htmlFor={`display-${item.id}`} className="text-xs">
                Numele clientului
              </Label>
              <Input
                id={`display-${item.id}`}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={120}
              />
              <p className="text-xs text-ink/65">Adresa publică: /{slugPreview}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`duration-${item.id}`} className="text-xs">
                Perioada
              </Label>
              <select
                id={`duration-${item.id}`}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className={`${fieldClass} h-10`}
              >
                {ACCESS_DURATIONS.map((row) => (
                  <option key={row.days} value={row.days}>
                    {row.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {item.keySentAt && !code && (
            <p className="rounded-md border border-ink/15 bg-ink/5 p-3 text-xs text-ink/65">
              Cererea are deja o cheie trimisă. Dacă trimiți alta, cheia veche nefolosită este
              revocată.
            </p>
          )}

          <details className="rounded-lg border border-ink/15 bg-ink/5 p-3">
            <summary className="cursor-pointer text-sm font-medium">Vezi emailul care pleacă</summary>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-ink/80">
              {preview.text}
            </pre>
          </details>

          {code && (
            <div className="rounded-lg border border-gold/50 bg-gold/10 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Cheia trimisă</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <code className="font-mono text-sm">{code}</code>
                <Button type="button" size="sm" variant="outline" onClick={copyCode}>
                  {copied ? "Copiat" : "Copiază"}
                </Button>
                {slug && <span className="text-xs text-ink/65">Client: /{slug}</span>}
              </div>
              <p className="mt-1 text-xs text-ink/65">
                Nu se mai poate vedea după ce închizi cererea. Clientul o activează o singură dată,
                la /start.
              </p>
            </div>
          )}

          {keyError && (
            <p role="alert" className="rounded-md border border-danger/35 bg-danger/10 p-3 text-sm text-danger">
              {keyError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={sendKey} disabled={keyPending} className="bg-ink text-sea">
              <KeyRound aria-hidden="true" /> {keyPending ? "Se trimite…" : "Trimite cheia"}
            </Button>
            <p className="text-xs text-ink/65">Către {item.email}, de pe același Gmail.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Cererile venite din formularul de pe site. Răspunsul se scrie aici și pleacă
 * în același fir cu cererea, deci nu mai e nevoie să cauți mesajul în Gmail.
 * Conținutul rămâne în platformă doar pentru cererile trimise de vizitatori.
 */
export function OffersPanel({ requests, configured }: { requests: OfferRequest[]; configured: boolean }) {
  const [items, setItems] = useState(requests);
  const [filter, setFilter] = useState<Filter>("toate");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { toast, show, dismiss } = useToast();

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "toate" && item.status !== filter) return false;
      if (!needle) return true;
      return `${item.name} ${item.email} ${item.period ?? ""} ${item.message}`
        .toLowerCase()
        .includes(needle);
    });
  }, [items, filter, query]);

  const newCount = items.filter((item) => item.status === "nou").length;

  const changeStatus = (item: OfferRequest, status: OfferStatus) => {
    start(async () => {
      const result = await setOfferStatus({ id: item.id, status });
      if (!result.ok) {
        show(result.error);
        return;
      }
      setItems((previous) => previous.map((row) => (row.id === item.id ? { ...row, status } : row)));
    });
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink/60">Platformă</p>
          <h1 className="font-display text-4xl">Mesaje</h1>
          <p className="mt-1 text-sm text-ink/65">
            Cererile trimise din site. Răspunsul pleacă în același fir, fără să deschizi Gmail.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link href="/platform/emailuri">Emailuri</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/platform">Clienți</Link>
          </Button>
        </div>
      </header>

      {!configured && (
        <p
          role="alert"
          className="glass mb-8 rounded-xl border border-warn/40 p-4 text-sm text-warn"
        >
          Cheia de service nu este configurată, așa că mesajele nu pot fi citite sau trimise.
        </p>
      )}

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Noi", String(newCount), newCount ? "așteaptă un răspuns" : "nimic în așteptare"],
          ["Total", String(items.length), "ultimele 200"],
          ["Răspunse", String(items.filter((item) => item.status === "raspuns").length), "cu răspuns trimis"],
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
          placeholder="Caută nume, email sau mesaj"
          className="w-full sm:w-72"
          aria-label="Caută în mesaje"
        />
      </div>

      {shown.length === 0 ? (
        <p className="glass rounded-xl border border-ink/15 p-6 text-sm text-ink/60">
          {items.length === 0
            ? "Nicio cerere încă. Aici apare fiecare mesaj trimis din formularul de pe pagina de prezentare, imediat după ce ajunge."
            : "Nicio cerere nu se potrivește cu filtrele."}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id}>
                <article className="glass rounded-xl border border-ink/15 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : item.id)}
                      aria-expanded={open}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-xl">{item.name}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${statusChip(item.status)}`}>
                          {OFFER_STATUS_LABEL[item.status]}
                        </span>
                        {item.period && (
                          <span className="rounded-full border border-ink/15 bg-ink/5 px-2 py-0.5 text-xs text-ink/70">
                            {item.period}
                          </span>
                        )}
                        {item.keySentAt && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-xs text-ok">
                            <KeyRound aria-hidden="true" className="size-3" />
                            Cheie trimisă
                          </span>
                        )}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/65">
                        <span className="inline-flex items-center gap-1">
                          <Clock aria-hidden="true" className="size-3.5" />
                          {dateFmt.format(new Date(item.at))}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Mail aria-hidden="true" className="size-3.5" />
                          {item.email}
                        </span>
                        {item.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone aria-hidden="true" className="size-3.5" />
                            {item.phone}
                          </span>
                        )}
                        {item.replyCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-ok">
                            <CheckCircle2 aria-hidden="true" className="size-3.5" />
                            {item.replyCount} {item.replyCount === 1 ? "răspuns" : "răspunsuri"}
                          </span>
                        )}
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenId(open ? null : item.id)}
                      >
                        <ChevronDown
                          aria-hidden="true"
                          className={`transition-transform ${open ? "rotate-180" : ""}`}
                        />
                        {open ? "Ascunde" : "Deschide"}
                      </Button>
                      {item.status === "inchis" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => changeStatus(item, "nou")}
                        >
                          <RotateCcw aria-hidden="true" /> Redeschide
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => changeStatus(item, "inchis")}
                        >
                          <XCircle aria-hidden="true" /> Închide
                        </Button>
                      )}
                    </div>
                  </div>

                  {open && (
                    <>
                      <div className="mt-4 rounded-lg border border-ink/10 bg-ink/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Mesajul cererii</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
                          {item.message}
                        </p>
                      </div>

                      <ReplyForm
                        key={item.id}
                        item={item}
                        show={show}
                        onSent={(updated) => {
                          setItems((previous) =>
                            previous.map((row) => (row.id === updated.id ? updated : row))
                          );
                        }}
                      />
                    </>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </main>
  );
}
