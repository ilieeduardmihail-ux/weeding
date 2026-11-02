import Link from "next/link";

export function Footer({ names, email }: { names: [string, string]; email: string }) {
  const [a, b] = names;

  return (
    <footer className="border-t border-ink/10 px-6 py-12 text-center text-sm text-ink/65">
      <p className="font-display text-2xl text-ink">
        {a} <span className="text-gold italic">&amp;</span> {b}
      </p>
      <nav aria-label="Linkuri utile" className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <Link href="/#rsvp" className="underline-offset-4 hover:text-ink hover:underline">
          Confirmă prezența
        </Link>
        <a href="/calendar" className="underline-offset-4 hover:text-ink hover:underline">
          Calendar
        </a>
        <Link href="/confidentialitate" className="underline-offset-4 hover:text-ink hover:underline">
          Confidențialitate
        </Link>
        <a href={`mailto:${email}`} className="underline-offset-4 hover:text-ink hover:underline">
          {email}
        </a>
      </nav>
    </footer>
  );
}
