/**
 * Textele pe care proprietarul le trimite din panou: răspunsurile la cererile
 * de ofertă și emailul cu cheia de acces.
 *
 * Sunt funcții pure, fără transport, ca să poată fi testate: ce vezi în câmpul
 * de text înainte de trimitere este exact ce ajunge la client. Prețul și
 * perioada se completează liber — platforma nu publică tarife, deci nu are de
 * unde să le ia.
 */
import { BRAND } from "@/lib/marketing";

export function cleanName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Days as the durations the owner sells. */
export function durationLabel(days: number) {
  if (days === 180) return "6 luni";
  if (days === 365) return "1 an";
  if (days === 540 || days === 545) return "1 an și 6 luni";
  if (days === 730) return "2 ani";
  return `${days} zile`;
}

export type ReplyContext = {
  name: string;
  period: string;
  /** Free text as typed, e.g. "1.200". Empty shows a visible placeholder. */
  price: string;
  startUrl: string;
};

export type ReplyTemplate = {
  id: "oferta" | "detalii" | "indisponibil" | "inchidere";
  label: string;
  hint: string;
  subject: (ctx: ReplyContext) => string;
  body: (ctx: ReplyContext) => string;
};

function greeting(name: string) {
  const clean = cleanName(name);
  return clean ? `Bună ziua, ${clean},` : "Bună ziua,";
}

function priceText(price: string) {
  const clean = price.replace(/\s+/g, " ").trim();
  return clean ? `${clean} lei` : "[preț] lei";
}

function periodSentence(period: string) {
  const clean = period.replace(/\s+/g, " ").trim();
  return clean ? `Perioada pe care ați ales-o este ${clean}. ` : "";
}

function signature() {
  return `Cu drag,\n${BRAND}`;
}

export const REPLY_TEMPLATES: readonly ReplyTemplate[] = [
  {
    id: "oferta",
    label: "Ofertă și pași următori",
    hint: "Completează prețul. Restul textului este gata.",
    subject: () => "Oferta pentru invitația voastră",
    body: (ctx) => [
      greeting(ctx.name),
      "",
      `Vă mulțumesc pentru mesaj și pentru interesul pentru ${BRAND}.`,
      "",
      `${periodSentence(ctx.period)}Prețul este ${priceText(ctx.price)}, cu tot ce este inclus: site public cu link propriu, paletă de culori și decor floral ales de voi, confirmări și listă de invitați, așezare la mese, buget în lei și euro și mesaje gata de trimis pe WhatsApp.`,
      "",
      "Cum continuăm:",
      "1. Îmi confirmați pe acest email că mergeți mai departe.",
      `2. Vă trimit cheia de acces. Cu ea vă creați contul la ${ctx.startUrl} și configurați invitația singuri, în ritmul vostru.`,
      "3. Perioada începe din momentul activării, nu de acum.",
      "",
      "Dacă aveți întrebări, răspundeți direct la acest mesaj.",
      "",
      signature(),
    ].join("\n"),
  },
  {
    id: "detalii",
    label: "Cere detalii",
    hint: "Când cererea e prea scurtă ca să poți da un preț.",
    subject: () => "Câteva detalii pentru ofertă",
    body: (ctx) => [
      greeting(ctx.name),
      "",
      `Vă mulțumesc pentru mesaj. Ca să vă pot trimite o ofertă potrivită, îmi puteți spune:`,
      "",
      "• data nunții;",
      "• aproximativ câți invitați aveți;",
      "• orașul și locațiile (biserică, restaurant);",
      "• perioada care vă interesează: 6 luni, 1 an, 1 an și 6 luni sau 2 ani.",
      "",
      "Cu aceste detalii vă răspund cu un preț concret, în aceeași zi.",
      "",
      signature(),
    ].join("\n"),
  },
  {
    id: "indisponibil",
    label: "Perioada nu este disponibilă",
    hint: "Când nu poți prelua cererea sau perioada cerută.",
    subject: () => "Despre perioada cerută",
    body: (ctx) => [
      greeting(ctx.name),
      "",
      `Vă mulțumesc pentru mesaj și pentru interesul pentru ${BRAND}.`,
      "",
      "Din păcate, nu pot prelua această cerere în perioada discutată. Vă spun asta direct, ca să nu pierdeți timp.",
      "",
      "Dacă vă ajută, vă pot ține la curent dacă se eliberează un loc sau vă pot recomanda pe cineva în care am încredere. Răspundeți la acest mesaj și îmi spuneți ce preferați.",
      "",
      signature(),
    ].join("\n"),
  },
  {
    id: "inchidere",
    label: "Închidere politicoasă",
    hint: "Cerere duplicată, retrasă sau fără răspuns.",
    subject: () => "Închid cererea dumneavoastră",
    body: (ctx) => [
      greeting(ctx.name),
      "",
      `Vă mulțumesc pentru mesajul trimis prin site. Închid cererea, ca să nu vă trimit emailuri fără rost.`,
      "",
      `Dacă vă răzgândiți, răspundeți la acest mesaj sau scrieți-mi din nou de pe site — vă ajut cu plăcere.`,
      "",
      signature(),
    ].join("\n"),
  },
] as const;

/** The email that carries an access key, after the owner generates one. */
export function keyMail({
  code,
  days,
  startUrl,
}: {
  code: string;
  days: number;
  startUrl: string;
}): { subject: string; text: string } {
  const duration = durationLabel(days);
  return {
    subject: "Cheia de acces pentru invitația voastră",
    text: [
      "Bună ziua,",
      "",
      "Contul pentru invitația voastră este pregătit. Cheia de acces este:",
      "",
      code,
      "",
      `Cu ea vă creați contul aici: ${startUrl}`,
      "Alegeți adresa de email și parola, apoi introduceți cheia.",
      "",
      `Perioada de ${duration} începe din momentul activării, nu de acum.`,
      "",
      "Cheia este valabilă o singură dată. Dacă nu mai merge, îmi scrieți și vă trimit alta.",
      "",
      signature(),
    ].join("\n"),
  };
}
