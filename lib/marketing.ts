/**
 * All the words on the presentation page live here, so the copy can be edited
 * without touching layout and the page itself stays a thin server component.
 */

export const BRAND = "Ne căsătorim";
export const CONTACT_EMAIL = "contact.necasatorim@gmail.com";
export const CONTACT_SUBJECT = "Ofertă invitație digitală";
export const CONTACT_BODY =
  "Bună ziua!\n\nNe căsătorim pe ___ la ___ și am vrea o ofertă pentru invitația digitală.\n\nMulțumim!";
/**
 * What contact links open. A mailto link with no mail app registered leaves the
 * visitor on a blank tab, so the action opens the Gmail compose window instead —
 * the address is a Gmail inbox, and the draft is already addressed and prefilled.
 * The address itself is also shown as plain text, for anyone using another client.
 */
export const CONTACT_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
  CONTACT_EMAIL
)}&su=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(CONTACT_BODY)}`;
export const DEMO_PATH = "/demo";

export const NAVIGATION = [
  { label: "Invitația", href: "#invitatia" },
  { label: "Panoul", href: "#panou" },
  { label: "Teme", href: "#teme" },
  { label: "Cum funcționează", href: "#pasi" },
  { label: "Preț", href: "#pret" },
] as const;

export const HERO = {
  eyebrow: "Invitații digitale pentru nuntă",
  title: "Invitația nunții voastre, într-un singur link.",
  lead:
    "Program, locații pe hartă, confirmare de prezență și așezare la mese — un site pe care invitații îl deschid din WhatsApp, iar voi vedeți răspunsurile în timp real.",
  primary: "Deschide invitația demo",
  secondary: "Cum funcționează",
  note: "Fără aplicație de instalat. Fără cont pentru invitați.",
  points: ["Link propriu, gata în câteva zile", "Merge pe orice telefon", "Datele rămân la voi"],
};

export const GUEST_FEATURES = [
  {
    title: "Program și locații",
    text: "Biserica și sala, cu orele și hărți care se deschid într-o singură atingere.",
  },
  {
    title: "Confirmare în 30 de secunde",
    text: "Invitatul își scrie numele, iar răspunsul apare imediat în panoul vostru.",
  },
  {
    title: "Însoțitori și copii",
    text: "Fiecare confirmare poate veni cu partenerul și copiii, numărați separat.",
  },
  {
    title: "Locul la masă",
    text: "După ce publicați așezarea, invitatul își găsește masa direct în invitație.",
  },
] as const;

export type PanelSection = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  bullets: readonly string[];
  image: string;
  alt: string;
};

export const PANEL_SECTIONS: readonly PanelSection[] = [
  {
    id: "invitati",
    eyebrow: "Invitați",
    title: "Lista completă, fără caiet și fără foi",
    text: "Toți invitații într-un singur loc, cu însoțitorii și copiii lor. Importați lista dintr-un fișier sau adăugați numele pe rând.",
    bullets: [
      "Import dintr-un CSV sau adăugare manuală",
      "Căutare instant și grupuri de invitați",
      "Fiecare invitat are linkul lui, cu numele deja completat",
    ],
    image: "panou-invitati",
    alt: "Lista invitaților din panou, cu răspunsuri, refuzuri, participanți și copii",
  },
  {
    id: "confirmari",
    eyebrow: "Confirmări",
    title: "Cine vine, cine nu, în timp real",
    text: "Răspunsurile apar pe măsură ce invitații completează formularul. Vedeți dintr-o privire câte persoane vin și ce mesaje au lăsat.",
    bullets: [
      "Numărători live: participanți, copii, refuzuri",
      "Mesajele invitaților, exact cum le-au scris",
      "Editare și ștergere, dacă un răspuns se schimbă",
    ],
    image: "panou-confirmari",
    alt: "Pagina de confirmări din panou, cu numărul de răspunsuri și lista invitaților",
  },
  {
    id: "mese",
    eyebrow: "Mese",
    title: "Așezarea la mese, rezolvată",
    text: "Trageți numele dintr-o listă în mese și vedeți imediat câte locuri au rămas libere. Așezarea se publică în invitație doar când sunteți mulțumiți.",
    bullets: [
      "Mese cu număr de locuri configurabil",
      "Însoțitorii se mută împreună cu invitatul",
      "Raport pentru restaurant, gata de tipărit",
    ],
    image: "panou-mese",
    alt: "Planul meselor din panou, cu invitații așezați și locurile rămase libere",
  },
  {
    id: "buget",
    eyebrow: "Buget",
    title: "Bugetul, pe categorii și pe monede",
    text: "Fiecare cheltuială are costul total și plățile făcute până acum. Vedeți cât ați cheltuit și cât mai aveți de plătit, în lei sau în euro.",
    bullets: [
      "Categorii de la locație la papetărie",
      "Plăți parțiale, cu istoric",
      "Totaluri separate pentru RON și EUR",
    ],
    image: "panou-buget",
    alt: "Pagina de buget din panou, cu totalurile în lei și euro și cheltuielile adăugate",
  },
  {
    id: "mesaje",
    eyebrow: "Mesaje",
    title: "Invitațiile trimise pe WhatsApp",
    text: "Scrieți mesajul o dată, cu numele și data completate automat, apoi trimiteți fiecărui invitat linkul lui. Fără copiat nume în 80 de conversații.",
    bullets: [
      "Șablon editabil, cu variabile pentru nume și dată",
      "Link personalizat pentru fiecare invitat",
      "Atașați și imaginea invitației, dacă o aveți",
    ],
    image: "panou-mesaje",
    alt: "Pagina de mesaje din panou, cu șablonul de invitație pentru WhatsApp",
  },
];

export const STEPS = [
  {
    title: "Ne scrieți câteva detalii",
    text: "Data, orașul, numele voastre și un număr aproximativ de invitați. Trimiteți totul pe email.",
  },
  {
    title: "Primiți invitația și panoul",
    text: "Vă pregătim site-ul cu tema aleasă și vă trimitem linkul, împreună cu accesul în panou.",
  },
  {
    title: "Trimiteți linkul pe WhatsApp",
    text: "Fiecare invitat primește linkul lui. Răspunsurile se strâng singure, iar voi urmăriți totul din panou.",
  },
] as const;

export const PRICE = {
  eyebrow: "Preț",
  title: "Ofertă la cerere",
  text:
    "Fiecare nuntă are alt număr de invitați și alte nevoi, așa că nu punem un preț fix pe pagina asta. Scrieți-ne detaliile, iar noi vă răspundem cu o ofertă potrivită.",
  included: [
    "Site public cu link propriu pentru nuntă",
    "Paletă de culori și decor floral ales de voi",
    "Confirmări, listă de invitați și însoțitori",
    "Așezare la mese și raport pentru restaurant",
    "Buget pe categorii, în RON și EUR",
    "Mesaje gata de trimis pe WhatsApp",
    "Suport pe email, până după nuntă",
  ],
  cta: "Cere o ofertă",
  note: "Fără abonament lunar. Plătiți o dată, pentru nunta voastră.",
} as const;

export const FAQ = [
  {
    question: "Trebuie să instaleze invitații ceva?",
    answer:
      "Nu. Invitația este un site obișnuit: se deschide din link, în orice browser, pe telefon sau pe calculator. Nu cere cont și nu trimite notificări.",
  },
  {
    question: "Pot trimite invitația pe WhatsApp?",
    answer:
      "Da, exact așa e gândită. Linkul se deschide direct în WhatsApp, iar din panou puteți lua un link personalizat pentru fiecare invitat, cu numele lui deja completat în formular.",
  },
  {
    question: "Cum arată pe telefon?",
    answer:
      "Majoritatea invitaților o vor deschide de pe telefon, așa că fiecare pagină este gândită întâi pentru ecran mic: text lizibil fără zoom, butoane mari și hărți care se deschid în aplicația de hărți.",
  },
  {
    question: "Pot schimba tema după ce am trimis linkul?",
    answer:
      "Da. Culorile, decorul floral și fotografiile se schimbă din panou, fără să refacem site-ul și fără să se schimbe linkul. Invitații văd varianta nouă la următoarea deschidere.",
  },
  {
    question: "Cum știu cine vine și cu cine?",
    answer:
      "Fiecare confirmare intră în lista de invitați împreună cu însoțitorii și copiii. Panoul arată numărătorile pe loc, iar așezarea la mese vă ajută să îi distribuiți fără suprapuneri.",
  },
  {
    question: "Ce se întâmplă cu datele invitaților?",
    answer:
      "Sunt folosite doar pentru nunta voastră: confirmarea, așezarea la mese și raportul pentru restaurant. Nu le folosim în alt scop și nu le vindem. Detalii în pagina de confidențialitate.",
  },
  {
    question: "Cât timp rămâne site-ul online?",
    answer:
      "Rămâne online și după nuntă, ca să puteți reveni la mesaje și la fotografii. Îl puteți păstra cât aveți nevoie; nu se șterge singur.",
  },
] as const;

export const FOOTER_NOTE =
  "Invitații digitale pentru nunți, făcute cu grijă în România. Numele, locurile și sumele din demo sunt fictive.";
