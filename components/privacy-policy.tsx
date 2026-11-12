import Link from "next/link";
import { Footer } from "@/components/footer";
import { Particles } from "@/components/particles";
import { formatEventDate, type EventSettings } from "@/lib/event-settings";

/**
 * Politica de confidențialitate a unei nunți, partajată de ruta cu slug
 * (/{slug}/confidentialitate) și de cea veche, de la rădăcină.
 *
 * Operatorul de date este chiar perechea (mirii), nu platforma: ei decid ce fac
 * cu confirmările primite. Textul explică exact ce se salvează la trimiterea
 * formularului de RSVP și ce drepturi are invitatul.
 */
export function PrivacyPolicy({ settings, slug }: { settings: EventSettings; slug?: string }) {
  const names: [string, string] = [settings.partner_1, settings.partner_2];
  const base = slug ? `/${slug}` : "/";

  return (
    <main className="min-h-svh">
      <Particles />
      <article className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href={base}
          className="text-sm text-ink/60 underline-offset-4 transition-colors duration-200 ease-out hover:text-ink hover:underline"
        >
          ← Înapoi la invitație
        </Link>

        <h1 className="mt-6 font-display text-4xl">Confidențialitate</h1>
        <p className="mt-3 text-ink/70">
          Această pagină explică ce date se colectează prin intermediul site-ului nunții lui {names[0]} și{" "}
          {names[1]}, din {formatEventDate(settings)}.
        </p>

        <div className="mt-10 space-y-8 text-ink/80">
          <section>
            <h2 className="font-display text-2xl text-ink">Cine prelucrează datele</h2>
            <p className="mt-2">
              Operatorul datelor este chiar perechea care organizează nunta: {names[0]} și {names[1]}. Ei
              decid cum folosesc confirmările primite și îi poți contacta direct la{" "}
              <a
                href={`mailto:${settings.contact_email}`}
                className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
              >
                {settings.contact_email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Ce date colectăm</h2>
            <p className="mt-2">
              Când confirmi prezența, salvăm numele tău, dacă poți participa, mesajul opțional și numele
              însoțitorilor pe care îi adaugi. Dacă îți verifici răspunsul, folosim numele pentru a-ți
              găsi confirmarea. Nu cerem numere de telefon, adrese sau alte date de contact.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Pe ce bază și de ce le folosim</h2>
            <p className="mt-2">
              Prelucrarea se face pe baza consimțământului tău, exprimat când bifezi acordul și trimiți
              formularul. Datele ne ajută să organizăm locurile, meniul și planul meselor. Nu le folosim
              pentru marketing și nu le vindem nimănui.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Unde sunt stocate</h2>
            <p className="mt-2">
              Răspunsurile sunt păstrate într-o bază de date Supabase, accesibilă doar mirilor prin zona
              de administrare. Site-ul este găzduit pe Vercel. Ambele servicii oferă garanții de
              securitate și de protecție a datelor.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Cât timp le păstrăm</h2>
            <p className="mt-2">
              Păstrăm confirmările până după nuntă, cât timp sunt necesare pentru organizare, apoi le
              ștergem la cerere sau la finalul perioadei de organizare.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Statistici</h2>
            <p className="mt-2">
              Folosim Vercel Analytics pentru a vedea numărul anonim de vizite. Serviciul nu folosește
              cookie-uri de urmărire și nu te urmărește pe alte site-uri. Site-ul nu este listat în
              motoarele de căutare.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Drepturile tale</h2>
            <p className="mt-2">
              Poți cere oricând să afli ce date avem despre tine, să le corectezi sau să le ștergem.
              Scrie-ne la{" "}
              <a
                href={`mailto:${settings.contact_email}`}
                className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
              >
                {settings.contact_email}
              </a>
              .
            </p>
          </section>
        </div>
      </article>

      <Footer names={names} email={settings.contact_email} slug={slug} />
    </main>
  );
}
