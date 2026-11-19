"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type AccordionItem = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  /** Small visual hint (colour dots, thumbnails) that stays visible when closed. */
  preview?: ReactNode;
  body: ReactNode;
};

/**
 * One row open at a time, animated with `grid-template-rows` so the real height
 * is used and nothing has to be measured. Shared by the panel tour and the
 * theme section, which used to stack every screenshot and every palette.
 */
export function Accordion({
  items,
  idPrefix,
  defaultOpen = null,
  className = "mt-6 divide-y divide-ink/10 border-y border-ink/10",
}: {
  items: readonly AccordionItem[];
  /** Prefix for `aria-controls`, so two accordions can live on one page. */
  idPrefix: string;
  defaultOpen?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(defaultOpen);

  return (
    <div className={className}>
      {items.map((item) => {
        const expanded = open === item.id;
        const panelId = `${idPrefix}-${item.id}`;
        return (
          <article key={item.id} className="py-1">
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : item.id)}
                className="group flex w-full items-start justify-between gap-6 py-4 text-left transition-colors duration-200 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                    {item.eyebrow}
                  </span>
                  <span className="mt-2 block font-display text-xl leading-snug text-ink sm:text-2xl">
                    {item.title}
                  </span>
                  <span className="mt-1.5 block max-w-2xl text-sm leading-relaxed text-ink/65">
                    {item.text}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {item.preview}
                  <span
                    aria-hidden
                    className={`mt-1 inline-flex size-9 items-center justify-center rounded-full border border-ink/15 bg-paper/50 text-ink/70 transition-transform duration-300 ${
                      expanded ? "rotate-180 border-gold/50 text-gold" : ""
                    }`}
                  >
                    <ChevronDown className="size-4" />
                  </span>
                </span>
              </button>
            </h3>

            {/* 0fr → 1fr animates the real height, so nothing is guessed. */}
            <div
              id={panelId}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">{item.body}</div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
