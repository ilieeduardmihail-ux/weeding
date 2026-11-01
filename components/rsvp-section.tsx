"use client";
import { useState, useTransition } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Armchair, CircleCheck } from "lucide-react";
import { checkRsvpStatus } from "@/app/actions";
import type { RsvpStatus } from "@/lib/rsvp-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RsvpForm } from "./rsvp-form";

type View = "lookup" | "form" | "card" | "thanks";

function StatusCard({ s, onChange, onOther }: { s: RsvpStatus; onChange: () => void; onOther: () => void }) {
  const first = s.name.split(" ")[0];
  const seated = s.attending && s.table_number !== null;

  return (
    <div role="status" className="mt-8 rounded-lg bg-mist p-8">
      {!s.attending ? (
        <>
          <p className="font-display text-3xl">Thank you, {first}.</p>
          <p className="mt-2 text-ink/75">You told us you can’t make it. We’ll miss you.</p>
        </>
      ) : (
        <>
          <p className="font-display text-3xl">Hi {first}!</p>
          {s.booked_by && <p className="mt-2 text-ink/75">{s.booked_by} replied for you.</p>}
          {seated ? (
            <>
              <p className="mt-3 flex items-center gap-2 text-sm font-medium">
                <CircleCheck className="size-5 text-gold" aria-hidden="true" /> RSVP Confirmed
              </p>
              <p className="mt-4 flex items-center gap-3 font-display text-3xl">
                <Armchair className="size-7 shrink-0 text-gold" aria-hidden="true" />
                You are seated at Table {s.table_number}
              </p>
            </>
          ) : (
            <p className="mt-3 flex items-start gap-2 text-lg">
              <CircleCheck className="mt-1 size-5 shrink-0 text-gold" aria-hidden="true" />
              RSVP Confirmed. Your table assignment will be available soon.
            </p>
          )}

          {s.party.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium">{s.booked_by ? "Your party" : "Your party"}</p>
              <ul className="mt-2 space-y-1 text-ink/80">
                {s.party.map((p) => (
                  <li key={p.name} className="flex justify-between gap-4">
                    <span>{p.name}</span>
                    <span className="text-ink/60">{p.table_number !== null ? `Table ${p.table_number}` : "Table to be assigned"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        {/* A plus-one can't edit the reply of the person who invited them */}
        {!s.booked_by && <Button type="button" variant="outline" onClick={onChange}>Change my reply</Button>}
        <Button type="button" variant="ghost" onClick={onOther}>Use a different name</Button>
      </div>
    </div>
  );
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));

export function RsvpSection({ closed, cutoffDate }: { closed: boolean; cutoffDate: string | null }) {
  if (!closed) return <RsvpFlow />;

  return (
    <MotionConfig reducedMotion="user">
      <section id="rsvp" className="mx-auto max-w-xl px-6 py-24">
        <h2 className="font-display text-4xl">Will you join us?</h2>
        <div role="status" className="mt-8 rounded-lg bg-mist p-8">
          <p className="font-display text-3xl">RSVPs are closed.</p>
          <p className="mt-2 text-ink/75">
            {cutoffDate ? `The form closed on ${formatDate(cutoffDate)}. ` : ""}
            If you still need to change your reply, please contact us directly.
          </p>
        </div>
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
      <section id="rsvp" className="mx-auto max-w-xl px-6 py-24">
        <h2 className="font-display text-4xl">Will you join us?</h2>
        <p className="mt-3 text-ink/70">
          {view === "lookup" && "Enter your name to reply, or to check your reply and your table."}
          {view === "form" && (notFound ? "We don’t have a reply under that name yet. Check the spelling, or add your reply below." : "Update your reply below.")}
          {view === "card" && "Here’s where things stand."}
        </p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {view === "lookup" && (
              <form onSubmit={(e) => { e.preventDefault(); lookup(clean, false); }} className="mt-8 space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="lookup-name">Your full name</Label>
                  <Input id="lookup-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                {error && <p role="alert" className="text-red-700">{error}</p>}
                <Button type="submit" size="lg" disabled={pending || clean.length < 3} className="w-full bg-ink text-sea hover:bg-ink/85">
                  {pending ? "Checking…" : "Continue"}
                </Button>
              </form>
            )}

            {view === "form" && (
              <>
                <RsvpForm initialName={clean} onDone={(n) => { setName(n); lookup(n, true); }} />
                <Button type="button" variant="ghost" className="mt-4" onClick={reset}>Use a different name</Button>
              </>
            )}

            {view === "card" && status && (
              <StatusCard s={status} onChange={() => { setNotFound(false); setView("form"); }} onOther={reset} />
            )}

            {view === "thanks" && (
              <div role="status" className="mt-8 rounded-lg bg-mist p-8">
                <p className="font-display text-3xl">Thank you!</p>
                <p className="mt-2 text-ink/75">Your reply is in. Come back and enter your name any time to check your table.</p>
                <Button type="button" variant="ghost" className="mt-6" onClick={reset}>Check another name</Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </MotionConfig>
  );
}
