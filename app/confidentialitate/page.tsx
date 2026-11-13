import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, CONTACT_EMAIL, DEMO_PATH } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Confidențialitate",
  description: "Ce date prelucrează platforma, cine le deține și cum pot fi șterse.",
  robots: { index: false, follow: false },
};

/**
 * Platform-level note. The wedding-specific policy lives at
 * /<slug>/confidentialitate and is written from the couple's point of view:
 * they are the operator for their guests' RSVPs. This page only covers what the
 * service itself keeps.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-ink/60 underline-offset-4 transition-colors duration-200 ease-out hover:text-ink hover:underline"
      >
        ← Înapoi la {BRAND}
      </Link>

      <h1 className="mt-6 font-display text-4xl text-ink">Confidențialitate</h1>
      <p className="mt-3 text-ink/70">
        {BRAND} construiește site-uri de nuntă. Fiecare invitație are propria pagină de
        confidențialitate, scrisă de mirii care te-au invitat; aceasta explică doar ce păstrăm noi, ca
        platformă.
      </p>

      <div className="mt-10 space-y-8 text-ink/80">
        <section>
          <h2 className="font-display text-2xl text-ink">Cine suntem</h2>
          <p className="mt-2">
            Platforma este administrată de echipa {BRAND}. Pentru orice întrebare despre date, scrie-ne
            la{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Ce date păstrăm</h2>
          <p className="mt-2">
            Pentru mirii care ne contactează: numele, adresa de email și detaliile nunții (data,
            orașul, numărul de invitați). Pentru contul de administrare: adresa de email și o parolă
            stocată criptat de furnizorul de autentificare. Nu cerem date de plată prin site.
          </p>
          <p className="mt-2">
            Pentru invitați, datele din formularul de confirmare sunt păstrate în numele mirilor, care
            decid ce fac cu ele. Explicațiile complete sunt pe pagina de confidențialitate a fiecărei
            invitații.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Unde sunt găzduite</h2>
          <p className="mt-2">
            Site-urile rulează pe Vercel, iar datele sunt stocate în Supabase. Ambele servicii oferă
            garanții de securitate și de protecție a datelor. Accesul la panoul unei nunți este limitat
            la conturile mirilor.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Cookie-uri</h2>
          <p className="mt-2">
            Invitațiile publice nu folosesc cookie-uri de urmărire. Panoul de administrare setează doar
            cookie-urile necesare pentru autentificare; fără ele nu te poți ține minte conectat.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Cât timp le păstrăm</h2>
          <p className="mt-2">
            Datele unei nunți rămân cât timp site-ul este activ. La cerere, ștergem invitația, lista de
            invitați și confirmările. Mesajele de contact se păstrează cât timp purtăm discuția.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Drepturile tale</h2>
          <p className="mt-2">
            Poți cere acces la datele tale, corectarea lor sau ștergerea. Scrie-ne pe email și
            răspundem în cel mult 30 de zile. Dacă ești invitat, te poți adresa și mirilor, care sunt
            operatorul confirmării tale.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Datele din demo</h2>
          <p className="mt-2">
            Invitația de la{" "}
            <Link href={DEMO_PATH} className="text-ink underline decoration-ink/40 underline-offset-4">
              {DEMO_PATH}
            </Link>{" "}
            este fictivă: numele, locurile, sumele și confirmările sunt inventate pentru prezentare.
          </p>
        </section>
      </div>
    </main>
  );
}
