"use client";

import { Accordion } from "@/components/marketing/accordion";
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
  return (
    <Accordion
      idPrefix="panou"
      defaultOpen={sections[0]?.id ?? null}
      items={sections.map((section) => ({
        id: section.id,
        eyebrow: section.eyebrow,
        title: section.title,
        text: section.text,
        body: (
          <div className="grid items-center gap-8 pb-6 lg:grid-cols-2 lg:gap-14">
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
        ),
      }))}
    />
  );
}
