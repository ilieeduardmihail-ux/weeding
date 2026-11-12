"use client";
import { requestOpenInvitation } from "@/lib/invitation";
import { FloralDecor } from "@/components/floral-decor";
import { Countdown } from "@/components/countdown";
import type { Theme } from "@/lib/theme";

type HeroProps = {
  names: [string, string];
  displayDate: string;
  displayTime: string;
  /** Exact instant of the wedding, in ISO form, for the countdown. */
  eventAt: string;
  floral: Theme["floral"];
};

// The entrance is a CSS animation with a staggered delay, so the first paint
// is not blocked by a runtime animation library.
const rise = "animate-rise motion-reduce:animate-none";

export function Hero({ names, displayDate, displayTime, eventAt, floral }: HeroProps) {
  const [a, b] = names;

  return (
    <header className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Botanical decor, chosen per wedding in /admin/theme. It sits behind
          the type and never covers it. */}
      {floral.enabled && (
        <FloralDecor
          set={floral.set}
          intensity={floral.intensity}
          placement={floral.placement}
          id="flora-hero"
        />
      )}

      <div className="relative z-10 flex w-full flex-col items-center">
        <h1 className={`${rise} font-display text-[clamp(4rem,16vw,11rem)] leading-[0.9] tracking-tight`}>
          {a}
          <span className="block text-gold italic">&amp;</span>
          {b}
        </h1>
        <p className={`${rise} mt-8 text-lg [animation-delay:220ms]`}>
          {displayDate} · ora {displayTime}
        </p>
        <div className={`${rise} w-full [animation-delay:440ms]`}>
          <Countdown targetIso={eventAt} />
        </div>
        <div
          className={`${rise} mt-12 flex w-full max-w-sm flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center [animation-delay:660ms]`}
        >
          <button
            type="button"
            onClick={requestOpenInvitation}
            className="rounded-full bg-ink px-8 py-3 text-center text-sea shadow-lg shadow-black/20 transition-[background-color,transform] duration-200 ease-out hover:bg-ink/85 hover:-translate-y-px active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
          >
            Deschide Invitația
          </button>
        </div>
      </div>
    </header>
  );
}
