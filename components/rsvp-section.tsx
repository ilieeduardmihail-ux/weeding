"use client";
import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { CircleCheck } from "lucide-react";
import { checkRsvpStatus } from "@/app/actions";
import type { RsvpStatus } from "@/lib/rsvp-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/ui/reveal";

// The reply form (and the form library plus schema it depends on) is only
// fetched once a guest actually reaches the form: typing a name and pressing
// "Continuă" already involves a server round-trip, so the extra chunk lands
// well before it matters, and the first visit stays light.
const RsvpForm = dynamic(() => import("@/components/rsvp-form").then((mod) => mod.RsvpForm), {
  ssr: false,
  loading: () => <div aria-hidden className="glass mt-8 h-44 animate-pulse rounded-xl" />,
});

type View = "lookup" | "form" | "card" | "thanks";

function StatusCard({ s, onChange, onOther }: { s: RsvpStatus; onChange: () => void; onOther: () => void }) {
  const first = s.name.split(" ")[0];

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
          <p className="mt-3 flex items-start gap-2 text-lg">
            <CircleCheck className="mt-1 size-5 shrink-0 text-gold" aria-hidden="true" />
            Prezență confirmată.
          </p>

          {s.party.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium">Însoțitorii tăi</p>
              <ul className="mt-2 space-y-1 text-ink/80">
                {s.party.map((p) => (
                  <li key={p.name}>
                    <span>{p.name}</span>
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

export function RsvpSection({
  tenantId,
  slug,
  closed,
  cutoffDate,
  initialName = "",
}: {
  tenantId: string;
  slug: string;
  closed: boolean;
  cutoffDate: string | null;
  initialName?: string;
}) {
  if (!closed) return <RsvpFlow tenantId={tenantId} slug={slug} initialName={initialName} />;

  return (
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
  );
}

function RsvpFlow({ tenantId, slug, initialName }: { tenantId: string; slug: string; initialName: string }) {
  const [view, setView] = useState<View>("lookup");
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const clean = name.replace(/\s+/g, " ").trim();

  const lookup = (who: string) =>
    start(async () => {
      setError(null);
      const r = await checkRsvpStatus(who, tenantId);
      if (!r.ok) { setError(r.error); return; }
      if (r.status) { setStatus(r.status); setNotFound(false); setView("card"); return; }
      setNotFound(true); // no reply under this name yet, so show the form
      setView("form");
    });

  const reset = () => { setView("lookup"); setStatus(null); setNotFound(false); setError(null); };

  return (
    <section id="rsvp" className="mx-auto max-w-xl scroll-mt-24 px-6 py-24">
      <Reveal>
        <h2 className="font-display text-4xl">Vii la nuntă?</h2>
        <p className="mt-3 text-ink/70">
          {view === "lookup" && "Scrie-ți numele ca să răspunzi sau să-ți verifici răspunsul."}
          {view === "form" && (notFound ? "Nu avem încă un răspuns pe acest nume. Verifică ortografia sau adaugă răspunsul mai jos." : "Actualizează-ți răspunsul mai jos.")}
          {view === "card" && "Iată situația."}
        </p>
      </Reveal>

      {/* `key` restarts the fade whenever the step changes. */}
      <div key={view} className="animate-swap-in motion-reduce:animate-none">
        {view === "lookup" && (
          <form onSubmit={(e) => { e.preventDefault(); lookup(clean); }} className="glass mt-8 space-y-4 rounded-xl p-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="lookup-name">Numele complet</Label>
              <Input id="lookup-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {error && <p role="alert" className="text-red-700">{error}</p>}
            <Button type="submit" size="lg" disabled={pending || clean.length < 3} className="w-full bg-ink text-sea hover:bg-ink/85">
              {pending ? "Se verifică..." : "Continuă"}
            </Button>
          </form>
        )}

        {view === "form" && (
          <>
            <RsvpForm
              tenantId={tenantId}
              slug={slug}
              initialName={clean}
              // The server already confirmed the write, so the thank-you card
              // shows at once instead of asking for the status a second time.
              onDone={(n) => { setName(n); setStatus(null); setView("thanks"); }}
            />
            <Button type="button" variant="ghost" className="mt-4" onClick={reset}>Folosește alt nume</Button>
          </>
        )}

        {view === "card" && status && (
          <StatusCard s={status} onChange={() => { setNotFound(false); setView("form"); }} onOther={reset} />
        )}

        {view === "thanks" && (
          <div role="status" className="glass mt-8 rounded-lg p-8">
            <p className="font-display text-3xl">Mulțumim!</p>
            <p className="mt-2 text-ink/75">Răspunsul tău a fost înregistrat. Revino oricând cu numele tău ca să îl verifici.</p>
            <Button type="button" variant="ghost" className="mt-6" onClick={reset}>Verifică alt nume</Button>
          </div>
        )}
      </div>
    </section>
  );
}
