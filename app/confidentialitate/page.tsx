import type { Metadata } from "next";
import Link from "next/link";
import { LegalLink, LegalSection, LegalShell } from "@/components/marketing/legal-shell";
import { ContactLink } from "@/components/marketing/contact-link";
import { ANSPDCP, OPERATOR, RETENTION, SUB_PROCESSORS } from "@/lib/legal";
import { BRAND, CONTACT_EMAIL, DEMO_PATH } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Confidențialitate",
  description: "Ce date prelucrează platforma, pe ce temei, cât timp le păstrează și ce drepturi ai.",
  robots: { index: false, follow: false },
};

/**
 * Platform-level policy. The wedding-specific one lives at
 * /<slug>/confidentialitate, where the couple is the operator for their guests'
 * RSVPs; this page only covers what the service itself keeps.
 */
export default function PrivacyPage() {
  return (
    <LegalShell
      current="/confidentialitate"
      title="Politica de confidențialitate"
      intro={
        <>
          {BRAND} construiește site-uri de invitație pentru nuntă. Fiecare invitație are propria
          pagină de confidențialitate, scrisă de mirii care te-au invitat; aceasta explică doar ce
          prelucrăm noi, ca platformă, și ce drepturi ai.
        </>
      }
    >
      <LegalSection title="Cine este operatorul">
        <p>
          Platforma este operată de <strong className="text-ink">{OPERATOR.name}</strong>, cu sediul
          în {OPERATOR.address}, CUI {OPERATOR.cui}, înregistrată la {OPERATOR.regCom}.
        </p>
        <p>
          Pentru datele platformei suntem operator în sensul art. 4 pct. 7 GDPR. Pentru datele
          invitaților unei nunți, operatorii sunt mirii, iar noi suntem persoana împuternicită care
          le găzduiește (art. 28 GDPR).
        </p>
        <p>
          Ne scrii despre date la{" "}
          <ContactLink className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink">
            {CONTACT_EMAIL}
          </ContactLink>
          {OPERATOR.phone ? <> sau la {OPERATOR.phone}</> : null}. Răspundem în cel mult 30 de zile.
        </p>
      </LegalSection>

      <LegalSection title="Ce date prelucrăm">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong className="text-ink">Vizitatori ai invitațiilor:</strong> adresa IP, tipul de
            dispozitiv și paginile cerute, în jurnalele tehnice ale găzduirii. Numărăm și câte
            persoane deschid pagina, ca să știm dacă invitația ajunge la oameni: fără cookie-uri,
            doar cu un identificator anonim derivat din IP și browser, păstrat{" "}
            {RETENTION.visitsDays} de zile și folosit exclusiv în statistici agregate. Nu creăm
            profiluri și nu te urmărim pe alte site-uri.
          </li>
          <li>
            <strong className="text-ink">Invitați care confirmă prezența:</strong> numele, dacă
            vii, numărul de însoțitori, preferințele de meniu pe care le alegi, mesajul opțional,
            momentul trimiterii și versiunea politicii acceptate.
          </li>
          <li>
            <strong className="text-ink">Cereri de ofertă trimise din site:</strong> numele, adresa
            de email, numărul de telefon (dacă îl lași), perioada care te interesează și mesajul
            tău. Le păstrăm în platformă, ca să îți putem răspunde din același loc, și le folosim
            doar ca să îți răspundem. Nu le trimitem nimănui altcuiva.
          </li>
          <li>
            <strong className="text-ink">Clienți (miri):</strong> numele, adresa de email, datele
            nunții (data, locațiile, numărul de invitați), datele de facturare și corespondența.
          </li>
          <li>
            <strong className="text-ink">Contul de administrare:</strong> adresa de email și o
            parolă stocată sub formă de hash de furnizorul de autentificare. Nu vedem parola.
          </li>
          <li>
            <strong className="text-ink">Contul demo (opțional):</strong> numele, adresa de email,
            parola stocată sub formă de hash de furnizorul de autentificare, momentul acordului,
            versiunea politicii, copia ta de lucru a nunții demo și, dacă bifezi separat, acordul
            pentru a fi contactat despre o invitație. Codul de confirmare este păstrat doar sub o
            formă ireversibilă.
          </li>
        </ul>
        <p>
          Nu cerem date sensibile (sănătate, religie, convingeri) și nu cerem date de plată prin
          site. Te rugăm să nu le trimiți în mesajul de confirmare.
        </p>
      </LegalSection>

      <LegalSection title="Scopuri și temeiuri legale">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong className="text-ink">Ținem site-ul și invitația online</strong> — executarea
            contractului cu mirii (art. 6 alin. 1 lit. b GDPR).
          </li>
          <li>
            <strong className="text-ink">Primim confirmările de prezență</strong> — consimțământul
            tău, exprimat când bifezi acordul (art. 6 alin. 1 lit. a). Pentru aceste date mirii
            decid scopul, iar noi doar le stocăm la cererea lor.
          </li>
          <li>
            <strong className="text-ink">Emitem facturi și ținem contabilitatea</strong> — obligație
            legală (art. 6 alin. 1 lit. c, Legea 82/1991).
          </li>
          <li>
            <strong className="text-ink">Apărăm platforma de abuz și măsurăm traficul agregat</strong>{" "}
            — interesul legitim de a ține serviciul sigur și funcțional (art. 6 alin. 1 lit. f).
            Statisticile sunt fără cookie-uri și nu te identifică.
          </li>
          <li>
            <strong className="text-ink">Răspundem la mesaje</strong> — interesul legitim de a purta
            discuția comercială pe care ai început-o sau, după caz, executarea contractului.
          </li>
          <li>
            <strong className="text-ink">Îți ținem contul demo</strong> — consimțământul tău,
            exprimat când bifezi acordul înainte de a cere codul (art. 6 alin. 1 lit. a). Îl poți
            retrage oricând, ștergând contul.
          </li>
          <li>
            <strong className="text-ink">Te contactăm după expirarea demo-ului</strong> — doar dacă
            ai bifat separat „vreau să fiu contactat(ă)”, deci pe baza consimțământului (art. 6
            alin. 1 lit. a). Fără acea bifă nu îți trimitem oferte. Îl poți retrage oricând, iar
            datele dispar și automat după {RETENTION.contactYears} ani.
          </li>
        </ul>
        <p>
          Nu luăm decizii automate care să producă efecte juridice asupra ta și nu folosim datele
          pentru profilare comercială.
        </p>
      </LegalSection>

      <LegalSection title="Cui dezvăluim datele">
        <p>
          Nu vindem date și nu le dăm pentru publicitate. Le văd doar mirii, în panoul nunții, și
          firmele care ne ajută să ținem serviciul online, în calitate de persoane împuternicite:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {SUB_PROCESSORS.map((processor) => (
            <li key={processor.name}>
              <strong className="text-ink">{processor.name}</strong> — {processor.role}.
            </li>
          ))}
        </ul>
        <p>
          Lista completă, cu locațiile și garanțiile de transfer, este pe pagina{" "}
          <Link href="/subprocesatori" className="text-ink underline decoration-ink/40 underline-offset-4">
            subprocesatori
          </Link>
          . Putem dezvălui date și autorităților, dacă ne obligă legea, sau pentru a apăra un drept
          în justiție.
        </p>
      </LegalSection>

      <LegalSection title="Transferuri în afara UE">
        <p>
          Vercel și Google sunt certificați în EU-US Data Privacy Framework, decizie de adecvare a
          Comisiei Europene din 10 iulie 2023. Supabase păstrează baza de date în Uniunea Europeană
          (Paris, Franța) și acoperă orice acces din afara UE prin clauze contractuale standard,
          aprobate de Comisie. Detaliile fiecărui furnizor sunt pe pagina{" "}
          <Link href="/subprocesatori" className="text-ink underline decoration-ink/40 underline-offset-4">
            subprocesatori
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Cât timp păstrăm datele">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/15 text-ink">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 font-medium">Perioadă</th>
              </tr>
            </thead>
            <tbody className="text-ink/75">
              <tr className="border-b border-ink/10">
                <td className="py-3 pr-4">Confirmări, mesaje și însoțitori</td>
                <td className="py-3">
                  până la {RETENTION.rsvpMonthsAfterEvent} luni după data nunții, apoi ștergere
                </td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="py-3 pr-4">Invitația publică și fotografiile ei</td>
                <td className="py-3">cât timp nunta este activă, plus perioada de mai sus</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="py-3 pr-4">Contul mirilor</td>
                <td className="py-3">cât timp există contractul, apoi ștergere</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="py-3 pr-4">Cereri de ofertă și corespondență fără contract</td>
                <td className="py-3">{RETENTION.contactYears} ani</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="py-3 pr-4">Contul demo: adresa, parola și copia de lucru</td>
                <td className="py-3">7 zile de la creare, apoi ștergere automată</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="py-3 pr-4">
                  Datele de contact din demo, dacă nu devin client și ai bifat acordul pentru ofertă
                </td>
                <td className="py-3">
                  {RETENTION.contactYears} ani de la ultima discuție sau până la retragerea
                  acordului
                </td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="py-3 pr-4">Facturi și documente contabile</td>
                <td className="py-3">{RETENTION.invoicesYears} ani, obligație legală</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="py-3 pr-4">Statistici de vizite, fără cookie-uri</td>
                <td className="py-3">{RETENTION.visitsDays} zile</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Jurnale tehnice</td>
                <td className="py-3">{RETENTION.logsDays} zile</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          La cerere, ștergem mai devreme datele care nu ne sunt impuse de lege. Ștergerea din copiile
          de siguranță se face la rotația lor, în cel mult 30 de zile.
        </p>
      </LegalSection>

      <LegalSection title="Cookie-uri și tehnologii similare">
        <p>
          Invitațiile publice nu folosesc cookie-uri de urmărire. Panoul de administrare setează
          doar cookie-urile strict necesare pentru autentificare, iar hărțile Google se încarcă doar
          după ce apeși pe buton. Lista completă, cu durate și furnizori, este pe pagina{" "}
          <Link href="/cookies" className="text-ink underline decoration-ink/40 underline-offset-4">
            cookie-uri
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Drepturile tale">
        <p>Conform art. 15–22 GDPR, poți cere oricând:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>acces la datele tale și o copie a lor;</li>
          <li>corectarea datelor greșite sau incomplete;</li>
          <li>ștergerea datelor („dreptul de a fi uitat”);</li>
          <li>restricționarea prelucrării, cât timp verificăm o contestație;</li>
          <li>portabilitatea datelor, într-un format structurat (CSV);</li>
          <li>opoziție la prelucrarea bazată pe interes legitim;</li>
          <li>retragerea consimțământului, fără să afecteze prelucrarea deja făcută.</li>
        </ul>
        <p>
          Cererile sunt gratuite și se trimit la{" "}
          <ContactLink className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink">
            {CONTACT_EMAIL}
          </ContactLink>
          . Dacă ești invitat, poți scrie și mirilor, care sunt operatorii confirmării tale.
        </p>
        <p>
          Dacă apreciezi că nu ți-am respectat drepturile, poți depune plângere la {ANSPDCP.name},{" "}
          {ANSPDCP.address}, email <LegalLink href={`mailto:${ANSPDCP.email}`}>{ANSPDCP.email}</LegalLink>,
          telefon {ANSPDCP.phone}, sau la{" "}
          <LegalLink href={ANSPDCP.site}>{ANSPDCP.site.replace("https://", "")}</LegalLink>. Poți
          merge și în instanță.
        </p>
      </LegalSection>

      <LegalSection title="Cum protejăm datele">
        <p>
          Traficul este criptat prin HTTPS, accesul la baza de date este limitat prin politici la
          nivel de rând, iar panoul cere autentificare cu parolă. Parolele sunt stocate criptat de
          furnizorul de autentificare, nu în clar. Folosim copii de siguranță și jurnale de acces, iar
          accesul echipei la datele unei nunți este limitat la ce este necesar pentru suport.
        </p>
        <p>
          Dacă are loc o încălcare a securității care îți afectează drepturile, anunțăm ANSPDCP în 72
          de ore și îți scriem fără întârziere nejustificată, conform art. 33–34 GDPR.
        </p>
      </LegalSection>

      <LegalSection title="Minori">
        <p>
          În România, vârsta digitală a consimțământului este 16 ani (Legea 190/2018). Serviciul se
          adresează adulților care se căsătoresc și invitaților lor; nu colectăm cu bună știință date
          de la copii sub 16 ani fără acordul părinților. Dacă afli că s-a întâmplat, scrie-ne și
          ștergem datele.
        </p>
      </LegalSection>

      <LegalSection title="Datele din demo">
        <p>
          Invitația de la{" "}
          <Link href={DEMO_PATH} className="text-ink underline decoration-ink/40 underline-offset-4">
            {DEMO_PATH}
          </Link>{" "}
          este fictivă: numele, locurile și sumele sunt inventate pentru prezentare, iar confirmările
          trimise acolo nu ajung la o nuntă reală și nu sunt folosite în alt scop. Le înlocuim când
          reîmprospătăm demonstrația.
        </p>
      </LegalSection>

      <LegalSection title="Contul demo (opțional)">
        <p>
          Pe lângă invitația publică, poți să îți faci un cont ca să intri în panoul de organizare
          și să lucrezi pe o copie a nunții demo. Contul este opțional și nu îți dă acces la
          invitația publică, care rămâne liberă.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-ink">Ce salvăm:</strong> numele, adresa de email și o parolă
            stocată sub formă de hash de furnizorul de autentificare. Nu vedem parola.
          </li>
          <li>
            <strong className="text-ink">Codul de confirmare:</strong> îți trimitem un cod de 6
            cifre pe email. În baza de date păstrăm doar o formă ireversibilă a lui, momentul
            trimiterii și numărul de încercări, ca să nu poată fi ghicit.
          </li>
          <li>
            <strong className="text-ink">Dovada acordului:</strong> momentul în care ai bifat acordul
            și versiunea acestei politici pe care ai citit-o.
          </li>
          <li>
            <strong className="text-ink">Copia ta de lucru:</strong> o copie a nunții demo, doar a
            ta, în care poți modifica orice. Nu este publică și nu o vede alt vizitator.
          </li>
          <li>
            <strong className="text-ink">Cine o vede:</strong> tu, în panou, și noi, ca să îți
            răspundem dacă ne scrii. Nu îți trimitem oferte fără acordul tău separat.
          </li>
        </ul>
        <p>
          După 7 zile de la creare, copia ta de lucru și contul de autentificare — adresa, parola
          și sesiunile — se șterg automat. Păstrăm doar numele, adresa și dovada acordului, ca să
          te putem suna sau scrie despre invitație: cel mult {RETENTION.contactYears} ani de la
          ultima discuție, dacă nu devii client, și fără să le folosim pentru altceva. Le poți
          șterge oricând, mai devreme, dintr-un click în bara panoului („Șterge contul”) sau
          scriindu-ne la{" "}
          <ContactLink className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink">
            {CONTACT_EMAIL}
          </ContactLink>
          . Ștergerea duce cu ea contul de autentificare, tot ce ai completat în copie și rândul de
          contact.
        </p>
        <p>
          Dacă alegi să continuăm cu o invitație reală, copia devine nunta ta: îi dăm o adresă
          publică și o perioadă plătită, iar datele rămân aceleași, fără să le copiem în altă parte.
        </p>
      </LegalSection>

      <LegalSection title="Modificări">
        <p>
          Când schimbăm ceva important, actualizăm data de la finalul paginii și, dacă schimbarea
          afectează consimțământul, îți cerem din nou acordul la următoarea confirmare. Versiunea
          acceptată este salvată alături de fiecare răspuns.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
