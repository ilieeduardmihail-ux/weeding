import type { Metadata } from "next";
import Link from "next/link";
import { LegalLink, LegalSection, LegalShell } from "@/components/marketing/legal-shell";
import { OPERATOR, SUB_PROCESSORS } from "@/lib/legal";
import { CONTACT_COMPOSE, CONTACT_EMAIL } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Subprocesatori",
  description: "Firmele care găzduiesc și deservesc platforma, cu locația și garanțiile de transfer.",
  robots: { index: false, follow: false },
};

export default function SubProcessorsPage() {
  return (
    <LegalShell
      current="/subprocesatori"
      title="Subprocesatori"
      intro={
        <>
          Ca să ținem invitațiile online avem nevoie de câteva firme. Fiecare primește doar datele
          necesare rolului ei și este legată printr-un acord de prelucrare.
        </>
      }
    >
      <LegalSection title="Lista actuală">
        <ul className="space-y-6">
          {SUB_PROCESSORS.map((processor) => (
            <li key={processor.name} className="rounded-2xl border border-ink/10 bg-paper/40 p-5">
              <p className="font-display text-xl text-ink">{processor.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{processor.role}.</p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ink/55">Locație</dt>
                  <dd className="text-ink/80">{processor.location}</dd>
                </div>
                <div>
                  <dt className="text-ink/55">Garanții de transfer</dt>
                  <dd className="text-ink/80">{processor.transfer}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm">
                <LegalLink href={processor.link}>Acordul de prelucrare al furnizorului</LegalLink>
              </p>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Ce nu facem">
        <p>
          Nu vindem date, nu le folosim pentru publicitate și nu le trimitem unor terți care nu apar
          în lista de mai sus. Instrumentele de statistică sunt fără cookie-uri și primesc doar
          numărul agregat de vizite.
        </p>
      </LegalSection>

      <LegalSection title="Schimbări și notificare">
        <p>
          Dacă adăugăm un furnizor nou care atinge date personale, actualizăm această pagină înainte
          de a-l folosi pentru nunți active și anunțăm clienții pe email. Mirii pot refuza un
          subprocesator nou, iar dacă refuzul face serviciul imposibil, pot înceta contractul fără
          penalitate.
        </p>
        <p>
          Întrebări despre un furnizor anume:{" "}
          <a
            href={CONTACT_COMPOSE}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
          >
            {CONTACT_EMAIL}
          </a>
          . Operator: {OPERATOR.name}, {OPERATOR.address}.
        </p>
        <p className="text-sm text-ink/55">
          Vezi și{" "}
          <Link href="/confidentialitate" className="underline underline-offset-4">
            confidențialitate
          </Link>{" "}
          și{" "}
          <Link href="/cookies" className="underline underline-offset-4">
            cookie-uri
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
