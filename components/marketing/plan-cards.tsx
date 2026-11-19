"use client";

import { useState } from "react";
import { PLANS, type Plan } from "@/lib/marketing";

/**
 * The two packages, side by side on a wide screen and one at a time on a phone.
 *
 * Stacked on a phone they took almost a full screen and the second card pushed
 * the contact button out of reach, so the small switch picks one and only that
 * one is shown. From lg both are visible and the switch disappears.
 */
export function PlanCards() {
  const [active, setActive] = useState(PLANS.find((plan) => plan.featured)?.id ?? PLANS[0].id);

  return (
    <div className="mt-6">
      <div
        role="group"
        aria-label="Alege pachetul"
        className="flex gap-1 rounded-full border border-sea/20 p-1 lg:hidden"
      >
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            aria-pressed={active === plan.id}
            onClick={() => setActive(plan.id)}
            className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors duration-200 ${
              active === plan.id ? "bg-gold text-olive" : "text-sea/70 hover:text-sea"
            }`}
          >
            {plan.name}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} shown={active === plan.id} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, shown }: { plan: Plan; shown: boolean }) {
  return (
    <article
      className={`relative rounded-2xl border p-5 sm:p-6 ${shown ? "" : "hidden lg:block"} ${
        plan.featured ? "border-gold/60 bg-gold/10" : "border-sea/15 bg-sea/5"
      }`}
    >
      {plan.featured && (
        <span className="absolute -top-3 right-5 rounded-full bg-gold px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-olive">
          Recomandat
        </span>
      )}
      <h3 className="font-display text-2xl">{plan.name}</h3>
      <p className="mt-1 text-sm leading-relaxed text-sea/65">{plan.tagline}</p>
      <ul className="mt-4 grid gap-2 text-sm text-sea/80">
        {plan.included.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden className="mt-1.5 shrink-0 text-gold">
              ✦
            </span>
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-sea/10 pt-3 text-xs leading-relaxed text-sea/55">
        {plan.note}
      </p>
    </article>
  );
}
