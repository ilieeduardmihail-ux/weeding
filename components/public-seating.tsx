"use client";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Search } from "lucide-react";
import { nameKey } from "@/lib/fuzzy";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { Reveal } from "@/components/ui/reveal";

type Table = { table: number; capacity: number; names: string[] };

type Match = { name: string; table: number };

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export function PublicSeating({ tables }: { tables: Table[] }) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<number | null>(null);
  const cards = useRef(new Map<number, HTMLDivElement>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Filtering settles a beat after the last keystroke; typing stays instant.
  const debouncedQuery = useDebouncedValue(query, 300);

  const everyone = useMemo<Match[]>(
    () => tables.flatMap((t) => t.names.map((name) => ({ name, table: t.table }))),
    [tables],
  );

  const matches = useMemo<Match[]>(() => {
    const q = nameKey(debouncedQuery);
    if (q.length < 2) return [];
    return everyone
      .filter((person) => nameKey(person.name).includes(q))
      .sort((a, b) => {
        const aExact = nameKey(a.name) === q ? 0 : 1;
        const bExact = nameKey(b.name) === q ? 0 : 1;
        return aExact - bExact || a.name.localeCompare(b.name);
      });
  }, [everyone, debouncedQuery]);

  const focusTable = (table: number) => {
    setHighlight(table);
    cards.current.get(table)?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHighlight(null), 2400);
  };

  const hasQuery = nameKey(debouncedQuery).length >= 2;
  const state = !hasQuery ? "idle" : matches.length === 0 ? "none" : matches.length === 1 ? "one" : "many";

  return (
    <MotionConfig reducedMotion="user">
      <section id="seating" className="scroll-mt-24 bg-mist/60 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <h2 className="font-display text-4xl">Unde stai</h2>
            <p className="mt-3 text-ink/70">
              Caută-ți numele în listă. Masa apare și când îți verifici răspunsul.
            </p>
          </Reveal>

          <Reveal delay={0.08} className="glass mt-8 rounded-xl p-4 sm:p-5">
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
                className="w-full rounded-md border border-ink/25 bg-transparent py-2.5 pl-9 pr-3 text-sm transition-[border-color,box-shadow] duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
              />
            </div>

            <div role="status" aria-live="polite" className="mt-4 min-h-6">
              <AnimatePresence mode="wait" initial={false}>
                {state === "idle" && (
                  <motion.p key="idle" {...fadeUp} transition={{ duration: 0.25 }} className="text-sm text-ink/55">
                    Scrie cel puțin două litere pentru a căuta.
                  </motion.p>
                )}

                {state === "none" && (
                  <motion.p key="none" {...fadeUp} transition={{ duration: 0.25 }} className="text-sm text-ink/75">
                    Nu am găsit niciun nume. Verifică ortografia sau întreabă-ne la{" "}
                    <a
                      href="#rsvp"
                      className="text-gold underline decoration-gold/50 underline-offset-4 transition-colors duration-200 hover:text-gold/85 hover:decoration-gold"
                    >
                      confirmarea prezenței
                    </a>
                    .
                  </motion.p>
                )}

                {state === "one" && matches[0] && (
                  <motion.button
                    key={`one-${matches[0].name}-${matches[0].table}`}
                    type="button"
                    onClick={() => focusTable(matches[0]!.table)}
                    initial={fadeUp.initial}
                    animate={fadeUp.animate}
                    exit={fadeUp.exit}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.995 }}
                    transition={{ duration: 0.3 }}
                    className="glass-soft w-full rounded-lg border border-gold/50 bg-gold/10 px-4 py-3 text-left shadow-[0_0_0_1px_rgb(217_180_106_/_0.15)] hover:border-gold hover:shadow-lg hover:shadow-black/20"
                  >
                    <span className="block text-sm text-ink/70">{matches[0].name}</span>
                    <span className="mt-1 block font-display text-2xl text-gold">
                      Ai loc la masa {matches[0].table}
                    </span>
                  </motion.button>
                )}

                {state === "many" && (
                  <motion.div
                    key={`many-${nameKey(debouncedQuery)}`}
                    initial={fadeUp.initial}
                    animate={fadeUp.animate}
                    exit={fadeUp.exit}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-ink/70">{matches.length} persoane găsite:</p>
                    <motion.ul layout className="mt-2 grid gap-2 sm:grid-cols-2">
                      <AnimatePresence initial={false}>
                        {matches.slice(0, 8).map((match, index) => (
                          <motion.li
                            key={`${match.name}-${match.table}`}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.18) }}
                          >
                            <button
                              type="button"
                              onClick={() => focusTable(match.table)}
                              className="glass-soft card-hover flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-ink/5"
                            >
                              <span>{match.name}</span>
                              <span className="shrink-0 text-gold">Masa {match.table}</span>
                            </button>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </motion.ul>
                    {matches.length > 8 && (
                      <p className="mt-2 text-xs text-ink/55">Scrie mai multe litere pentru a restrânge căutarea.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          <motion.div layout className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map(({ table, capacity, names }, index) => {
              const isHighlighted = highlight === table;
              return (
                <Reveal key={table} delay={Math.min(index * 0.06, 0.3)} amount={0.15}>
                  <motion.div
                    layout
                    animate={{ scale: isHighlighted ? 1.02 : 1 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    ref={(node) => {
                      if (node) cards.current.set(table, node);
                      else cards.current.delete(table);
                    }}
                    className="glass-soft card-hover relative h-full rounded-lg p-5"
                  >
                    {/* Gold emphasis as an opacity-only overlay: no border animation. */}
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-gold"
                      animate={{ opacity: isHighlighted ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
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
                        {names.map((name, nameIndex) => {
                          const isMatch = hasQuery && nameKey(name).includes(nameKey(debouncedQuery));
                          return (
                            <li key={`${name}-${nameIndex}`} className={isMatch ? "rounded bg-gold/15 px-1 text-gold" : undefined}>
                              {name}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </motion.div>
                </Reveal>
              );
            })}
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
