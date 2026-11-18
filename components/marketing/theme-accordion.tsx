import { Accordion } from "@/components/marketing/accordion";
import { FLORAL_IMAGES, FLORAL_SETS, PALETTES, floralSrcSet } from "@/lib/theme";

/** Counts for the section copy, without pulling the arrays into the page. */
export const THEME_COUNTS = { palettes: PALETTES.length, florals: FLORAL_SETS.length } as const;

/** The six bouquets that represent the ten floral sets. */
const FLORAL_PREVIEW = [
  "photo-bujori",
  "photo-bujori-si-trandafiri",
  "photo-trandafiri-vintage",
  "photo-bordo-si-aur",
  "photo-hortensie-albastra",
  "photo-flori-mov",
] as const;

/**
 * The theme section, folded into two rows. Both start closed, so the palettes
 * no longer push the price and the form down the page; the header keeps a tiny
 * preview (four accent dots, three bouquets) to show what sits inside.
 */
export function ThemeAccordion() {
  return (
    <Accordion
      idPrefix="teme"
      items={[
        {
          id: "palete",
          eyebrow: "Palete de culori",
          title: `${PALETTES.length} palete, alese de voi`,
          text: "Ivory, șampanie, roz prăfuit, măsliniu. Le schimbați oricând din panou, iar linkul rămâne același.",
          preview: (
            <span aria-hidden className="hidden items-center gap-1 sm:flex">
              {PALETTES.slice(0, 4).map((palette) => (
                <span
                  key={palette.id}
                  className="size-2.5 rounded-full ring-1 ring-ink/10"
                  style={{ backgroundColor: palette.accent }}
                />
              ))}
            </span>
          ),
          body: (
            <div className="grid gap-3 pb-6 sm:grid-cols-3 lg:grid-cols-6">
              {PALETTES.map((palette) => (
                <div
                  key={palette.id}
                  className="card-hover overflow-hidden rounded-xl border border-ink/10 shadow-[0_14px_30px_-26px_rgba(44,51,37,0.5)]"
                  style={{ backgroundColor: palette.paper }}
                >
                  <div
                    className="flex h-14 items-end gap-1.5 p-3"
                    style={{ backgroundColor: palette.bg }}
                  >
                    <span className="size-6 rounded-full" style={{ backgroundColor: palette.mist }} />
                    <span className="size-6 rounded-full" style={{ backgroundColor: palette.sage }} />
                    <span className="size-6 rounded-full" style={{ backgroundColor: palette.rose }} />
                    <span
                      className="ml-auto size-3.5 rounded-full"
                      style={{ backgroundColor: palette.accent }}
                    />
                  </div>
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-2"
                    style={{ color: palette.text }}
                  >
                    <p className="font-display text-xs leading-tight">{palette.name}</p>
                    <span
                      aria-hidden
                      className="font-display text-base leading-none"
                      style={{ color: palette.accent }}
                    >
                      A&amp;S
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex flex-col justify-center rounded-xl border border-dashed border-ink/20 bg-paper/50 p-3 text-xs leading-relaxed text-ink/60">
                Vă place altceva? Potrivim culorile cu invitația tipărită.
              </div>
            </div>
          ),
        },
        {
          id: "decoruri",
          eyebrow: "Decoruri florale",
          title: `${FLORAL_SETS.length} decoruri din fotografii reale`,
          text: "Buchete adevărate, puse în colțuri, pe margini sau ca un cadru întreg.",
          preview: (
            <span aria-hidden className="hidden items-center gap-1 sm:flex">
              {FLORAL_PREVIEW.slice(0, 3).map((id) => {
                const image = FLORAL_IMAGES[id];
                if (!image) return null;
                return (
                  <picture key={id} className="block">
                    <source type="image/avif" srcSet={floralSrcSet(image, "avif")} sizes="28px" />
                    <source type="image/webp" srcSet={floralSrcSet(image, "webp")} sizes="28px" />
                    <img
                      src={`${image.src}-${image.widths[0]}.webp`}
                      alt=""
                      width={28}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className="h-7 w-7 object-contain opacity-80"
                    />
                  </picture>
                );
              })}
            </span>
          ),
          body: (
            <div className="flex flex-wrap items-center gap-4 pb-6">
              {FLORAL_PREVIEW.map((id) => {
                const image = FLORAL_IMAGES[id];
                if (!image) return null;
                return (
                  <picture key={id} className="block">
                    <source type="image/avif" srcSet={floralSrcSet(image, "avif")} sizes="64px" />
                    <source type="image/webp" srcSet={floralSrcSet(image, "webp")} sizes="64px" />
                    <img
                      src={`${image.src}-${image.widths[0]}.webp`}
                      alt=""
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-16 object-contain opacity-90"
                    />
                  </picture>
                );
              })}
              <div className="max-w-sm text-sm leading-relaxed text-ink/60">
                <p>
                  Decorurile sunt fotografii de buchete adevărate, puse în colțuri, pe margini sau ca
                  un cadru întreg.
                </p>
                <p className="mt-2 font-display text-ink/75">
                  {FLORAL_SETS.map((set) => set.name.replace("Poză · ", "")).join(" · ")}
                </p>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
