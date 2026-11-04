"use client";
import { useState, useTransition } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Armchair, CircleCheck } from "lucide-react";
import { checkRsvpStatus } from "@/app/actions";
import type { RsvpStatus } from "@/lib/rsvp-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/ui/reveal";
import { RsvpForm } from "./rsvp-form";

type View = "lookup" | "form" | "card" | "thanks";

function StatusCard({ s, onChange, onOther }: { s: RsvpStatus; onChange: () => void; onOther: () => void }) {
  const first = s.name.split(" ")[0];
  const seated = s.attending && s.table_number !== null;

  return (
    <div role="status" className="glass mt-8 rounded-lg p-8">
      {!s.attending ? (
        <>
          <p className="font-display text-3xl">Mulțumim, {first}.</p>
          <p className="mt-2 text-ink/75">Ne-ai spus că nu poți ajunge. Ne va fi dor de tine.</p>
        </>
      ) : (
        <>
          <p className="font-display text-3xl">Bună, {first}!</p>
          {s.booked_by && <p className="mt-2 text-ink/75">{s.booked_by} a răspuns pentru tine.</p>}
          {seated ? (
            <>
              <p className="mt-3 flex items-center gap-2 text-sm font-medium">
                <CircleCheck className="size-5 text-gold" aria-hidden="true" /> Prezență confirmată
              </p>
              <p className="mt-4 flex items-center gap-3 font-display text-3xl">
                <Armchair className="size-7 shrink-0 text-gold" aria-hidden="true" />
                Stai la masa {s.table_number}
              </p>
            </>
          ) : (
            <p className="mt-3 flex items-start gap-2 text-lg">
              <CircleCheck className="mt-1 size-5 shrink-0 text-gold" aria-hidden="true" />
              Prezență confirmată. Îți spunem în curând la ce masă stai.
            </p>
          )}

          {s.party.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium">Însoțitorii tăi</p>
              <ul className="mt-2 space-y-1 text-ink/80">
                {s.party.map((p) => (
                  <li key={p.name} className="flex justify-between gap-4">
                    <span>{p.name}</span>
                    <span className="text-ink/60">{p.table_number !== null ? `Masa ${p.table_number}` : "Masă nealocată"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        {/* A plus-one can't edit the reply of the person who invited them */}
        {!s.booked_by && <Button type="button" variant="outline" onClick={onChange}>Modifică răspunsul</Button>}
        <Button type="button" variant="ghost" onClick={onOther}>Folosește alt nume</Button>
      </div>
    </div>
  );
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));

export function RsvpSection({ closed, cutoffDate }: { closed: boolean; cutoffDate: string | null }) {
  if (!closed) return <RsvpFlow />;

  return (
    <MotionConfig reducedMotion="user">
      <section id="rsvp" className="mx-auto max-w-xl scroll-mt-24 px-6 py-24">
        <Reveal>
          <h2 className="font-display text-4xl">Vii la nuntă?</h2>
          <div role="status" className="glass mt-8 rounded-lg p-8">
            <p className="font-display text-3xl">Confirmările sunt închise.</p>
            <p className="mt-2 text-ink/75">
              {cutoffDate ? `Formularul s-a închis pe ${formatDate(cutoffDate)}. ` : ""}
              Dacă mai vrei să modifici ceva, scrie-ne direct.
            </p>
          </div>
        </Reveal>
      </section>
    </MotionConfig>
  );
}

function RsvpFlow() {
  const [view, setView] = useState<View>("lookup");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const clean = name.replace(/\s+/g, " ").trim();

  const lookup = (who: string, afterSubmit: boolean) =>
    start(async () => {
      setError(null);
      const r = await checkRsvpStatus(who);
      if (!r.ok) { setError(r.error); if (afterSubmit) setView("thanks"); return; }
      if (r.status) { setStatus(r.status); setNotFound(false); setView("card"); return; }
      if (afterSubmit) { setView("thanks"); return; }
      setNotFound(true); // no reply under this name yet, so show the form
      setView("form");
    });

  const reset = () => { setView("lookup"); setStatus(null); setNotFound(false); setError(null); };

  return (
    <MotionConfig reducedMotion="user">
      <section id="rsvp" className="mx-auto max-w-xl scroll-mt-24 px-6 py-24">
        <Reveal>
          <h2 className="font-display text-4xl">Vii la nuntă?</h2>
          <p className="mt-3 text-ink/70">
            {view === "lookup" && "Scrie-ți numele ca să răspunzi sau să-ți verifici răspunsul și masa."}
            {view === "form" && (notFound ? "Nu avem încă un răspuns pe acest nume. Verifică ortografia sau adaugă răspunsul mai jos." : "Actualizează-ți răspunsul mai jos.")}
            {view === "card" && "Iată situația."}
          </p>
        </Reveal>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {view === "lookup" && (
              <form onSubmit={(e) => { e.preventDefault(); lookup(clean, false); }} className="glass mt-8 space-y-4 rounded-xl p-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="lookup-name">Numele complet</Label>
                  <Input id="lookup-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                {error && <p role="alert" className="text-red-300">{error}</p>}
                <Button type="submit" size="lg" disabled={pending || clean.length < 3} className="w-full bg-ink text-sea hover:bg-ink/85">
                  {pending ? "Se verifică…" : "Continuă"}
                </Button>
              </form>
            )}

            {view === "form" && (
              <>
                <RsvpForm initialName={clean} onDone={(n) => { setName(n); lookup(n, true); }} />
                <Button type="button" variant="ghost" className="mt-4" onClick={reset}>Folosește alt nume</Button>
              </>
            )}

            {view === "card" && status && (
              <StatusCard s={status} onChange={() => { setNotFound(false); setView("form"); }} onOther={reset} />
            )}

            {view === "thanks" && (
              <div role="status" className="glass mt-8 rounded-lg p-8">
                <p className="font-display text-3xl">Mulțumim!</p>
                <p className="mt-2 text-ink/75">Răspunsul tău a fost înregistrat. Revino oricând cu numele tău ca să vezi masa.</p>
                <Button type="button" variant="ghost" className="mt-6" onClick={reset}>Verifică alt nume</Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </MotionConfig>
  );
}
