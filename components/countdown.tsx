"use client";

import { useEffect, useState } from "react";
import { remainingParts, type CountdownParts } from "@/lib/countdown";

/**
 * Time left until the wedding, shown under the date on the landing page.
 * The first render is left blank on purpose: the server and the browser do not
 * share a clock, so printing the numbers during hydration would mismatch. They
 * appear a millisecond later, once the client mounts.
 */
export function Countdown({ targetIso }: { targetIso: string }) {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const tick = () => setParts(remainingParts(targetIso));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (parts && parts.totalMs <= 0) {
    return (
      <p className="mt-6 text-xs uppercase tracking-[0.35em] text-gold">A sosit ziua cea mare</p>
    );
  }

  const items: { value: number; label: string }[] = [
    { value: parts?.days ?? 0, label: parts?.days === 1 ? "zi" : "zile" },
    { value: parts?.hours ?? 0, label: "ore" },
    { value: parts?.minutes ?? 0, label: "minute" },
    { value: parts?.seconds ?? 0, label: "secunde" },
  ];

  return (
    <div className="mt-6 flex items-stretch justify-center gap-2 sm:gap-4" aria-hidden={parts === null}>
      {items.map((item, index) => (
        <div key={item.label} className="flex items-stretch gap-2 sm:gap-4">
          {index > 0 && <span className="w-px self-stretch bg-ink/15" />}
          <div className="flex min-w-[3.5rem] flex-col items-center px-1">
            <span className="font-display text-2xl tabular-nums sm:text-3xl">
              {parts === null ? "--" : String(item.value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[0.6rem] uppercase tracking-[0.25em] text-ink/55">
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
