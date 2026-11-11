import Link from "next/link";
import { HeartOff } from "lucide-react";

/**
 * Shown when a slug has no live wedding behind it: a mistyped link, a site that
 * was suspended, or one whose access period ended. The tenant page marks these
 * responses `noindex`, so search engines drop them.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold">
        <HeartOff className="size-7" aria-hidden="true" />
      </span>
      <h1 className="font-display text-4xl">Invitația nu este disponibilă</h1>
      <p className="text-ink/70">
        Linkul nu duce către o nuntă activă. Verifică adresa primită sau cere una nouă de la gazde.
      </p>
      <Link
        href="/"
        className="underline decoration-gold underline-offset-4 transition-colors duration-200 hover:text-ink"
      >
        Înapoi la invitație
      </Link>
    </main>
  );
}
