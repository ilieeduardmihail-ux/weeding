import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/marketing/legal-shell";
import { ContactLink } from "@/components/marketing/contact-link";
import { OPERATOR, TERMS_SECTIONS } from "@/lib/legal";
import { BRAND, CONTACT_EMAIL, PRICE } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description: "Condițiile în care realizăm și găzduim invitația digitală a nunții tale.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <LegalShell
      current="/termeni"
      title="Termeni și condiții"
      intro={
        <>
          Regulile simple ale colaborării: ce livrăm, cum se stabilește prețul și ce se întâmplă cu
          datele. {PRICE.title}
        </>
      }
    >
      {TERMS_SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="font-display text-2xl leading-snug text-ink">{section.title}</h2>
          <div className="mt-3 space-y-3 leading-relaxed">
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="font-display text-2xl leading-snug text-ink">10. Contact</h2>
        <div className="mt-3 space-y-3 leading-relaxed">
          <p>
            Pentru ofertă, modificări sau orice nelămurire legată de acești termeni, scrie-ne la{" "}
            <ContactLink className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink">
              {CONTACT_EMAIL}
            </ContactLink>
            . Datele operatorului sunt {OPERATOR.name}, {OPERATOR.address}, CUI {OPERATOR.cui}.
          </p>
          <p>
            Vezi și{" "}
            <Link href="/confidentialitate" className="text-ink underline decoration-ink/40 underline-offset-4">
              politica de confidențialitate
            </Link>{" "}
            și lista de{" "}
            <Link href="/subprocesatori" className="text-ink underline decoration-ink/40 underline-offset-4">
              subprocesatori
            </Link>
            .
          </p>
        </div>
      </section>

      <p className="text-sm text-ink/55">
        {BRAND} · documente disponibile și în panoul de administrare, la secțiunea Documente.
      </p>
    </LegalShell>
  );
}
