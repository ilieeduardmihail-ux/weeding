import type { Metadata } from "next";
import Link from "next/link";
import { BrowserFrame, PhoneFrame, Screenshot } from "@/components/marketing/frames";
import { ContactDialogProvider, ContactTrigger } from "@/components/marketing/contact-dialog";
import { ContactLink } from "@/components/marketing/contact-link";
import { PanelAccordion } from "@/components/marketing/panel-accordion";
import { PlanCards } from "@/components/marketing/plan-cards";
import { THEME_COUNTS, ThemeAccordion } from "@/components/marketing/theme-accordion";
import { ThemeToggle } from "@/components/marketing/theme-toggle";
import { VisitBeacon } from "@/components/visit-beacon";
import { Button } from "@/components/ui/button";
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
 * only client code is the offer dialog and the theme switch. Every wedding still
 * lives at /<slug> and stays noindex; this is the only page search engines are
 * allowed to see.
 *
 * Kept short on purpose: the offer form sits in a dialog instead of a block, the
 * guest section shows one phone instead of a full screenshot, and the packages
 * share a switch on a phone, so the price is reachable in a few scrolls.
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
const h2 = "mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl";
const lead = "mt-3 max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg";
const linkUnderline =
  "underline decoration-gold/40 decoration-1 underline-offset-4 transition-colors hover:text-ink hover:decoration-gold";

export default function Home() {
  return (
    <div className="marketing min-h-svh bg-sea text-ink">
      <ContactDialogProvider>
        <VisitBeacon path="/" />
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
              <ContactTrigger
                variant="link"
                className="hidden px-0 text-sm font-normal text-ink/70 sm:inline-flex"
              >
                Scrie-ne
              </ContactTrigger>
              <Button asChild size="sm">
                <Link href={DEMO_PATH}>Vezi demo</Link>
              </Button>
            </div>
          </div>
        </header>

        <main>
          {/* ------------------------------------------------------------- hero */}
          <section className="relative overflow-hidden px-6 pt-8 pb-10 sm:pt-12 sm:pb-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-40 right-[-10%] size-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(185,138,147,0.28),transparent_65%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/3 left-[-15%] size-[32rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(107,122,78,0.18),transparent_65%)]"
            />

            <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.02fr_1fr] lg:gap-10">
              <div>
                <p className={`${eyebrow} animate-rise motion-reduce:animate-none`}>{HERO.eyebrow}</p>
                <h1
                  className="mt-3 animate-rise font-display text-[2.6rem] leading-[1.05] text-ink motion-reduce:animate-none sm:text-6xl"
                  style={{ animationDelay: "80ms" }}
                >
                  {HERO.title}
                </h1>
                <p
                  className="mt-4 max-w-xl animate-rise text-lg leading-relaxed text-ink/70 motion-reduce:animate-none"
                  style={{ animationDelay: "160ms" }}
                >
                  {HERO.lead}
                </p>

                <div
                  className="mt-6 flex animate-rise flex-wrap items-center gap-3 motion-reduce:animate-none"
                  style={{ animationDelay: "240ms" }}
                >
                  <Button asChild size="lg">
                    <Link href={DEMO_PATH}>{HERO.primary}</Link>
                  </Button>
                  <ContactTrigger size="lg" variant="outline">
                    {HERO.secondary}
                  </ContactTrigger>
                </div>

                <p
                  className="mt-4 animate-rise text-sm text-ink/55 motion-reduce:animate-none"
                  style={{ animationDelay: "300ms" }}
                >
                  {HERO.note}{" "}
                  <a href="#pasi" className={`text-ink/75 ${linkUnderline}`}>
                    Cum funcționează
                  </a>
                </p>
              </div>

              <div className="relative pb-10 sm:pb-12 lg:pb-8">
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
          <section id="invitatia" className="scroll-mt-24 border-y border-ink/10 bg-mist/35 px-6 py-10 sm:py-12">
            <div className="mx-auto w-full max-w-6xl">
              <div className="max-w-2xl">
                <p className={eyebrow}>Pentru invitați</p>
                <h2 className={h2}>Se deschide dintr-un link. Atât.</h2>
                <p className={lead}>
                  Fără cont, fără aplicație, fără pași în plus. Invitatul vede când și unde are loc
                  nunta, confirmă în câteva secunde și, după ce publicați așezarea, își găsește locul
                  la masă.
                </p>
              </div>

              <div className="mt-7 grid items-center gap-8 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-10 lg:gap-14">
                <div className="mx-auto w-[168px] sm:mx-0 sm:w-full sm:max-w-[12rem]">
                  <PhoneFrame>
                    <Screenshot
                      name="confirmare-telefon"
                      alt="Confirmarea de prezență pe telefon, cu numele deja completat"
                      sizes="(min-width: 640px) 210px, 168px"
                    />
                  </PhoneFrame>
                </div>

                <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  {GUEST_FEATURES.map((feature, index) => (
                    <li key={feature.title} className="border-t border-ink/15 pt-3">
                      <h3 className="flex items-baseline gap-2 font-display text-base text-ink">
                        <span className="text-xs text-gold">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{feature.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------------- panou */}
          <section id="panou" className="scroll-mt-24 px-6 py-10 sm:py-12">
            <div className="mx-auto w-full max-w-6xl">
              <div className="max-w-2xl">
                <p className={eyebrow}>Panoul vostru</p>
                <h2 className={h2}>Tot ce se întâmplă înainte de nuntă, într-un singur loc.</h2>
                <p className={lead}>
                  Fără foi de calcul trimise pe email și fără liste pe care le țineți minte. Fiecare
                  răspuns, fiecare masă și fiecare plată sunt la vedere, pe măsură ce se întâmplă.
                </p>
              </div>

              <PanelAccordion sections={PANEL_SECTIONS} />
            </div>
          </section>

          {/* -------------------------------------------------------------- teme */}
          <section id="teme" className="scroll-mt-24 border-y border-ink/10 bg-mist/35 px-6 py-10 sm:py-12">
            <div className="mx-auto w-full max-w-6xl">
              <div className="max-w-2xl">
                <p className={eyebrow}>Teme</p>
                <h2 className={h2}>Alese de voi, nu impuse de noi.</h2>
                <p className={lead}>
                  Aveți de ales între {THEME_COUNTS.palettes} palete de culori și{" "}
                  {THEME_COUNTS.florals} decoruri florale. Le schimbați oricând din panou, iar linkul
                  rămâne același.
                </p>
              </div>

              <ThemeAccordion />
            </div>
          </section>

          {/* -------------------------------------------------------------- pași */}
          <section id="pasi" className="scroll-mt-24 px-6 py-10 sm:py-12">
            <div className="mx-auto w-full max-w-6xl">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-xl">
                  <p className={eyebrow}>Cum funcționează</p>
                  <h2 className={h2}>Trei pași, niciunul complicat.</h2>
                </div>
                <p className="text-sm text-ink/60">
                  Restul le lămurim pe email:{" "}
                  <ContactLink className={`text-ink ${linkUnderline}`}>{CONTACT_EMAIL}</ContactLink>
                </p>
              </div>

              <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="rounded-xl border border-ink/10 bg-paper/40 px-4 py-3">
                    <p className="flex items-baseline gap-2 font-display text-base text-ink">
                      <span className="text-sm text-gold">{index + 1}</span>
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/65">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* -------------------------------------------------------------- preț */}
          <section id="pret" className="scroll-mt-24 px-6 pb-10 sm:pb-12">
            <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-ink px-6 py-8 text-sea sm:px-10 sm:py-10">
              <div className="max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.3em] text-sea/60">{PRICE.eyebrow}</p>
                <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{PRICE.title}</h2>
                <p className="mt-3 leading-relaxed text-sea/70">{PRICE.text}</p>
              </div>

              <PlanCards />

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-sea/60">{PRICE.note}</p>

              <div
                id="contact"
                className="mt-6 flex scroll-mt-28 flex-wrap items-center gap-x-5 gap-y-3 border-t border-sea/15 pt-6"
              >
                <ContactTrigger size="lg" className="bg-gold text-olive hover:bg-gold/90">
                  Cere ofertă
                </ContactTrigger>
                <ContactLink className="text-sm text-sea/65 underline decoration-gold/40 underline-offset-4 transition-colors hover:text-sea">
                  sau scrieți-ne la {CONTACT_EMAIL}
                </ContactLink>
              </div>
            </div>
          </section>

          {/* --------------------------------------------------------- întrebări */}
          <section id="intrebari" className="scroll-mt-24 border-t border-ink/10 px-6 py-10 sm:py-12">
            <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
              <div>
                <p className={eyebrow}>Întrebări</p>
                <h2 className={h2}>Ce ne întreabă mirii cel mai des.</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">
                  Nu găsiți răspunsul?{" "}
                  <ContactTrigger variant="link" className={`h-auto p-0 text-sm font-normal text-ink ${linkUnderline}`}>
                    Scrieți-ne
                  </ContactTrigger>
                  .
                </p>
              </div>
              <div className="divide-y divide-ink/10 border-y border-ink/10">
                {FAQ.map((item) => (
                  <details key={item.question} className="group py-3.5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-display text-lg text-ink [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span
                        aria-hidden
                        className="shrink-0 text-xl text-gold transition-transform duration-200 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-2 max-w-2xl pr-8 text-sm leading-relaxed text-ink/65">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-ink/10 px-6 py-7 text-sm text-ink/60">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <p className="font-display text-xl text-ink">
                {BRAND}
                <span className="text-gold">.</span>
              </p>
              <p className="mt-2 leading-relaxed">{FOOTER_NOTE}</p>
              <p className="mt-2 leading-relaxed">
                <span className="text-ink/45">Email:</span>{" "}
                <span className="select-all text-ink/80">{CONTACT_EMAIL}</span>
              </p>
            </div>
            <nav aria-label="Linkuri" className="flex max-w-sm flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm lg:max-w-none">
              <Link href={DEMO_PATH} className={linkUnderline}>
                Invitația demo
              </Link>
              <ContactLink className={linkUnderline}>Contact</ContactLink>
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
      </ContactDialogProvider>
    </div>
  );
}
