"use client";

/**
 * Decorative layer drawn behind the landing page. One of several sets, chosen
 * per tenant in /admin/theme. All shapes take their colour from the CSS custom
 * properties the theme sets, so they follow the palette automatically.
 */
import type { FloralIntensity, FloralPlacement } from "@/lib/theme";
import { FLORAL_IMAGES } from "@/lib/theme";
import { FloralCluster } from "@/components/floral-cluster";
import { FloralWatercolor } from "@/components/floral-watercolor";

const SAGE = "var(--color-sage)";
const GOLD = "var(--color-gold)";
const ROSE = "var(--color-rose)";
const INK = "var(--color-ink)";
const PAPER = "var(--color-paper)";

const OPACITY: Record<FloralIntensity, number> = { subtle: 0.45, medium: 0.7, rich: 0.95 };

/* ------------------------------------------------------------------ shapes */

function Leaves({
  x,
  y,
  angle,
  count = 6,
  spread = 26,
  length = 1,
  fill,
  flip = false,
}: {
  x: number;
  y: number;
  angle: number;
  count?: number;
  spread?: number;
  length?: number;
  fill: string;
  flip?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d={`M0 0 C 2 ${-spread * count} 8 ${-spread * count} 14 0`} fill="none" stroke={fill} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 1) / (count + 1);
        const ly = -spread * count * t;
        const side = i % 2 === 0 ? (flip ? -1 : 1) : flip ? 1 : -1;
        return (
          <path
            key={i}
            d="M0 0 C9 -10 30 -12 43 0 C30 12 9 10 0 0 Z"
            transform={`translate(9 ${ly}) rotate(${side * 34}) scale(${length})`}
            fill={fill}
            opacity={0.95}
          />
        );
      })}
    </g>
  );
}

function Rose({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={fill} />
      <circle r={r * 0.66} fill={PAPER} opacity={0.35} />
      <circle r={r * 0.4} fill={fill} />
      <path d={`M ${-r * 0.5} ${r * 0.1} a ${r * 0.5} ${r * 0.5} 0 1 1 ${r} 0`} fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={1} />
    </g>
  );
}

function Daisy({ x, y, r, fill, core = GOLD }: { x: number; y: number; r: number; fill: string; core?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={i} cx={0} cy={-r} rx={r * 0.42} ry={r} transform={`rotate(${i * 60})`} fill={fill} />
      ))}
      <circle r={r * 0.42} fill={core} />
    </g>
  );
}

function Heart({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      d="M0 8 C-12 -2 -16 -14 -7 -19 C-2 -21 0 -16 0 -13 C0 -16 2 -21 7 -19 C16 -14 12 -2 0 8 Z"
      transform={`translate(${x} ${y}) scale(${s})`}
      fill={fill}
    />
  );
}

function Spark({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      d="M0 -12 C2 -4 4 -2 12 0 C4 2 2 4 0 12 C-2 4 -4 2 -12 0 C-4 -2 -2 -4 0 -12 Z"
      transform={`translate(${x} ${y}) scale(${s})`}
      fill={fill}
    />
  );
}

function stem(x: number, y: number, height: number, curve = 18) {
  return `M${x} ${y} C ${x - curve} ${y - height / 2} ${x + curve} ${y - height * 0.8} ${x} ${y - height}`;
}

/* ------------------------------------------------------------------ motifs */

function motif(set: string, id: string) {
  switch (set) {
    case "eucalyptus":
      return (
        <>
          <Leaves x={34} y={300} angle={-16} count={7} spread={24} length={0.9} fill={SAGE} />
          <Leaves x={80} y={300} angle={-6} count={7} spread={26} fill={SAGE} flip />
          <Leaves x={132} y={300} angle={4} count={6} spread={24} length={0.85} fill={GOLD} flip />
        </>
      );
    case "roses":
      return (
        <>
          <Leaves x={60} y={298} angle={-24} count={4} spread={26} fill={SAGE} />
          <Leaves x={120} y={298} angle={-8} count={4} spread={24} fill={SAGE} flip />
          <Rose x={70} y={250} r={26} fill={ROSE} />
          <Rose x={128} y={214} r={19} fill={ROSE} />
          <Rose x={36} y={196} r={15} fill={GOLD} />
          <Rose x={150} y={160} r={13} fill={ROSE} />
        </>
      );
    case "blossoms":
      return (
        <>
          {[50, 92, 138, 176].map((x, i) => (
            <path key={x} d={stem(x, 300, 120 + i * 24, 14)} fill="none" stroke={SAGE} strokeWidth={2} opacity={0.8} />
          ))}
          <Daisy x={50} y={180} r={16} fill={PAPER} />
          <Daisy x={92} y={152} r={13} fill={ROSE} />
          <Daisy x={138} y={132} r={15} fill={PAPER} />
          <Daisy x={176} y={108} r={11} fill={GOLD} />
        </>
      );
    case "laurel":
      return (
        <>
          <Leaves x={30} y={300} angle={-30} count={9} spread={30} length={0.7} fill={SAGE} />
          <Leaves x={96} y={300} angle={-52} count={9} spread={30} length={0.7} fill={GOLD} flip />
          <circle cx={62} cy={104} r={6} fill={GOLD} />
        </>
      );
    case "vine":
      return (
        <>
          <path d="M18 300 C 60 240 10 190 70 140 C 120 100 90 60 150 30" fill="none" stroke={SAGE} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
          {Array.from({ length: 9 }, (_, i) => {
            const t = i / 8;
            const x = 18 + t * 130;
            const y = 300 - t * 268;
            return (
              <path
                key={i}
                d="M0 0 C9 -10 30 -12 43 0 C30 12 9 10 0 0 Z"
                transform={`translate(${x} ${y}) rotate(${i % 2 ? 40 : -40}) scale(0.8)`}
                fill={i % 3 === 0 ? ROSE : SAGE}
              />
            );
          })}
        </>
      );
    case "hearts":
      return (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Heart key={i} x={40 + i * 26} y={280 - i * 44} s={0.7 + (i % 3) * 0.25} fill={i % 2 ? ROSE : GOLD} />
          ))}
        </>
      );
    case "sparkles":
      return (
        <>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Spark key={i} x={30 + ((i * 47) % 170)} y={40 + ((i * 61) % 250)} s={0.5 + ((i * 13) % 10) / 12} fill={i % 3 === 0 ? GOLD : PAPER} />
          ))}
        </>
      );
    case "confetti":
      return (
        <>
          {Array.from({ length: 26 }, (_, i) => {
            const x = 10 + ((i * 53) % 200);
            const y = 20 + ((i * 97) % 280);
            const r = 3 + ((i * 7) % 5);
            const fill = [ROSE, GOLD, SAGE, PAPER][i % 4];
            return i % 3 === 0 ? (
              <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.6} transform={`rotate(${(i * 37) % 180} ${x} ${y})`} fill={fill} />
            ) : (
              <circle key={i} cx={x} cy={y} r={r} fill={fill} />
            );
          })}
        </>
      );
    case "wildflowers":
      return (
        <>
          {[44, 84, 126, 168].map((x, i) => (
            <path key={x} d={stem(x, 300, 110 + i * 20, 16)} fill="none" stroke={SAGE} strokeWidth={2} opacity={0.8} />
          ))}
          <Daisy x={44} y={190} r={14} fill={ROSE} />
          <Daisy x={84} y={160} r={11} fill={PAPER} />
          <Daisy x={126} y={134} r={13} fill={GOLD} />
          <Daisy x={168} y={104} r={10} fill={ROSE} />
          <Leaves x={100} y={300} angle={-14} count={4} spread={30} length={0.8} fill={SAGE} />
          <Leaves x={150} y={300} angle={-40} count={4} spread={28} length={0.75} fill={SAGE} flip />
        </>
      );
    case "arch":
      return (
        <>
          <path d="M12 300 C 12 150 90 60 210 54" fill="none" stroke={SAGE} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
          {Array.from({ length: 10 }, (_, i) => {
            const t = i / 9;
            const angle = -90 + t * 90;
            const rad = (angle * Math.PI) / 180;
            const x = 12 + 198 * (1 - Math.cos(rad)) * (t > 0.5 ? 1 : 1);
            const y = 300 - 246 * Math.sin(rad);
            return (
              <g key={i}>
                <path d="M0 0 C9 -10 30 -12 43 0 C30 12 9 10 0 0 Z" transform={`translate(${x} ${y}) rotate(${90 - t * 90}) scale(0.75)`} fill={i % 4 === 0 ? ROSE : SAGE} />
                {i % 3 === 0 && <circle cx={x + 6} cy={y - 10} r={4} fill={GOLD} />}
              </g>
            );
          })}
        </>
      );
    case "botanical":
    default:
      return <FloralCluster id={id} className="h-full w-full" />;
  }
}

/* ------------------------------------------------------------------ layout */

/**
 * How big a corner decoration is. It starts in the corner and reaches about a
 * quarter of the screen, never more: the width is the smaller of 25% of the
 * viewport width and 40% of its height, and the height is capped as well, so
 * four corners never meet in the middle. Every set — drawn or photographed —
 * uses the same scale.
 */
const CORNER = "w-[clamp(7rem,min(25vw,40vh),22rem)] max-h-[40vh]";
const CORNER_SM = "w-[clamp(5.5rem,min(18vw,30vh),16rem)] max-h-[30vh]";

type Slot = { cls: string; flip?: string; size: string; hide?: string };

// The drawn sets (botanical, eucalyptus, …) are anchored to the bottom-left of
// their viewBox, so a vertical mirror moves them to the top.
const PLACEMENTS: Record<FloralPlacement, Slot[]> = {
  corners: [
    { cls: "bottom-0 left-0", size: CORNER, hide: "hidden md:block" },
    { cls: "top-0 right-0", flip: "rotate-180", size: CORNER_SM },
  ],
  top: [
    { cls: "top-0 left-0", flip: "-scale-y-100", size: CORNER },
    { cls: "top-0 right-0", flip: "-scale-x-100 -scale-y-100", size: CORNER },
  ],
  bottom: [
    { cls: "bottom-0 left-0", size: CORNER },
    { cls: "bottom-0 right-0", flip: "-scale-x-100", size: CORNER },
  ],
  frame: [
    { cls: "bottom-0 left-0", size: CORNER },
    { cls: "bottom-0 right-0", flip: "-scale-x-100", size: CORNER },
    { cls: "top-0 left-0", flip: "-scale-y-100", size: CORNER },
    { cls: "top-0 right-0", flip: "-scale-x-100 -scale-y-100", size: CORNER },
  ],
};

// A photographed corner is drawn for the top-left corner, so the mirroring is
// the other way round.
const PHOTO_PLACEMENTS: Record<FloralPlacement, Slot[]> = {
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

export function FloralDecor({
  set,
  intensity,
  placement,
  id,
}: {
  set: string;
  intensity: FloralIntensity;
  placement: FloralPlacement;
  id: string;
}) {
  const opacity = OPACITY[intensity];
  const photo = FLORAL_IMAGES[set];

  // A "frame" picture paints both diagonal corners itself, so it simply covers
  // the whole landing instead of being mirrored into four slots.
  if (photo?.kind === "frame") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* A plain img keeps arbitrary uploaded/replaced artwork working without
            touching next.config; these are decorative and aria-hidden. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt=""
          className="h-full w-full object-cover object-center"
          style={{ opacity }}
        />
      </div>
    );
  }

  const slots = (photo ? PHOTO_PLACEMENTS : PLACEMENTS)[placement] ?? PLACEMENTS.corners;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {slots.map((slot, index) => (
        <div
          key={slot.cls}
          className={`absolute ${slot.cls} ${slot.hide ?? ""} ${slot.flip ?? ""}`}
          style={{ opacity }}
        >
          {photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo.src} alt="" className={`block h-auto ${slot.size}`} />
          ) : set === "watercolor" ? (
            <FloralWatercolor id={`${id}-${index}`} className={`block h-auto ${slot.size}`} />
          ) : set === "botanical" ? (
            <FloralCluster id={`${id}-${index}`} className={`block h-auto ${slot.size}`} />
          ) : (
            <svg
              viewBox="0 0 220 300"
              role="presentation"
              aria-hidden="true"
              focusable="false"
              className={`block h-auto ${slot.size}`}
            >
              {motif(set, `${id}-${index}`)}
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
