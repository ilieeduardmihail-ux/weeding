/**
 * Textele pe care proprietarul le trimite din panou: răspunsurile la cererile
 * de ofertă și emailul cu cheia de acces.
 *
 * Sunt funcții pure, fără transport, ca să poată fi testate: ce vezi în câmpul
 * de text înainte de trimitere este exact ce ajunge la client. Prețul și
 * perioada se completează liber — platforma nu publică tarife, deci nu are de
 * unde să le ia.
 */
import { BRAND, CONTACT_EMAIL } from "@/lib/marketing";

export function cleanName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** The durations the platform sells, in the order the panels offer them. */
export const ACCESS_DURATIONS = [
  { days: 180, label: "6 luni" },
  { days: 365, label: "1 an" },
  { days: 540, label: "1 an și 6 luni" },
  { days: 730, label: "2 ani" },
] as const;

/** Days as the durations the owner sells. */
export function durationLabel(days: number) {
  return ACCESS_DURATIONS.find((row) => row.days === days)?.label ?? `${days} zile`;
}

/**
 * The request form asks for a period as text ("1 an și 6 luni"), so the reply
 * can prefill the key duration from the client's own words. Longest periods are
 * checked first: "1 an și 6 luni" also contains "6 luni".
 */
export function durationDaysFromPeriod(period: string | null | undefined) {
  const value = (period ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!value) return 365;
  if (/\b2\s*ani\b/.test(value)) return 730;
  if (/1\s*an\s*(?:și|si)\s*6\s*luni/.test(value)) return 540;
  if (/6\s*luni/.test(value)) return 180;
  if (/\b1\s*an\b/.test(value)) return 365;
  const months = /(\d+)\s*luni/.exec(value);
  if (months) return Math.min(3650, Math.max(1, Number(months[1]) * 30));
  return 365;
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
  siteUrl,
}: {
  code: string;
  days: number;
  siteUrl: string;
}): { subject: string; text: string } {
  return {
    subject: "Cheia de acces pentru invitația voastră",
    text: [
      "Bună ziua,",
      "",
      "Contul pentru invitația voastră este pregătit.",
      "",
      accessBlock({ code, days, siteUrl }),
      "",
      signature(),
    ].join("\n"),
  };
}

/* ------------------------------------------------- contul demo (lead-uri) */

export type DemoCodeContext = {
  code: string;
  /** Minutes until the code stops working, as shown to the person. */
  minutes: number;
  purpose: "signup" | "reset";
};

/**
 * The six-digit code that opens the demo panel. Plain text, short, and the code
 * on its own line: this is read on a phone, often copied by hand.
 */
export function demoCodeMail({ code, minutes, purpose }: DemoCodeContext) {
  const title = purpose === "reset" ? "Codul pentru parolă nouă" : "Codul tău de acces";
  return {
    subject:
      purpose === "reset"
        ? `Cod pentru parolă nouă: ${code}`
        : `Codul tău de acces: ${code}`,
    text: [
      title,
      "",
      code,
      "",
      `Codul expiră în ${minutes} minute și poate fi folosit o singură dată.`,
      purpose === "reset"
        ? "Dacă nu ai cerut schimbarea parolei, ignoră acest mesaj: contul rămâne neschimbat."
        : "Dacă nu ai cerut tu contul, ignoră acest mesaj și nu se întâmplă nimic.",
      "",
      signature(),
    ].join("\n"),
  };
}

export type LeadNoticeContext = {
  name: string | null;
  email: string;
  /** Absolute address of the visitor's own demo panel. */
  sandboxUrl: string;
  /** Already formatted for reading, e.g. "19.11.2026, 14:32". */
  when: string;
};

/** The owner's notification: someone reached the panel and is worth calling. */
export function leadNoticeMail({ name, email, sandboxUrl, when }: LeadNoticeContext) {
  const who = name?.trim() ? `${name.trim()} <${email}>` : email;
  return {
    subject: `Lead nou: ${name?.trim() || email}`,
    text: [
      "Lead nou pe site.",
      "",
      `Cine: ${who}`,
      `Când: ${when}`,
      "A confirmat codul primit pe email, deci adresa este reală.",
      "",
      `Panoul lui demo: ${sandboxUrl}`,
      "Îl poți transforma în nuntă reală dintr-un click, din /platform/lead-uri.",
      "",
      signature(),
    ].join("\n"),
  };
}

export type SandboxConvertedContext = {
  name: string | null;
  /** Absolute panel address after conversion. */
  panelUrl: string;
  days: number;
};

/** Sent to the visitor when the owner turns their sandbox into a real wedding. */
export function sandboxConvertedMail({ name, panelUrl, days }: SandboxConvertedContext) {
  return {
    subject: "Contul tău este activ — invitația poate fi publicată",
    text: [
      greeting(name ?? ""),
      "",
      `Am păstrat tot ce ai lucrat în demo și am activat contul pentru ${durationLabel(days)}.`,
      "",
      `Panoul tău: ${panelUrl}`,
      "",
      "De acum poți publica invitația din „Setări” și o poți trimite invitaților. Confirmările lor apar direct în panou.",
      "",
      "Dacă vrei să schimbi ceva, răspunde la acest mesaj.",
      "",
      signature(),
    ].join("\n"),
  };
}

export type AccessContext = {
  code: string;
  days: number;
  siteUrl: string;
};

/**
 * The part of a message that hands over the key: the code, the four steps to
 * activation and the links worth keeping. Plain text on purpose — it is read in
 * Gmail, where every URL is clickable anyway. The whole key email is built from
 * this block, so the panel preview and the sent message cannot drift apart.
 */
export function accessBlock({ code, days, siteUrl }: AccessContext) {
  const site = siteUrl.replace(/\/+$/, "");
  const startUrl = `${site}/start`;

  return [
    "Cheia dumneavoastră de acces:",
    code,
    "",
    "Cum vă activați contul (durează două minute):",
    `1. Deschideți ${startUrl}`,
    "2. Alegeți adresa de email și o parolă de cel puțin 8 caractere. Aceasta este parola contului de administrare.",
    "3. Lipiți cheia de mai sus.",
    "4. Apăsați „Activez contul”. Intrați direct în panoul nunții.",
    "",
    "Linkuri utile:",
    `• Activare: ${startUrl}`,
    `• Termeni: ${site}/termeni`,
    `• Confidențialitate: ${site}/confidentialitate`,
    `• Întrebări: ${CONTACT_EMAIL}`,
    "",
    `Perioada de ${durationLabel(days)} începe din momentul activării, nu de acum.`,
    "Cheia se folosește o singură dată. Dacă nu mai merge, îmi scrieți și vă trimit alta.",
  ].join("\n");
}
