import Link from "next/link";
import { ContactLink } from "@/components/marketing/contact-link";
import { ThemeToggle } from "@/components/marketing/theme-toggle";
import { LEGAL_PAGES, LEGAL_UPDATED } from "@/lib/legal";
import { BRAND, CONTACT_EMAIL, DEMO_PATH } from "@/lib/marketing";

const navLink =
  "rounded-sm transition-colors duration-200 ease-out hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";
const footerLink =
  "rounded-sm underline-offset-4 transition-colors duration-200 ease-out hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

/**
 * Frame shared by the platform's legal pages: brand, the four documents, the
 * light/dark switch and a footer that reaches the same places on a phone.
 *
 * It carries `.marketing`, which is what scopes dark mode to this part of the
 * site — invitations and admin panels never get the dark variables.
 */
export function LegalShell({
  title,
  intro,
  current,
  children,
}: {
  title: string;
  intro: React.ReactNode;
  current?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="marketing flex min-h-svh flex-col bg-sea text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 glass-bar">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="font-display text-lg tracking-wide text-ink">
            {BRAND}
            <span className="text-gold">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav aria-label="Documente legale" className="hidden items-center gap-5 text-sm text-ink/70 md:flex">
              {LEGAL_PAGES.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  aria-current={current === page.href ? "page" : undefined}
                  className={`${navLink} ${current === page.href ? "text-ink" : ""}`}
                >
                  {page.label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
        <div className="mt-4 text-lg leading-relaxed text-ink/70">{intro}</div>
        <div className="mt-12 space-y-10 text-ink/80">{children}</div>
        <p className="mt-14 border-t border-ink/10 pt-6 text-sm text-ink/55">
          Ultima actualizare: {LEGAL_UPDATED}.
        </p>
      </main>

      <footer className="border-t border-ink/10 px-6 py-10 text-center text-sm text-ink/60">
        <nav aria-label="Linkuri" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <Link href="/" className={footerLink}>
            Pagina principală
          </Link>
          <Link href={DEMO_PATH} className={footerLink}>
            Invitația demo
          </Link>
          {LEGAL_PAGES.map((page) => (
            <Link key={page.href} href={page.href} className={footerLink}>
              {page.label}
            </Link>
          ))}
          <ContactLink className={footerLink}>
            {CONTACT_EMAIL}
          </ContactLink>
        </nav>
        <p className="mt-6 text-xs text-ink/45">
          {BRAND} · invitații digitale pentru nuntă
        </p>
      </footer>
    </div>
  );
}

/** One numbered/headed block inside a legal document. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl leading-snug text-ink">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

/** External link that never leaks the opener. */
export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
    >
      {children}
    </a>
  );
}
