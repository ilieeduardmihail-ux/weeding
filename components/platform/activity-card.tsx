"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { EMPTY_VISITS, type VisitCounter, type VisitStats } from "@/lib/platform-types";

const nf = new Intl.NumberFormat("ro-RO");

const REFRESH_MS = 20_000;

function sum(a: VisitCounter, b: VisitCounter): VisitCounter {
  return {
    total: a.total + b.total,
    h24: a.h24 + b.h24,
    d7: a.d7 + b.d7,
    u24: a.u24 + b.u24,
    u7: a.u7 + b.u7,
  };
}

function CounterCard({
  title,
  hint,
  counter,
  accent,
}: {
  title: string;
  hint: string;
  counter: VisitCounter;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-gold/50 bg-ink text-sea" : "glass border-ink/15"}`}>
      <p className={`text-xs uppercase tracking-[0.2em] ${accent ? "text-sea/60" : "text-ink/50"}`}>{title}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{nf.format(counter.total)}</p>
      <p className={`text-xs ${accent ? "text-sea/55" : "text-ink/55"}`}>{hint}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className={accent ? "text-sea/60" : "text-ink/50"}>24h</dt>
          <dd className="tabular-nums">{nf.format(counter.h24)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className={accent ? "text-sea/60" : "text-ink/50"}>7 zile</dt>
          <dd className="tabular-nums">{nf.format(counter.d7)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className={accent ? "text-sea/60" : "text-ink/50"}>unici 24h</dt>
          <dd className="tabular-nums">{nf.format(counter.u24)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className={accent ? "text-sea/60" : "text-ink/50"}>unici 7 zile</dt>
          <dd className="tabular-nums">{nf.format(counter.u7)}</dd>
        </div>
      </dl>
    </div>
  );
}

function hourLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", timeZone: "Europe/Bucharest" }).format(date);
}

/**
 * The owner's view of traffic: the presentation page and every invitation, plus
 * an hour-by-hour chart for the last day. It refreshes itself; the numbers come
 * from `/api/platform/activity`, which checks the owner session on every call.
 */
export function ActivityCard({ initial }: { initial: VisitStats }) {
  const [stats, setStats] = useState<VisitStats>(initial);
  const [live, setLive] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const response = await fetch("/api/platform/activity", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const next = (await response.json()) as VisitStats;
        if (cancelled) return;
        setStats(next);
        setLive(true);
      } catch {
        if (!cancelled) setLive(false);
      }
    };

    const schedule = () => {
      timer = window.setInterval(load, REFRESH_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const marketing = stats.marketing ?? EMPTY_VISITS;
  const invites = stats.invites ?? EMPTY_VISITS;
  const total = sum(marketing, invites);
  const hours = stats.hourly ?? [];
  const peak = Math.max(1, ...hours.map((hour) => hour.marketing + hour.invites));

  return (
    <section aria-labelledby="activity-title" className="mb-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="activity-title" className="flex items-center gap-2 font-display text-2xl">
          <Activity aria-hidden="true" className="size-5 text-gold" />
          Activitate
        </h2>
        <p className="inline-flex items-center gap-2 text-xs text-ink/55" role="status">
          <span aria-hidden className={`size-2 rounded-full ${live ? "bg-emerald-600" : "bg-ink/30"}`} />
          {live ? "actualizat automat" : "reconectare…"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CounterCard
          title="Site de prezentare"
          hint="doar pagina principală"
          counter={marketing}
        />
        <CounterCard
          title="Invitații"
          hint="toate nunțile la un loc"
          counter={invites}
        />
        <CounterCard
          title="Total"
          hint="prezentare + invitații"
          counter={total}
          accent
        />
      </div>

      <div className="glass mt-3 rounded-xl border border-ink/15 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Ultimele 24 de ore</p>
          <p className="flex items-center gap-3 text-xs text-ink/55">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2 rounded-sm bg-gold" /> invitații
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2 rounded-sm bg-ink/45" /> prezentare
            </span>
          </p>
        </div>

        {hours.length === 0 ? (
          <p className="mt-3 text-sm text-ink/55">
            Încă nu sunt vizite înregistrate. Contorul pornește după ce rulezi migrarea și
            primești prima vizită.
          </p>
        ) : (
          <div className="mt-3 flex h-24 items-end gap-1" role="img" aria-label="Vizite pe ore în ultimele 24 de ore">
            {hours.map((hour, index) => {
              const height = ((hour.marketing + hour.invites) / peak) * 100;
              const inviteShare =
                hour.marketing + hour.invites === 0 ? 0 : (hour.invites / (hour.marketing + hour.invites)) * 100;
              return (
                <div
                  key={hour.hour || index}
                  className="flex h-full flex-1 flex-col justify-end"
                  title={`${hourLabel(hour.hour)} — ${hour.invites} invitații, ${hour.marketing} prezentare`}
                >
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden rounded-sm"
                    style={{ height: `${Math.max(height, hour.marketing + hour.invites ? 3 : 0)}%` }}
                  >
                    <div className="w-full bg-gold" style={{ height: `${inviteShare}%` }} />
                    <div className="w-full flex-1 bg-ink/45" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hours.length > 0 && (
          <div className="mt-1 flex justify-between text-[10px] text-ink/40">
            {[0, 6, 12, 18, 23].map((index) => (
              <span key={index}>{hourLabel(hours[Math.min(index, hours.length - 1)]?.hour ?? "")}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
