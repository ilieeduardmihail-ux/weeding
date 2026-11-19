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
/**
 * Both targets for one draft, so a page that has its own message (the Premium
 * upgrade for a specific wedding) gets the same behaviour as the landing page.
 * The text is plain and short: it is read and edited in the mail client.
 */
export function contactLinks(subject: string, body: string) {
  const su = encodeURIComponent(subject);
  const text = encodeURIComponent(body);
  return {
    mailto: `mailto:${CONTACT_EMAIL}?subject=${su}&body=${text}`,
    compose: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      CONTACT_EMAIL
    )}&su=${su}&body=${text}`,
  };
}

const contactLinksDefault = contactLinks(CONTACT_SUBJECT, CONTACT_BODY);

export const CONTACT_COMPOSE = contactLinksDefault.compose;
export const CONTACT_MAILTO = contactLinksDefault.mailto;
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
  secondary: "Cere ofertă",
  note: "Nu trebuie instalat nimic, iar invitații nu au nevoie de cont.",
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
  },
];

export const STEPS = [
  {
    title: "Ne spuneți ce vă doriți",
    text: "Ne scrieți ce invitație aveți în minte; vă răspundem cu o ofertă potrivită.",
  },
  {
    title: "Primiți cheia de acces",
    text: "Vă trimitem cheia și linkul de activare, apoi intrați direct în panou.",
  },
  {
    title: "Completați totul în panou",
    text: "Data, locațiile, mesele și tema, în ritmul vostru. Apoi trimiteți linkul.",
  },
] as const;

export const PRICE = {
  eyebrow: "Preț",
  title: "Spuneți-ne ce invitație aveți în minte.",
  text:
    "Alegeți perioada care vi se potrivește și scrieți-ne în câteva rânduri ce vă doriți. Vă răspundem cu o ofertă potrivită.",
  note: "Pachete pe perioade definite: 6 luni, 1 an, 1 an și 6 luni sau 2 ani. Perioada începe din momentul activării.",
} as const;

export type Plan = {
  id: string;
  name: string;
  tagline: string;
  included: readonly string[];
  note: string;
  /** The plan we point people to. */
  featured?: boolean;
};

/**
 * What each package contains, written for the couple rather than for the
 * platform. Standard is everything about the guests; Premium adds the money
 * side (budget, vendors, planner and the gift calculator).
 */
export const PLANS: readonly Plan[] = [
  {
    id: "standard",
    name: "Standard",
    tagline: "Tot ce ține de invitați, de la link până la raportul pentru restaurant.",
    included: [
      "Site public cu link propriu pentru nuntă",
      "Paletă de culori și decor floral ales de voi",
      "Confirmări RSVP, listă de invitați, însoțitori și copii",
      "Meniul de pici și alergii, așezare la mese și raport .xlsx",
      "Mesaje gata de trimis pe WhatsApp",
    ],
    note: "Include suport pe email, până după nuntă. Ideal dacă țineți bugetul separat.",
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Standard, plus banii: buget, furnizori și planificare.",
    included: [
      "Tot ce include Standard",
      "Buget pe categorii, în lei și euro",
      "Furnizori cu avans, rest înainte de nuntă și rest în ziua nunții",
      "Planificator financiar și calculator de dar",
    ],
    note: "Recomandat dacă vreți să țineți și banii în același loc.",
    featured: true,
  },
] as const;

export const FAQ = [
  {
    question: "Trebuie să instaleze invitații?",
    answer:
      "Nu. Invitația e un site simplu: se deschide din link, pe telefon sau pe calculator. Nu are nevoie de cont și nu trimite notificări.",
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
] as const;

export const FOOTER_NOTE =
  "Invitații digitale pentru nunți. Numele, locurile și sumele din demo sunt fictive.";
