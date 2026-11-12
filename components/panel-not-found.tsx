import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * "This address does not exist", for a panel.
 *
 * A mistyped URL under `/<slug>/admin` or `/platform` used to fall through to
 * the guest 404, which talks about an invitation to someone who is already
 * inside their admin — and offers "înapoi la invitație" instead of a way back.
 * Both panels render this through a catch-all route, because a plain
 * `not-found.tsx` in a segment only covers `notFound()` thrown from inside it,
 * not a URL that matches no route at all.
 */
export function PanelNotFound({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="text-ink/70">{body}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 underline decoration-gold underline-offset-4 transition-colors duration-200 hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {label}
      </Link>
    </main>
  );
}
