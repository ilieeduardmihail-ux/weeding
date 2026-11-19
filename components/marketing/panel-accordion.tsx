"use client";

import { Accordion } from "@/components/marketing/accordion";
import type { PanelSection } from "@/lib/marketing";

/**
 * The panel tour, as a plain accordion.
 *
 * Every row starts closed: the landing page used to open the first section on
 * load, which pushed the price down a whole screen. There are no screenshots
 * here either — the rows explain the panel in words, and the invitation itself
 * is already shown at the top of the page.
 */
export function PanelAccordion({ sections }: { sections: readonly PanelSection[] }) {
  return (
    <Accordion
      idPrefix="panou"
      items={sections.map((section) => ({
        id: section.id,
        eyebrow: section.eyebrow,
        title: section.title,
        text: section.text,
        body: (
          <ul className="grid gap-x-10 gap-y-2.5 pb-5 text-sm text-ink/70 sm:grid-cols-2">
            {section.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold/80" />
                {bullet}
              </li>
            ))}
          </ul>
        ),
      }))}
    />
  );
}
