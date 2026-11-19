import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteSandboxButton } from "@/components/admin/delete-sandbox-button";
import { sandboxDaysLeft } from "@/lib/leads-code";

/**
 * The strip at the top of a demo panel. It says the three things a visitor
 * needs to know — this copy is yours, it expires, and how to keep it — and it
 * is the only place where the demo can become a sale.
 */
export function SandboxBar({ expiresAt }: { expiresAt: string | null }) {
  const days = sandboxDaysLeft(expiresAt);
  const when =
    days === 0 ? "se șterge astăzi" : days === 1 ? "mai ține o zi" : `mai ține ${days} zile`;

  return (
    <div className="border-b border-gold/40 bg-gold/15 text-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <p className="flex items-center gap-2 text-xs leading-snug sm:text-sm">
          <Sparkles aria-hidden="true" className="size-4 shrink-0 text-gold" />
          <span>
            <strong>Panoul demo</strong> — copia ta de lucru, doar a ta. {when.charAt(0).toUpperCase() + when.slice(1)}.
          </span>
        </p>
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="outline" className="border-ink/30">
            <Link href="/?oferta=1#contact">
              Vreau invitația mea <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <DeleteSandboxButton />
        </div>
      </div>
    </div>
  );
}
