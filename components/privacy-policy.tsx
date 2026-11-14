import Link from "next/link";
import { Footer } from "@/components/footer";
import { Particles } from "@/components/particles";
import { formatEventDate, type EventSettings } from "@/lib/event-settings";
import { ANSPDCP, OPERATOR, RETENTION } from "@/lib/legal";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";

/**
 * Politica de confidențialitate a unei nunți, partajată de ruta cu slug
 * (/{slug}/confidentialitate) și de cea veche, de la rădăcină.
 *
 * Operatorul de date este chiar perechea (mirii), nu platforma: ei decid ce fac
 * cu confirmările primite, iar platforma le găzduiește ca persoană împuternicită.
 * Textul explică exact ce se salvează la trimiterea formularului de RSVP și ce
 * drepturi are invitatul.
 */
export function PrivacyPolicy({ settings, slug }: { settings: EventSettings; slug?: string }) {
  const names: [string, string] = [settings.partner_1, settings.partner_2];
  const base = slug ? `/${slug}` : "/";
  const email = settings.contact_email;
  const linkClass =
    "text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink";

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
              <a href={`mailto:${email}`} className={linkClass}>
                {email}
              </a>
              .
            </p>
            <p className="mt-2">
              Platforma care găzduiește invitația, {OPERATOR.name}, este persoana împuternicită: stochează
              datele la cererea mirilor și nu le folosește în alt scop. Detaliile despre platformă sunt în{" "}
              <Link href="/confidentialitate" className={linkClass}>
                politica de confidențialitate a platformei
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Ce date colectăm</h2>
            <p className="mt-2">
              Când confirmi prezența, salvăm numele tău, dacă poți participa, mesajul opțional și numele
              însoțitorilor pe care îi adaugi. Salvăm și momentul trimiterii și versiunea acestei
              politici, ca dovadă a acordului. Dacă îți verifici răspunsul, folosim numele pentru a-ți
              găsi confirmarea.
            </p>
            <p className="mt-2">
              Pentru a limita trimiterile automate, serverul reține o valoare derivată din adresa IP
              (un hash cu o cheie secretă), nu adresa în clar. Nu cerem numere de telefon, adrese sau
              alte date de contact și nu îți cerem date sensibile.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Pe ce bază și de ce le folosim</h2>
            <p className="mt-2">
              Prelucrarea se face pe baza consimțământului tău, exprimat când bifezi acordul și trimiți
              formularul (art. 6 alin. 1 lit. a GDPR). Datele ne ajută să organizăm locurile, meniul și
              planul meselor. Nu le folosim pentru marketing, nu le vindem și nu luăm decizii automate
              pe baza lor.
            </p>
            <p className="mt-2">
              Poți retrage acordul oricând, scriind la{" "}
              <a href={`mailto:${email}?subject=${encodeURIComponent("Retragere acord – confirmare nuntă")}`} className={linkClass}>
                {email}
              </a>
              . Retragerea nu afectează prelucrarea făcută deja; după ea, mirii nu mai pot ține
              confirmarea și o șterg, dacă nu au o obligație legală să o păstreze.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Unde sunt stocate și cine le vede</h2>
            <p className="mt-2">
              Răspunsurile sunt păstrate într-o bază de date Supabase, în Uniunea Europeană, iar site-ul
              este găzduit pe Vercel. Accesul la confirmări îl au doar mirii, prin zona de administrare
              protejată cu parolă. Furnizorii de găzduire nu folosesc datele în scopuri proprii și sunt
              legați prin acorduri de prelucrare; lista lor este pe pagina{" "}
              <Link href="/subprocesatori" className={linkClass}>
                subprocesatori
              </Link>
              .
            </p>
            <p className="mt-2">
              Hărțile Google din secțiunea de locații se încarcă doar după ce apeși butonul, deci până
              atunci Google nu primește nicio cerere de la browserul tău.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Cât timp le păstrăm</h2>
            <p className="mt-2">
              Confirmările rămân la dispoziția mirilor până la {RETENTION.rsvpMonthsAfterEvent} luni după
              nuntă, ca să poată finaliza organizarea și eventualele clarificări. După acest termen sunt
              șterse. Le putem șterge mai devreme la cererea ta, dacă nu există o obligație legală care
              ne obligă să le păstrăm.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Statistici</h2>
            <p className="mt-2">
              Platforma folosește Vercel Analytics pentru a vedea numărul anonim de vizite. Serviciul nu
              folosește cookie-uri de urmărire și nu te urmărește pe alte site-uri. Site-ul nu este
              listat în motoarele de căutare.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Drepturile tale</h2>
            <p className="mt-2">Poți cere oricând, gratuit:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>să afli ce date avem despre tine și să primești o copie;</li>
              <li>să corectăm datele greșite sau incomplete;</li>
              <li>să ștergem datele;</li>
              <li>să restricționăm prelucrarea, cât timp verificăm o contestație;</li>
              <li>să primești datele într-un format structurat (portabilitate);</li>
              <li>să te opui prelucrării și să îți retragi consimțământul.</li>
            </ul>
            <p className="mt-2">
              Scrie-ne la{" "}
              <a href={`mailto:${email}`} className={linkClass}>
                {email}
              </a>{" "}
              și răspundem în cel mult 30 de zile. Dacă nu ești mulțumit, poți depune plângere la{" "}
              {ANSPDCP.name}, {ANSPDCP.address}, email{" "}
              <a href={`mailto:${ANSPDCP.email}`} className={linkClass}>
                {ANSPDCP.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Versiunea acestei politici</h2>
            <p className="mt-2">
              Versiunea <span className="font-mono text-sm text-ink">{PRIVACY_POLICY_VERSION}</span>.
              Dacă schimbăm ceva important, îți cerem din nou acordul la următoarea confirmare, iar
              versiunea acceptată rămâne salvată alături de răspuns.
            </p>
          </section>
        </div>
      </article>

      <Footer names={names} email={email} slug={slug} />
    </main>
  );
}
