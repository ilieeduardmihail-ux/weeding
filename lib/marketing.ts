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
 * What contact links open. On a computer the Gmail compose window is the most
 * reliable target: a mailto link with no mail app registered leaves the visitor
 * on a blank tab. On a phone the Gmail link often lands in Gmail itself instead
 * of a compose screen, so there the link is a mailto — the system offers the
 * default mail app (Gmail, Outlook, Mail) with the draft already filled in.
 * ContactLink picks between the two; the address is also shown as plain text.
 */
const contactBody = `body=${encodeURIComponent(CONTACT_BODY)}`;
const contactSubject = encodeURIComponent(CONTACT_SUBJECT);

export const CONTACT_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
  CONTACT_EMAIL
)}&su=${contactSubject}&${contactBody}`;
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${contactSubject}&${contactBody}`;
export const DEMO_SLUG = "demo";
export const DEMO_PATH = `/${DEMO_SLUG}`;

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
    "Programul, locurile pe hartă și confirmarea, toate într-un singur link pe care invitații îl deschid din WhatsApp. Voi vedeți cine vine, fără să întrebați pe rând.",
  primary: "Deschide invitația demo",
  secondary: "Cum funcționează",
  note: "Nu trebuie instalat nimic, iar invitații nu au nevoie de cont.",
  points: ["Linkul vostru, gata în câteva zile", "Se deschide pe orice telefon", "Datele rămân la voi"],
};

export const GUEST_FEATURES = [
  {
    title: "Program și locații",
    text: "Biserica și sala, cu ora, adresa și harta care se deschide dintr-o atingere.",
  },
  {
    title: "Confirmare în 30 de secunde",
    text: "Invitatul își scrie numele, iar răspunsul apare imediat în panoul vostru.",
  },
  {
    title: "Însoțitori și copii",
    text: "Fiecare confirmare poate veni cu partenerul și copiii, ca să știți exact câte locuri pregătiți.",
  },
  {
    title: "Locul la masă",
    text: "După ce publicați așezarea, fiecare invitat își găsește masa în invitație.",
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
      "Aduceți lista dintr-un fișier sau adăugați numele pe rând",
      "Găsiți un invitat în câteva secunde, pe grupuri",
      "Fiecare invitat primește linkul lui, cu numele deja completat",
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
      "Câte persoane vin, câți copii și câți au refuzat, la un loc",
      "Mesajele invitaților, exact cum le-au scris",
      "Corectați un răspuns dacă se răzgândește cineva",
    ],
    image: "panou-confirmari",
    alt: "Pagina de confirmări din panou, cu numărul de răspunsuri și lista invitaților",
  },
  {
    id: "mese",
    eyebrow: "Mese",
    title: "Locul fiecăruia la masă",
    text: "Trageți numele dintr-o listă în mese și vedeți imediat câte locuri au rămas libere. Așezarea apare în invitație doar când sunteți mulțumiți.",
    bullets: [
      "Stabiliți câte locuri are fiecare masă",
      "Însoțitorii se mută împreună cu invitatul",
      "Raportul pentru restaurant, gata de tipărit",
    ],
    image: "panou-mese",
    alt: "Planul meselor din panou, cu invitații așezați și locurile rămase libere",
  },
  {
    id: "buget",
    eyebrow: "Buget",
    title: "Cât ați dat și cât mai aveți de dat",
    text: "Adăugați o cheltuială cu costul ei total și cu plățile făcute până acum. Vedeți oricând cât ați cheltuit și cât vă mai rămâne, în lei sau în euro.",
    bullets: [
      "Categorii de la locație la papetărie",
      "Plătiți în etape și vedeți tot ce ați dat",
      "Totaluri separate pentru lei și euro",
    ],
    image: "panou-buget",
    alt: "Pagina de buget din panou, cu totalurile în lei și euro și cheltuielile adăugate",
  },
  {
    id: "mesaje",
    eyebrow: "Mesaje",
    title: "Mesajul scris o singură dată",
    text: "Scrieți mesajul o dată, cu numele și data completate automat, apoi trimiteți fiecărui invitat linkul lui. Fără copiat nume în 80 de conversații.",
    bullets: [
      "Scrieți mesajul o dată, cu numele și data completate automat",
      "Fiecare invitat primește linkul lui",
      "Atașați și imaginea invitației, dacă o aveți",
    ],
    image: "panou-mesaje",
    alt: "Pagina de mesaje din panou, cu șablonul de invitație pentru WhatsApp",
  },
];

export const STEPS = [
  {
    title: "Ne spuneți ce vă doriți",
    text: "Ne scrieți ce invitație aveți în minte și ce perioadă vă interesează. Vă răspundem cu o ofertă potrivită.",
  },
  {
    title: "Primiți cheia de acces",
    text: "Vă trimitem cheia și linkul de activare. Cu ele vă creați contul în câteva minute și intrați direct în panou.",
  },
  {
    title: "Completați totul în panou",
    text: "Data, ora, locațiile, mesele și tema se fac acolo, în ritmul vostru. Apoi trimiteți linkul pe WhatsApp.",
  },
] as const;

export const PRICE = {
  eyebrow: "Preț",
  title: "Ofertă la cerere",
  text:
    "Spuneți-ne ce perioadă vă interesează și ce vă doriți, iar noi vă trimitem o ofertă potrivită.",
  included: [
    "Site public cu link propriu pentru nuntă",
    "Paletă de culori și decor floral ales de voi",
    "Confirmări, listă de invitați și însoțitori",
    "Așezare la mese și raport pentru restaurant",
    "Buget pe categorii, în lei și euro",
    "Mesaje gata de trimis pe WhatsApp",
    "Suport pe email, până după nuntă",
  ],
  cta: "Cere o ofertă",
  note: "Pachete pe perioade definite: 6 luni, 1 an, 1 an și 6 luni sau 2 ani. Perioada începe din momentul activării.",
} as const;

export const FAQ = [
  {
    question: "Trebuie să instaleze invitații?",
    answer:
      "Nu. Invitația e un site simplu: se deschide din link, pe telefon sau pe calculator. Nu are nevoie de cont și nu trimite notificări.",
  },
  {
    question: "Pot trimite invitația pe WhatsApp?",
    answer:
      "Da, exact așa e gândită. Linkul se deschide direct în WhatsApp, iar din panou puteți lua un link personalizat pentru fiecare invitat, cu numele lui deja completat în formular.",
  },
  {
    question: "Cum arată pe telefon?",
    answer:
      "Aproape toți o vor deschide de pe telefon, așa că am făcut-o întâi pentru ecran mic: text pe care îl citești fără zoom, butoane mari și hărți care se deschid în aplicația de hărți.",
  },
  {
    question: "Pot schimba tema după ce am trimis linkul?",
    answer:
      "Da. Culorile, decorul floral și fotografiile se schimbă din panou, fără să refacem site-ul și fără să se schimbe linkul. Invitații văd varianta nouă la următoarea deschidere.",
  },
  {
    question: "Cum știu cine vine și cu cine?",
    answer:
      "Fiecare confirmare ajunge în listă cu însoțitorii și copiii. Panoul vă arată imediat câți sunteți, iar la mese îi puteți așeza fără să vă bată capul.",
  },
  {
    question: "Ce se întâmplă cu datele invitaților?",
    answer:
      "Sunt folosite doar pentru nunta voastră: confirmarea, așezarea la mese și raportul pentru restaurant. Nu le folosim în alt scop și nu le vindem. Detalii în pagina de confidențialitate.",
  },
  {
    question: "Cât timp rămâne site-ul online?",
    answer:
      "Rămâne online pe toată perioada pachetului ales. Perioada începe din momentul activării, iar la final o puteți prelungi, ca să păstrați invitația și mesajele.",
  },
] as const;

export const FOOTER_NOTE =
  "Invitații digitale pentru nunți. Numele, locurile și sumele din demo sunt fictive.";
