import Link from "next/link";

const linkClass =
  "rounded-sm transition-colors duration-200 ease-out hover:text-ink hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

/**
 * Server component on purpose: the footer is static text, so it costs no
 * client JavaScript (it used to pull the animation library in through Reveal).
 */
export function Footer({ names, email, slug }: { names: [string, string]; email: string; slug?: string }) {
  const [a, b] = names;
  const base = slug ? `/${slug}` : "";

  return (
    <footer className="border-t border-ink/10 px-6 py-12 text-center text-sm text-ink/65">
      <p className="font-display text-2xl text-ink">
        {a} <span className="text-gold italic">&amp;</span> {b}
      </p>
      <nav aria-label="Linkuri utile" className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <Link href={`${base}#rsvp`} className={linkClass}>
          Confirmă prezența
        </Link>
        <a href={`${base}/calendar`} className={linkClass}>
          Calendar
        </a>
        <Link href={`${base}/confidentialitate`} className={linkClass}>
          Confidențialitate
        </Link>
        <a href={`mailto:${email}`} className={linkClass}>
          {email}
        </a>
      </nav>
    </footer>
  );
}
