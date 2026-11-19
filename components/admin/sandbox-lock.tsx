"use client";

import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SANDBOX_LOCK } from "@/lib/demo/locks";

/**
 * Replaces a tab that a demo copy cannot use. The demo stays usable — the panel
 * is the product — but the paid outputs (published page, Excel, theme) are
 * explained instead of silently failing, and the one next step is a click away.
 */
export function SandboxLock({ feature }: { feature: keyof typeof SANDBOX_LOCK }) {
  const lock = SANDBOX_LOCK[feature];

  return (
    <div className="glass-soft mt-8 rounded-2xl border border-gold/35 p-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/20 text-gold">
        <Lock aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 font-display text-2xl leading-snug">{lock.title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/70">{lock.body}</p>
      <Button asChild className="mt-6 bg-ink text-sea hover:bg-ink/85">
        <Link href="/?oferta=1#contact">
          Vreau invitația mea <ArrowUpRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
