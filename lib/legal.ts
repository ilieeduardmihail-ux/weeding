/**
 * Datele juridice ale platformei, într-un singur loc.
 *
 * Operatorul este persoana (firmă, PFA sau persoană fizică) care răspunde de
 * datele din platformă. Numele, CUI-ul și adresa se pun prin variabile de mediu
 * (`NEXT_PUBLIC_OPERATOR_*`) ca să nu fie inventate în cod; cât timp lipsesc,
 * paginile afișează marcajele dintre paranteze drepte și `isPlaceholder` este
 * true, ca să nu publici din greșeală o politică fără operator.
 */
import { CONTACT_EMAIL } from "@/lib/marketing";

function env(key: string, fallback: string) {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : fallback;
}

export const OPERATOR = {
  name: env("NEXT_PUBLIC_OPERATOR_NAME", "[denumirea operatorului]"),
  cui: env("NEXT_PUBLIC_OPERATOR_CUI", "[CUI]"),
  regCom: env("NEXT_PUBLIC_OPERATOR_REG_COM", "[numărul din registrul comerțului]"),
  address: env("NEXT_PUBLIC_OPERATOR_ADDRESS", "[adresa sediului]"),
  email: env("NEXT_PUBLIC_OPERATOR_EMAIL", CONTACT_EMAIL),
  phone: env("NEXT_PUBLIC_OPERATOR_PHONE", ""),
} as const;

/** True while the identity is still a placeholder: do not launch like this. */
export const OPERATOR_IS_PLACEHOLDER = OPERATOR.name.startsWith("[");

/** The day the privacy policy, terms and cookie list last changed. */
export const LEGAL_UPDATED = "19 noiembrie 2026";

/** Autoritatea de supraveghere din România. */
export const ANSPDCP = {
  name: "Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)",
  address: "B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, București",
  email: "anspdcp@dataprotection.ro",
  phone: "+40 318 059 211",
  site: "https://www.dataprotection.ro",
} as const;

/**
 * Perioadele de păstrare. Sunt cifrele pe care le promit paginile publice, deci
 * orice curățenie automată trebuie să le respecte.
 */
export const RETENTION = {
  /** Confirmările și mesajele unei nunți, după data evenimentului. */
  rsvpMonthsAfterEvent: 6,
  /** Corespondența comercială care nu a dus la un contract. */
  contactYears: 3,
  /** Facturi și documente contabile (Legea 82/1991, art. 36). */
  invoicesYears: 10,
  /** Jurnale tehnice ale platformei. */
  logsDays: 30,
  /** Statistici de vizite anonime (fără cookie-uri). */
  visitsDays: 90,
} as const;

export type SubProcessor = {
  name: string;
  role: string;
  location: string;
  transfer: string;
  link: string;
};

/**
 * Firmele care ating date în numele platformei. Lista este publică pentru că
 * art. 28 alin. 2 GDPR cere ca mirii (operatorii invitațiilor) să știe cine
 * primește datele înainte de a le da acordul pentru prelucrare.
 */
export const SUB_PROCESSORS: SubProcessor[] = [
  {
    name: "Vercel Inc.",
    role: "Găzduire, livrare CDN și statistici de trafic fără cookie-uri",
    location: "Statele Unite ale Americii",
    transfer: "Certificare EU-US Data Privacy Framework; DPA cu clauze contractuale standard",
    link: "https://vercel.com/legal/dpa",
  },
  {
    name: "Supabase Inc.",
    role: "Bază de date PostgreSQL, autentificare și stocare de fișiere, în regiunea Paris",
    location: "Uniunea Europeană (Paris, Franța)",
    transfer: "Datele rămân în UE; DPA cu clauze contractuale standard pentru asistență",
    link: "https://supabase.com/legal/dpa",
  },
  {
    name: "Google Ireland Limited",
    role: "Google Maps, încărcat doar după ce apeși butonul, și Gmail pentru corespondență",
    location: "Irlanda / Statele Unite ale Americii",
    transfer: "Certificare EU-US Data Privacy Framework",
    link: "https://business.safety.google/adsprocessorterms/",
  },
];

export type LegalSection = { title: string; body: string[] };

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Părțile și obiectul",
    body: [
      `Acești termeni se aplică între ${OPERATOR.name}, cu sediul în ${OPERATOR.address}, CUI ${OPERATOR.cui} („noi”, „platforma”), și persoana care comandă un site de invitație pentru nunta sa („clientul”).`,
      "Platforma creează și găzduiește o invitație digitală personalizată, cu program, locații, formular de confirmare, așezare la mese, buget și mesaje. Invitația funcționează la adresa convenită, de forma /numele-nunții.",
    ],
  },
  {
    title: "2. Comanda și conținutul",
    body: [
      "Comanda se confirmă pe email, după ce stabilim detaliile nunții. Clientul ne trimite textele, fotografiile și datele pe care vrea să le apară în invitație și răspunde pentru dreptul de a le folosi.",
      "Clientul poate cere modificări de text, culori, decor și fotografii oricând, în limitele pachetului comandat. Nu modificăm datele confirmărilor primite de la invitați.",
    ],
  },
  {
    title: "3. Preț și plată",
    body: [
      "Prețul se stabilește prin ofertă individuală, în funcție de data nunții, de numărul de invitați și de funcțiile alese. Oferta are valabilitate 30 de zile și se emite pe email.",
      "Factura se emite la confirmarea comenzii, iar plata se face prin transfer bancar, în termenul din ofertă. Nu percepem plăți prin invitația publică și nu cerem invitaților nicio sumă.",
    ],
  },
  {
    title: "4. Contul demo",
    body: [
      "Contul demo este gratuit. Îți dă acces la o copie de lucru a nunții demonstrative, ca să vezi cum funcționează panoul. Copia nu are adresă publică, nu poate fi exportată sau tipărită și nu înlocuiește o invitație reală.",
      "Datele din demo sunt fictive. Modificările pe care le faci în copia ta sunt ale tale, dar nu le folosim în alt scop și nu le arătăm altor vizitatori. Contul și copia se șterg automat după 7 zile de la creare. Numele, adresa și dovada acordului se păstrează separat, conform politicii de confidențialitate, iar datele pentru ofertă doar dacă ai bifat acordul special.",
      "Crearea contului demo nu formează un contract și nu generează nicio plată. Trecerea la o invitație reală se face doar după ce stabilim oferta și ne dai acordul explicit; nu taxăm automat și nu pornim o perioadă plătită fără confirmarea ta.",
    ],
  },
  {
    title: "5. Disponibilitate și suport",
    body: [
      "Ne propunem o disponibilitate de 99% pe lună, fără a include mentenanța anunțată anterior. Găzduirea este asigurată de Vercel, iar baza de date de Supabase, ambele cu măsuri de securitate și copii de siguranță.",
      "Suportul se acordă pe email, în zilele lucrătoare, în cel mult 2 zile lucrătoare pentru întrebări și 1 zi lucrătoare pentru probleme care fac invitația inaccesibilă.",
    ],
  },
  {
    title: "6. Anulare și retragere",
    body: [
      "Clientul poate anula înainte de publicarea invitației, cu restituirea sumelor plătite mai puțin costurile deja angajate, dacă au fost făcute la cererea lui.",
      "După publicare, sumele nu se restituie pentru perioada deja livrată. La finalul perioadei contractate, site-ul poate fi prelungit sau închis; datele se șterg conform politicii de confidențialitate.",
    ],
  },
  {
    title: "7. Date personale",
    body: [
      "Pentru invitații lor, mirii sunt operatori de date, iar platforma este persoana împuternicită care doar găzduiește datele. Relația este detaliată în acordul de prelucrare încheiat la comandă și în politica de confidențialitate a fiecărei invitații.",
      "Pentru propriile date de client (nume, email, facturare), noi suntem operatori și le prelucrăm conform politicii de confidențialitate a platformei.",
    ],
  },
  {
    title: "8. Răspundere",
    body: [
      "Răspundem pentru funcționarea serviciului conform descrierii din ofertă. Nu răspundem pentru întreruperi cauzate de furnizori externi, de rețeaua clientului sau de utilizarea greșită a linkurilor de administrare.",
      "Clientul păstrează confidențial parola panoului și ne anunță imediat dacă bănuiește că a fost compromisă.",
    ],
  },
  {
    title: "9. Modificări și legea aplicabilă",
    body: [
      "Putem actualiza acești termeni pentru comenzi viitoare; versiunea aplicabilă unei comenzi este cea afișată la data confirmării. Modificările nu se aplică retroactiv.",
      "Termenii sunt guvernați de legea română. Neînțelegerile se rezolvă pe cale amiabilă, iar dacă nu este posibil, de instanțele competente din România.",
    ],
  },
];

/** Metadatele partajate de paginile legale. */
export const LEGAL_PAGES = [
  { href: "/confidentialitate", label: "Confidențialitate", description: "Ce date prelucrăm și de ce." },
  { href: "/cookies", label: "Cookie-uri", description: "Ce se salvează pe dispozitivul tău." },
  { href: "/termeni", label: "Termeni", description: "Condițiile serviciului." },
  { href: "/subprocesatori", label: "Subprocesatori", description: "Firmele care ne ajută." },
] as const;
