"use client";
import { useEffect, useState } from "react";

export function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const t = new Date(target).getTime();
    const tick = () => setLeft(Math.max(0, t - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (left === null) return <div className="h-16" aria-hidden />;
  const units = [
    ["days", Math.floor(left / 864e5)],
    ["hours", Math.floor(left / 36e5) % 24],
    ["minutes", Math.floor(left / 6e4) % 60],
    ["seconds", Math.floor(left / 1e3) % 60],
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
