"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import { Check, Clock, Copy, Phone, Search, UserCheck, UserX, Users } from "lucide-react";
import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { AdminRealtime } from "@/components/admin/admin-realtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast, useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { nameKey } from "@/lib/fuzzy";

type Filter = "all" | "yes" | "no" | "pending";

// Fixed time zone so the server HTML and the hydrated client agree.
const dateFormat = new Intl.DateTimeFormat("ro-RO", {
  timeZone: "Europe/Bucharest",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateLabel = (iso: string) => dateFormat.format(new Date(iso));

const TABS: { id: Filter; label: string }[] = [
  { id: "all", label: "Toate răspunsurile" },
  { id: "yes", label: "Vin" },
  { id: "no", label: "Nu vin" },
  { id: "pending", label: "Fără răspuns" },
];

function StatCard({
  icon,
  value,
  label,
  tone = "ink",
}: {
  icon: ReactNode;
  value: number;
  label: string;
  tone?: "ink" | "emerald" | "rose" | "gold";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "rose"
        ? "text-rose-700"
        : tone === "gold"
          ? "text-gold"
          : "text-ink";
  return (
    <div className="glass rounded-xl p-4">
      <span className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55`}>
        {icon}
        {label}
      </span>
      <p className={`mt-2 font-display text-3xl tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

function Confirmari() {
  const { data } = useAdminData();
  const { toast, show, dismiss } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 200);

  const rows = data?.rsvps ?? [];
  const imported = data?.importedGuests ?? [];

  const summary = useMemo(() => {
    const yes = rows.filter((row) => row.attending);
    const no = rows.filter((row) => !row.attending);
    const respondedKeys = new Set(rows.map((row) => nameKey(row.name)));
    const pending = imported.filter((guest) => !respondedKeys.has(nameKey(guest.name)));
    const headcount = yes.reduce((total, row) => total + 1 + row.rsvp_guests.length, 0);
    return { yes, no, pending, headcount };
  }, [rows, imported]);

  const phoneByName = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const guest of imported) map.set(nameKey(guest.name), guest.phone);
    return map;
  }, [imported]);

  const q = nameKey(debounced);
  const matches = (name: string) => q === "" || nameKey(name).includes(q);

  const visibleResponses = useMemo(() => {
    if (filter === "pending") return [];
    const base = filter === "yes" ? summary.yes : filter === "no" ? summary.no : rows;
    return base.filter((row) => matches(row.name));
  }, [filter, rows, summary, q]);

  const visiblePending = useMemo(
    () => (filter === "pending" ? summary.pending.filter((guest) => matches(guest.name)) : []),
    [filter, summary, q]
  );

  const copyConfirmed = async () => {
    const lines = summary.yes.map((row) => {
      const extras = row.rsvp_guests.map((guest) => guest.name).join(", ");
      return `- ${row.name}${extras ? ` (+ ${extras})` : ""}`;
    });
    const text = `Confirmați — ${summary.headcount} persoane\n${lines.join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      show("Lista confirmaților a fost copiată.", "success");
    } catch {
      show("Nu am putut copia automat. Selectează textul și copiază-l manual.");
    }
  };

  if (!data) return <AdminSectionSkeleton />;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Confirmări</h1>
          <p className="mt-2 max-w-2xl text-ink/70">
            Cine a răspuns la invitație, dintr-o privire. Cei fără răspuns sunt invitații din lista
            importată care nu au completat încă formularul.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminRealtime />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={<Users className="size-4" aria-hidden />} value={imported.length} label="Invitați în listă" />
        <StatCard icon={<UserCheck className="size-4" aria-hidden />} value={summary.yes.length} label="Au confirmat" tone="emerald" />
        <StatCard icon={<Check className="size-4" aria-hidden />} value={summary.headcount} label="Persoane confirmate" tone="gold" />
        <StatCard icon={<UserX className="size-4" aria-hidden />} value={summary.no.length} label="Nu pot veni" tone="rose" />
        <StatCard icon={<Clock className="size-4" aria-hidden />} value={summary.pending.length} label="Fără răspuns" />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const active = tab.id === filter;
            const count =
              tab.id === "yes"
                ? summary.yes.length
                : tab.id === "no"
                  ? summary.no.length
                  : tab.id === "pending"
                    ? summary.pending.length
                    : rows.length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                aria-pressed={active}
                className={`rounded-full border px-4 py-1.5 text-sm transition-[background-color,border-color] duration-200 ease-out ${
                  active ? "border-gold/70 bg-ink text-sea" : "border-ink/15 hover:bg-ink/5"
                }`}
              >
                {tab.label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută un nume..."
            aria-label="Caută un nume"
            className="pl-9"
          />
        </div>

        <Button type="button" variant="outline" onClick={copyConfirmed}>
          <Copy aria-hidden="true" /> Copiază confirmații
        </Button>
      </div>

      {filter === "pending" ? (
        <section className="mt-6">
          {visiblePending.length === 0 ? (
            <p className="glass rounded-xl p-6 text-ink/70">
              {summary.pending.length === 0
                ? "Toți invitații din listă au răspuns."
                : "Niciun nume nu corespunde căutării."}
            </p>
          ) : (
            <ul className="glass divide-y divide-ink/10 rounded-xl">
              {visiblePending.map((guest) => (
                <li key={guest.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span>{guest.name}</span>
                  {guest.phone ? (
                    <a
                      href={`tel:${guest.phone}`}
                      className="flex items-center gap-1.5 text-sm text-ink/65 hover:text-ink"
                    >
                      <Phone className="size-3.5" aria-hidden />
                      {guest.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-ink/40">fără telefon</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="mt-6">
          {visibleResponses.length === 0 ? (
            <p className="glass rounded-xl p-6 text-ink/70">
              {rows.length === 0
                ? "Niciun răspuns încă. Vor apărea aici imediat ce cineva completează formularul."
                : "Niciun nume nu corespunde căutării."}
            </p>
          ) : (
            <ul className="glass divide-y divide-ink/10 rounded-xl">
              {visibleResponses.map((row) => {
                const phone = phoneByName.get(nameKey(row.name)) ?? row.phone;
                return (
                  <li key={row.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:gap-4">
                    <span
                      className={`mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.attending
                          ? "bg-emerald-600/12 text-emerald-800"
                          : "bg-rose-600/12 text-rose-800"
                      }`}
                    >
                      {row.attending ? <Check className="size-3.5" aria-hidden /> : <UserX className="size-3.5" aria-hidden />}
                      {row.attending ? "Vine" : "Nu vine"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{row.name}</p>
                      {row.rsvp_guests.length > 0 && (
                        <p className="text-sm text-ink/70">
                          + însoțitori: {row.rsvp_guests.map((guest) => guest.name).join(", ")}
                        </p>
                      )}
                      {row.message && <p className="mt-1 text-sm italic text-ink/70">„{row.message}”</p>}
                    </div>

                    <div className="text-sm text-ink/55 sm:text-right">
                      <p>{dateLabel(row.created_at)}</p>
                      {phone && <p className="mt-0.5">{phone}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </main>
  );
}

export default function ConfirmariPage() {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <Confirmari />
    </Suspense>
  );
}
