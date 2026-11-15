import type { Metadata } from "next";
import Link from "next/link";
import { BrowserFrame, PhoneFrame, Screenshot } from "@/components/marketing/frames";
import { ContactLink } from "@/components/marketing/contact-link";
import { ThemeToggle } from "@/components/marketing/theme-toggle";
import { Button } from "@/components/ui/button";
import { FLORAL_IMAGES, FLORAL_SETS, PALETTES, floralSrcSet } from "@/lib/theme";
import {
  BRAND,
  CONTACT_EMAIL,
  DEMO_PATH,
  FAQ,
  FOOTER_NOTE,
  GUEST_FEATURES,
  HERO,
  NAVIGATION,
  PANEL_SECTIONS,
  PRICE,
  STEPS,
} from "@/lib/marketing";

/**
 * The presentation page. Deliberately static: no database read, no session. The
 * only client code is the contact link, which picks Gmail on a computer and the
 * system mail app on a phone. Every wedding still lives at /<slug> and stays
 * noindex; this is the only page search engines are allowed to see.
 */
export const metadata: Metadata = {
  title: { absolute: `${BRAND} — invitații digitale pentru nuntă` },
  description:
    "Invitație digitală pentru nuntă, cu program, locații pe hartă, confirmare de prezență, așezare la mese și buget. Invitații o deschid dintr-un link, voi urmăriți totul din panou.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: "/",
    siteName: BRAND,
    title: `${BRAND} — invitații digitale pentru nuntă`,
    description:
      "Un link pentru invitație, un panou pentru tot restul: confirmări, mese, buget și mesaje.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND} — invitații digitale pentru nuntă`,
    description:
      "Un link pentru invitație, un panou pentru tot restul: confirmări, mese, buget și mesaje.",
  },
};

const eyebrow = "text-[11px] font-medium uppercase tracking-[0.3em] text-gold";
const h2 = "mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl";
const lead = "mt-4 max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg";
const linkUnderline =
  "underline decoration-gold/40 decoration-1 underline-offset-4 transition-colors hover:text-ink hover:decoration-gold";
const floralPreview = [
  "photo-bujori",
  "photo-bujori-si-trandafiri",
  "photo-trandafiri-vintage",
  "photo-bordo-si-aur",
  "photo-hortensie-albastra",
  "photo-flori-mov",
] as const;

export default function Home() {
  return (
    <div className="marketing min-h-svh bg-sea text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 glass-bar">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="font-display text-lg tracking-wide text-ink">
            {BRAND}
            <span className="text-gold">.</span>
          </Link>
          <nav aria-label="Secțiuni" className="hidden items-center gap-7 text-sm text-ink/70 lg:flex">
            {NAVIGATION.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-ink">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ContactLink className="hidden text-sm text-ink/70 transition-colors hover:text-ink sm:block">
              Scrie-ne
            </ContactLink>
            <Button asChild size="sm">
              <Link href={DEMO_PATH}>Vezi demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ------------------------------------------------------------- hero */}
        <section className="relative overflow-hidden px-6 pt-14 pb-24 sm:pt-20 sm:pb-32">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 right-[-10%] size-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(185,138,147,0.28),transparent_65%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/3 left-[-15%] size-[32rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(107,122,78,0.18),transparent_65%)]"
          />

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.02fr_1fr] lg:gap-10">
            <div>
              <p className={`${eyebrow} animate-rise motion-reduce:animate-none`}>{HERO.eyebrow}</p>
              <h1
                className="mt-5 animate-rise font-display text-[2.6rem] leading-[1.05] text-ink motion-reduce:animate-none sm:text-6xl"
                style={{ animationDelay: "80ms" }}
              >
                {HERO.title}
              </h1>
              <p
                className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-ink/70 motion-reduce:animate-none"
                style={{ animationDelay: "160ms" }}
              >
                {HERO.lead}
              </p>

              <div
                className="mt-8 flex animate-rise flex-wrap items-center gap-3 motion-reduce:animate-none"
                style={{ animationDelay: "240ms" }}
              >
                <Button asChild size="lg">
                  <Link href={DEMO_PATH}>{HERO.primary}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#pasi">{HERO.secondary}</a>
                </Button>
              </div>
              <p
                className="mt-4 animate-rise text-sm text-ink/55 motion-reduce:animate-none"
                style={{ animationDelay: "300ms" }}
              >
                {HERO.note}
              </p>

              <ul
                className="mt-9 flex animate-rise flex-wrap gap-x-6 gap-y-2 text-sm text-ink/65 motion-reduce:animate-none"
                style={{ animationDelay: "360ms" }}
              >
                {HERO.points.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <span aria-hidden className="size-1.5 rounded-full bg-gold" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative pb-16 sm:pb-20 lg:pb-10">
              <BrowserFrame url="ne-casatorim.ro/demo">
                <Screenshot
                  name="deschidere"
                  alt="Prima pagină a unei invitații de nuntă: numele mirilor, data și numărătoarea inversă"
                  sizes="(min-width: 1024px) 560px, 92vw"
                  eager
                />
              </BrowserFrame>
              <div className="absolute -bottom-2 left-2 w-[30%] max-w-[150px] sm:-bottom-1 sm:left-6 sm:w-[27%] sm:max-w-[190px]">
                <PhoneFrame>
                  <Screenshot
                    name="deschidere-telefon"
                    alt="Aceeași invitație deschisă pe telefon"
                    sizes="(min-width: 640px) 170px, 26vw"
                  />
                </PhoneFrame>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- pentru invitați */}
        <section id="invitatia" className="scroll-mt-24 border-y border-ink/10 bg-mist/35 px-6 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <p className={eyebrow}>Pentru invitați</p>
              <h2 className={h2}>Se deschide dintr-un link. Atât.</h2>
              <p className={lead}>
                Fără cont, fără aplicație, fără pași în plus. Invitatul vede când și unde are loc nunta,
                confirmă în câteva secunde și, după ce publicați așezarea, își găsește locul la masă.
              </p>
            </div>

            <div className="relative mx-auto mt-12 w-full max-w-5xl pb-16 sm:pb-20">
              <BrowserFrame url="ne-casatorim.ro/demo">
                <Screenshot
                  name="invitatie"
                  alt="Invitația deschisă: programul cu cununia religioasă și petrecerea, cu adrese și hărți"
                  sizes="(min-width: 1024px) 1024px, 92vw"
                />
              </BrowserFrame>
              <div className="absolute right-6 -bottom-2 w-[26%] max-w-[130px] sm:right-10 sm:-bottom-4 sm:max-w-[180px]">
                <PhoneFrame>
                  <Screenshot
                    name="confirmare-telefon"
                    alt="Confirmarea de prezență pe telefon, cu numele deja completat"
                    sizes="(min-width: 640px) 170px, 24vw"
                  />
                </PhoneFrame>
              </div>
            </div>

            <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {GUEST_FEATURES.map((feature, index) => (
                <li key={feature.title} className="border-t border-ink/15 pt-4">
                  <p className="font-display text-sm text-gold">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-display text-lg text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">{feature.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------------- panou */}
        <section id="panou" className="scroll-mt-24 px-6 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <p className={eyebrow}>Panoul vostru</p>
              <h2 className={h2}>Tot ce se întâmplă înainte de nuntă, într-un singur loc.</h2>
              <p className={lead}>
                Fără foi de calcul trimise pe email și fără liste pe care le țineți minte. Fiecare
                răspuns, fiecare masă și fiecare plată sunt la vedere, pe măsură ce se întâmplă.
              </p>
            </div>

            <div className="mt-14 space-y-16 sm:space-y-24">
              {PANEL_SECTIONS.map((section, index) => (
                <article key={section.id} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                  <div className={index % 2 === 1 ? "lg:order-last" : ""}>
                    <BrowserFrame url={`ne-casatorim.ro/demo/admin`}>
                      <Screenshot
                        name={section.image}
                        alt={section.alt}
                        sizes="(min-width: 1024px) 560px, 92vw"
                      />
                    </BrowserFrame>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                      {section.eyebrow}
                    </p>
                    <h3 className="mt-3 font-display text-2xl leading-snug text-ink sm:text-3xl">
                      {section.title}
                    </h3>
                    <p className="mt-4 leading-relaxed text-ink/70">{section.text}</p>
                    <ul className="mt-6 space-y-2.5 text-sm text-ink/70">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold/80" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- teme */}
        <section id="teme" className="scroll-mt-24 border-y border-ink/10 bg-mist/35 px-6 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <p className={eyebrow}>Teme</p>
              <h2 className={h2}>Alese de voi, nu impuse de noi.</h2>
              <p className={lead}>
                Aveți de ales între {PALETTES.length} palete de culori și {FLORAL_SETS.length} decoruri
                florale. Le schimbați oricând din panou, iar linkul rămâne același.
              </p>
            </div>

            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PALETTES.map((palette) => (
                <li
                  key={palette.id}
                  className="card-hover overflow-hidden rounded-2xl border border-ink/10 shadow-[0_18px_40px_-32px_rgba(44,51,37,0.5)]"
                  style={{ backgroundColor: palette.paper }}
                >
                  <div className="flex h-20 items-end gap-1.5 p-4" style={{ backgroundColor: palette.bg }}>
                    <span className="size-7 rounded-full" style={{ backgroundColor: palette.mist }} />
                    <span className="size-7 rounded-full" style={{ backgroundColor: palette.sage }} />
                    <span className="size-7 rounded-full" style={{ backgroundColor: palette.rose }} />
                    <span className="ml-auto size-4 rounded-full" style={{ backgroundColor: palette.accent }} />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ color: palette.text }}>
                    <p className="font-display text-sm">{palette.name}</p>
                    <span
                      aria-hidden
                      className="font-display text-lg leading-none"
                      style={{ color: palette.accent }}
                    >
                      A&amp;S
                    </span>
                  </div>
                </li>
              ))}
              <li className="flex flex-col justify-center rounded-2xl border border-dashed border-ink/20 bg-paper/50 p-5 text-sm leading-relaxed text-ink/60">
                Vă place altceva? Putem potrivi culorile cu invitația tipărită.
              </li>
            </ul>

            <div className="mt-10 flex flex-wrap items-end gap-6">
              {floralPreview.map((id) => {
                const image = FLORAL_IMAGES[id];
                if (!image) return null;
                return (
                  <picture key={id} className="block">
                    <source type="image/avif" srcSet={floralSrcSet(image, "avif")} sizes="96px" />
                    <source type="image/webp" srcSet={floralSrcSet(image, "webp")} sizes="96px" />
                    <img
                      src={`${image.src}-${image.widths[0]}.webp`}
                      alt=""
                      width={120}
                      height={120}
                      loading="lazy"
                      decoding="async"
                      className="h-24 w-24 object-contain opacity-90"
                    />
                  </picture>
                );
              })}
              <div className="max-w-sm text-sm leading-relaxed text-ink/60">
                <p>
                  Decorurile sunt fotografii de buchete adevărate, puse în colțuri, pe margini sau ca
                  un cadru întreg.
                </p>
                <p className="mt-2 font-display text-ink/75">
                  {FLORAL_SETS.map((set) => set.name.replace("Poză · ", "")).join(" · ")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- pași */}
        <section id="pasi" className="scroll-mt-24 px-6 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <p className={eyebrow}>Cum funcționează</p>
              <h2 className={h2}>Trei pași, niciunul complicat.</h2>
            </div>
            <ol className="mt-12 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative border-t border-gold/40 pt-6">
                  <span className="font-display text-4xl text-gold/70">{index + 1}</span>
                  <h3 className="mt-3 font-display text-xl text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">{step.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 text-sm text-ink/60">
              Restul detaliilor le lămurim pe email, fără grabă.{" "}
              <ContactLink className={`text-ink ${linkUnderline}`}>
                {CONTACT_EMAIL}
              </ContactLink>
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------------- preț */}
        <section id="pret" className="scroll-mt-24 px-6 pb-20 sm:pb-28">
          <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-gold/25 bg-paper/60">
            <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
              <div>
                <p className={eyebrow}>{PRICE.eyebrow}</p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">{PRICE.title}</h2>
                <p className="mt-4 max-w-lg leading-relaxed text-ink/70">{PRICE.text}</p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button asChild size="lg">
                    <ContactLink>{PRICE.cta}</ContactLink>
                  </Button>
                  <span className="text-sm text-ink/55">{PRICE.note}</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink/45">Ce include</p>
                <ul className="mt-4 grid gap-2.5 text-sm text-ink/75">
                  {PRICE.included.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden className="mt-1.5 text-gold">
                        ✦
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- întrebări */}
        <section id="intrebari" className="scroll-mt-24 border-t border-ink/10 px-6 py-20 sm:py-28">
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className={eyebrow}>Întrebări</p>
              <h2 className={h2}>Ce ne întreabă mirii cel mai des.</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink/60">
                Nu găsiți răspunsul? Scrieți-ne și vă răspundem noi.
              </p>
            </div>
            <div className="divide-y divide-ink/10 border-y border-ink/10">
              {FAQ.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-display text-lg text-ink [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden
                      className="shrink-0 text-xl text-gold transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl pr-8 text-sm leading-relaxed text-ink/65">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- final */}
        <section className="px-6 pb-24">
          <div className="mx-auto w-full max-w-6xl rounded-3xl bg-ink px-8 py-14 text-center text-sea sm:py-16">
            <p className="text-[11px] uppercase tracking-[0.3em] text-sea/60">Sunteți gata de nuntă?</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
              Trimiteți-ne data și orașul. Restul îl punem noi la punct.
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <ContactLink>Scrie-ne pe email</ContactLink>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-sea hover:bg-sea/10">
                <Link href={DEMO_PATH}>Vezi invitația demo</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-sea/60">
              Butonul deschide aplicația voastră de email, cu mesajul deja început. Ne puteți
              scrie și direct la{" "}
              <span className="select-all text-sea/85">{CONTACT_EMAIL}</span>.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10 px-6 py-12 text-sm text-ink/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-xl text-ink">
              {BRAND}
              <span className="text-gold">.</span>
            </p>
            <p className="mt-3 leading-relaxed">{FOOTER_NOTE}</p>
            <p className="mt-4 leading-relaxed">
              <span className="text-ink/45">Email:</span>{" "}
              <span className="select-all text-ink/80">{CONTACT_EMAIL}</span>
            </p>
          </div>
          <nav aria-label="Linkuri" className="flex flex-wrap gap-x-8 gap-y-3">
            <Link href={DEMO_PATH} className={linkUnderline}>
              Invitația demo
            </Link>
            <ContactLink className={linkUnderline}>
              Contact
            </ContactLink>
            <Link href="/confidentialitate" className={linkUnderline}>
              Confidențialitate
            </Link>
            <Link href="/cookies" className={linkUnderline}>
              Cookie-uri
            </Link>
            <Link href="/termeni" className={linkUnderline}>
              Termeni
            </Link>
            <Link href="/subprocesatori" className={linkUnderline}>
              Subprocesatori
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
