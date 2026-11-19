import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * The strip above the public demo. /demo is the pitch: a visitor can read the
 * whole invitation for free, and the only thing this bar adds is the door to
 * the panel — a free copy of this wedding that lasts seven days.
 */
export function DemoAccountBar() {
  return (
    <div className="border-b border-gold/40 bg-gold/15 text-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <p className="flex items-center gap-2 text-xs leading-snug sm:text-sm">
          <Sparkles aria-hidden="true" className="size-4 shrink-0 text-gold" />
          <span>
            <strong>Invitație demonstrativă.</strong> Îți place? Îți faci propria copie în panou,
            gratis 7 zile.
          </span>
        </p>
        <Link
          href="/demo/cont"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium underline decoration-gold underline-offset-4 transition-colors duration-200 hover:text-ink/70 sm:text-sm"
        >
          Deschide panoul demo <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
