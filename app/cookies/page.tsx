import type { Metadata } from "next";
import Link from "next/link";
import { LegalLink, LegalSection, LegalShell } from "@/components/marketing/legal-shell";
import { ContactLink } from "@/components/marketing/contact-link";
import { BRAND, CONTACT_EMAIL } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Cookie-uri",
  description: "Ce cookie-uri și ce stocare locală folosește platforma, cât durează și cum le controlezi.",
  robots: { index: false, follow: false },
};

const rows: { name: string; provider: string; purpose: string; duration: string; basis: string }[] = [
  {
    name: "sb-<proiect>-auth-token",
    provider: "Supabase (pe domeniul nostru)",
    purpose: "Ține minte sesiunea de administrare, ca să nu reintroduci parola la fiecare pagină — la fel și când intri în contul demo.",
    duration: "sesiunea de lucru; expiră la deconectare sau când tokenul își pierde valabilitatea",
    basis: "strict necesar",
  },
  {
    name: "wedding_demo_admin",
    provider: "Platforma",
    purpose: "Marchează că ai intrat în invitația demonstrativă, ca panoul demo să nu ceară parola din nou.",
    duration: "sesiune (dispare la închiderea browserului)",
    basis: "strict necesar pentru demo",
  },
  {
    name: "NID, CONSENT (Google)",
    provider: "Google Ireland Limited",
    purpose:
      "Pot fi setate de Google Maps la afișarea hărții: rețin preferințele și limitează frecvența. Harta se încarcă doar după ce apeși „Încarcă harta”.",
    duration: "stabilite de Google; de regulă între 6 luni și 2 ani",
    basis: "consimțământul tău, dat prin click",
  },
];

export default function CookiesPage() {
  return (
    <LegalShell
      current="/cookies"
      title="Cookie-uri și stocare locală"
      intro={
        <>
          {BRAND} folosește doar ce este necesar ca site-ul să funcționeze. Nu avem cookie-uri de
          publicitate, de profilare sau de urmărire între site-uri, de aceea nu vezi un banner care să
          ceară acord pentru ele.
        </>
      }
    >
      <LegalSection title="Ce găsești pe dispozitivul tău">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/15 text-ink">
                <th className="py-2 pr-4 font-medium">Nume</th>
                <th className="py-2 pr-4 font-medium">Furnizor</th>
                <th className="py-2 pr-4 font-medium">Scop</th>
                <th className="py-2 pr-4 font-medium">Durată</th>
                <th className="py-2 font-medium">Temei</th>
              </tr>
            </thead>
            <tbody className="text-ink/75">
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-ink/10 align-top">
                  <td className="py-3 pr-4 font-mono text-xs text-ink">{row.name}</td>
                  <td className="py-3 pr-4">{row.provider}</td>
                  <td className="py-3 pr-4">{row.purpose}</td>
                  <td className="py-3 pr-4">{row.duration}</td>
                  <td className="py-3">{row.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Cookie-urile de autentificare apar doar dacă intri în panoul unei nunți sau în demo.
          Vizitatorii invitațiilor publice nu primesc niciun cookie de la noi.
        </p>
      </LegalSection>

      <LegalSection title="Stocare locală, nu cookie">
        <p>
          Butonul de temă ține minte alegerea ta (Automată, Luminoasă sau Întunecată) în
          <span className="mx-1 font-mono text-xs text-ink">localStorage</span>, sub cheia{" "}
          <span className="font-mono text-xs text-ink">theme</span>. Nu pleacă la server, nu te
          identifică și poți șterge oricând intrarea din setările browserului.
        </p>
      </LegalSection>

      <LegalSection title="Statistici fără cookie-uri">
        <p>
          Vercel Analytics numără vizitele în mod agregat, fără cookie-uri și fără să te urmărească
          pe alte site-uri. Nu putem afla cine a vizitat o invitație și nu legăm numărul de vizite de
          vreo confirmare.
        </p>
      </LegalSection>

      <LegalSection title="Hărțile Google">
        <p>
          Harta din secțiunea de locații nu se încarcă singură. Vezi un cadru cu explicația și
          butonul „Încarcă harta”; până apeși, browserul nu contactează Google. După click, Google
          poate seta cookie-urile din tabelul de mai sus, iar prelucrarea intră sub{" "}
          <LegalLink href="https://policies.google.com/privacy">politica Google</LegalLink>. Poți
          alege oricând să folosești linkul „Deschide în Maps”, care se deschide într-un tab nou.
        </p>
      </LegalSection>

      <LegalSection title="Cum le controlezi">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Poți șterge cookie-urile din setările browserului; te vor deconecta din panou, dar
            invitația publică rămâne funcțională.
          </li>
          <li>
            Poți bloca cookie-urile terțe; hărțile nu se vor mai încărca, însă adresele și linkul
            „Deschide în Maps” rămân vizibile.
          </li>
          <li>
            Poți refuza harta apăsând pur și simplu pe linkul către Google Maps, fără să încarci
            integrarea.
          </li>
        </ul>
        <p>
          Detalii despre datele prelucrate în general sunt în{" "}
          <Link href="/confidentialitate" className="text-ink underline decoration-ink/40 underline-offset-4">
            politica de confidențialitate
          </Link>
          . Pentru întrebări:{" "}
          <ContactLink className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink">
            {CONTACT_EMAIL}
          </ContactLink>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
