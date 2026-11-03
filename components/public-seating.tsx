"use client";
import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { nameKey } from "@/lib/fuzzy";

type Table = { table: number; capacity: number; names: string[] };

type Match = { name: string; table: number };

export function PublicSeating({ tables }: { tables: Table[] }) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<number | null>(null);
  const cards = useRef(new Map<number, HTMLDivElement>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const everyone = useMemo<Match[]>(
    () => tables.flatMap((t) => t.names.map((name) => ({ name, table: t.table }))),
    [tables],
  );

  const matches = useMemo<Match[]>(() => {
    const q = nameKey(query);
    if (q.length < 2) return [];
    return everyone
      .filter((person) => nameKey(person.name).includes(q))
      .sort((a, b) => {
        const aExact = nameKey(a.name) === q ? 0 : 1;
        const bExact = nameKey(b.name) === q ? 0 : 1;
        return aExact - bExact || a.name.localeCompare(b.name);
      });
  }, [everyone, query]);

  const focusTable = (table: number) => {
    setHighlight(table);
    cards.current.get(table)?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHighlight(null), 2400);
  };

  const hasQuery = nameKey(query).length >= 2;

  return (
    <section id="seating" className="scroll-mt-24 bg-mist/60 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="font-display text-4xl">Unde stai</h2>
        <p className="mt-3 text-ink/70">
          Caută-ți numele în listă. Masa apare și când îți verifici răspunsul.
        </p>

        <div className="mt-8 rounded-xl border border-ink/15 bg-sea/40 p-4 sm:p-5">
          <label htmlFor="seat-search" className="text-sm font-medium">
            Caută-ți numele
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/50" aria-hidden />
            <input
              id="seat-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex: Popescu"
              autoComplete="off"
              className="w-full rounded-md border border-ink/25 bg-transparent py-2.5 pl-9 pr-3 text-sm transition-colors duration-200 focus:border-gold focus:outline-none"
            />
          </div>

          <div role="status" aria-live="polite" className="mt-4 min-h-6">
            {!hasQuery ? (
              <p className="text-sm text-ink/55">Scrie cel puțin două litere pentru a căuta.</p>
            ) : matches.length === 0 ? (
              <p className="text-sm text-ink/75">
                Nu am găsit niciun nume. Verifică ortografia sau întreabă-ne la{" "}
                <a href="#rsvp" className="text-gold underline decoration-gold/50 underline-offset-4 hover:decoration-gold">
                  confirmarea prezenței
                </a>
                .
              </p>
            ) : matches.length === 1 ? (
              <button
                type="button"
                onClick={() => focusTable(matches[0].table)}
                className="w-full rounded-lg border border-gold/50 bg-gold/10 px-4 py-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-gold hover:shadow-lg hover:shadow-black/10"
              >
                <span className="block text-sm text-ink/70">{matches[0].name}</span>
                <span className="mt-1 block font-display text-2xl text-gold">
                  Ai loc la masa {matches[0].table}
                </span>
              </button>
            ) : (
              <div>
                <p className="text-sm text-ink/70">{matches.length} persoane găsite:</p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {matches.slice(0, 8).map((match) => (
                    <li key={`${match.name}-${match.table}`}>
                      <button
                        type="button"
                        onClick={() => focusTable(match.table)}
                        className="flex w-full items-center justify-between gap-3 rounded-md border border-ink/15 px-3 py-2 text-left text-sm transition-colors duration-200 hover:border-gold/50 hover:bg-ink/5"
                      >
                        <span>{match.name}</span>
                        <span className="shrink-0 text-gold">Masa {match.table}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {matches.length > 8 && (
                  <p className="mt-2 text-xs text-ink/55">Scrie mai multe litere pentru a restrânge căutarea.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map(({ table, capacity, names }) => {
            const isHighlighted = highlight === table;
            return (
              <div
                key={table}
                ref={(node) => {
                  if (node) cards.current.set(table, node);
                  else cards.current.delete(table);
                }}
                className={`rounded-lg border bg-sea/70 p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lg hover:shadow-black/10 ${
                  isHighlighted ? "border-gold ring-2 ring-gold/40" : "border-ink/10"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-2xl">Masa {table}</h3>
                  <span className="text-xs text-ink/55">
                    {names.length}/{capacity} locuri
                  </span>
                </div>
                {names.length === 0 ? (
                  <p className="mt-3 text-sm text-ink/50">Nimeni încă.</p>
                ) : (
                  <ul className="mt-3 space-y-1 text-ink/80">
                    {names.map((name, index) => {
                      const isMatch = hasQuery && nameKey(name).includes(nameKey(query));
                      return (
                        <li key={`${name}-${index}`} className={isMatch ? "rounded bg-gold/15 px-1 text-gold" : undefined}>
                          {name}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
