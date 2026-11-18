"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { BrowserFrame, Screenshot } from "@/components/marketing/frames";
import type { PanelSection } from "@/lib/marketing";

/**
 * The panel tour, folded into an accordion.
 *
 * The presentation page used to stack four full-size mockups, which pushed the
 * price and the contact form far below the fold. Each section now keeps its
 * title and a one-line summary visible and opens on click, with the screenshot
 * and the details inside. The first one starts open so the section still shows
 * what the product looks like.
 */
export function PanelAccordion({ sections }: { sections: readonly PanelSection[] }) {
  const [open, setOpen] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
      {sections.map((section) => {
        const expanded = open === section.id;
        return (
          <article key={section.id} className="py-2">
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`panou-${section.id}`}
                onClick={() => setOpen(expanded ? null : section.id)}
                className="group flex w-full items-start justify-between gap-6 py-5 text-left transition-colors duration-200 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                    {section.eyebrow}
                  </span>
                  <span className="mt-2 block font-display text-xl leading-snug text-ink sm:text-2xl">
                    {section.title}
                  </span>
                  <span className="mt-1.5 block max-w-2xl text-sm leading-relaxed text-ink/65">
                    {section.text}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-paper/50 text-ink/70 transition-transform duration-300 ${
                    expanded ? "rotate-180 border-gold/50 text-gold" : ""
                  }`}
                >
                  <ChevronDown className="size-4" />
                </span>
              </button>
            </h3>

            {/* 0fr → 1fr animates the real height, so nothing is guessed. */}
            <div
              id={`panou-${section.id}`}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="grid items-center gap-8 pb-8 lg:grid-cols-2 lg:gap-14">
                  <BrowserFrame url="ne-casatorim.ro/demo/admin">
                    <Screenshot
                      name={section.image}
                      alt={section.alt}
                      sizes="(min-width: 1024px) 560px, 92vw"
                    />
                  </BrowserFrame>
                  <ul className="space-y-2.5 text-sm text-ink/70">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold/80" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
