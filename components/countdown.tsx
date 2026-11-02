"use client";
import { useEffect, useState } from "react";
import { remainingParts } from "@/lib/countdown";

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (now === null) return <div className="h-16" aria-hidden />;
  const parts = remainingParts(target, now);
  const units = [
    ["zile", parts.days],
    ["ore", parts.hours],
    ["minute", parts.minutes],
    ["secunde", parts.seconds],
  ] as const;

  return (
    <dl className="flex justify-center gap-8 sm:gap-12">
      {units.map(([label, value]) => (
        <div key={label} className="text-center">
          <dd className="font-display text-3xl tabular-nums sm:text-5xl">{String(value).padStart(2, "0")}</dd>
          <dt className="mt-1 text-sm text-ink/60">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
