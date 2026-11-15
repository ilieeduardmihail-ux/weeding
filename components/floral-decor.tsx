"use client";

/**
 * Decorative layer drawn behind the invitation. Every set is a photograph,
 * picked per wedding in /admin/theme: the saved placement decides where the
 * bouquet sits and how it is mirrored, the intensity only changes its opacity.
 *
 * The pictures are palette-independent, so they look the same on every theme.
 */
import type { CSSProperties } from "react";
import type { FloralImage, FloralIntensity, FloralPlacement } from "@/lib/theme";
import { FLORAL_IMAGES, floralSrcSet } from "@/lib/theme";

const OPACITY: Record<FloralIntensity, number> = { subtle: 0.45, medium: 0.7, rich: 0.95 };

/* ------------------------------------------------------------------ layout */

/**
 * How big a corner decoration is. It starts in the corner and reaches about a
 * quarter of the screen, never more: the slot is a box whose width is the
 * smaller of 25% of the viewport width and 40% of its height, and whose height
 * is 40% of the viewport, so four corners never meet in the middle. The picture
 * is contained in that box rather than stretched, which keeps tall bouquets
 * from being squashed.
 */
const CORNER = "w-[clamp(7rem,min(25vw,40vh),22rem)] h-[40vh]";
const CORNER_SM = "w-[clamp(5.5rem,min(18vw,30vh),16rem)] h-[30vh]";

/** Pinned to the corner the slot occupies; the mirroring moves it to the rest. */
const CORNER_IMAGE = "h-full w-full object-contain object-left-top";

type Slot = { cls: string; flip?: string; size: string; hide?: string };

// A photographed corner is drawn for the top-left corner, so the mirroring is
// the other way round from the old drawn sets.
const PLACEMENTS: Record<FloralPlacement, Slot[]> = {
  corners: [
    { cls: "top-0 left-0", size: CORNER, hide: "hidden md:block" },
    { cls: "bottom-0 right-0", flip: "-scale-x-100 -scale-y-100", size: CORNER_SM },
  ],
  top: [
    { cls: "top-0 left-0", size: CORNER },
    { cls: "top-0 right-0", flip: "-scale-x-100", size: CORNER },
  ],
  bottom: [
    { cls: "bottom-0 left-0", flip: "-scale-y-100", size: CORNER },
    { cls: "bottom-0 right-0", flip: "-scale-x-100 -scale-y-100", size: CORNER },
  ],
  frame: [
    { cls: "top-0 left-0", size: CORNER },
    { cls: "top-0 right-0", flip: "-scale-x-100", size: CORNER },
    { cls: "bottom-0 left-0", flip: "-scale-y-100", size: CORNER },
    { cls: "bottom-0 right-0", flip: "-scale-x-100 -scale-y-100", size: CORNER },
  ],
};

/**
 * How wide the browser should assume a corner is, so it picks the 420px file on
 * a phone and the 760px one on a retina laptop. Both slots of a page land on the
 * same URL, so a page still downloads one picture, not four.
 */
const PHOTO_SIZES = "(min-width: 768px) 352px, 112px";

/**
 * A photographed floral set. `<picture>` gives browsers that speak AVIF the
 * smaller file and everyone else WebP (with transparency, which the source art
 * needs); the PNG masters are not shipped.
 */
function FloralPhoto({
  photo,
  className,
  sizes,
  style,
  pictureClassName = "block",
}: {
  photo: FloralImage;
  className: string;
  sizes: string;
  style?: CSSProperties;
  /** The `<picture>` wrapper is inline by default; give it a box when it must fill a parent. */
  pictureClassName?: string;
}) {
  return (
    <picture className={pictureClassName} style={style}>
      <source type="image/avif" srcSet={floralSrcSet(photo, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={floralSrcSet(photo, "webp")} sizes={sizes} />
      <img
        src={`${photo.src}-${photo.widths[0]}.webp`}
        width={photo.width}
        height={photo.height}
        alt=""
        decoding="async"
        className={className}
      />
    </picture>
  );
}

export function FloralDecor({
  set,
  intensity,
  placement,
}: {
  set: string;
  intensity: FloralIntensity;
  placement: FloralPlacement;
}) {
  const photo = FLORAL_IMAGES[set] ?? FLORAL_IMAGES["photo-bujori"];

  const opacity = OPACITY[intensity];

  // A "frame" picture paints both diagonal corners itself, so it simply covers
  // the whole page instead of being mirrored into four slots.
  if (photo.kind === "frame") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <FloralPhoto
          photo={photo}
          className="h-full w-full object-cover object-center"
          sizes="100vw"
          style={{ opacity }}
          pictureClassName="block h-full w-full"
        />
      </div>
    );
  }

  const slots = PLACEMENTS[placement] ?? PLACEMENTS.corners;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {slots.map((slot) => (
        <div
          key={slot.cls}
          className={`absolute ${slot.cls} ${slot.hide ?? ""} ${slot.size} ${slot.flip ?? ""}`}
          style={{ opacity }}
        >
          <FloralPhoto
            photo={photo}
            className={CORNER_IMAGE}
            sizes={PHOTO_SIZES}
            pictureClassName="block h-full w-full"
          />
        </div>
      ))}
    </div>
  );
}
