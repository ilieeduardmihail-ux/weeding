/**
 * A watercolour corner for the landing page: blush peonies, mauve calla lilies,
 * eucalyptus and olive foliage, cream five-petal blossoms, berry sprays and
 * pearl strands. Drawn as SVG so it stays crisp and weighs almost nothing, but
 * painted with layered translucent gradients and a turbulence filter so the
 * edges bleed the way real watercolour does. The colours are fixed (it is a
 * little painting), and it sits in the corners, never behind the text.
 */

type ClusterProps = { className?: string; id: string };

function ring(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => offset + (360 / count) * i);
}

/** One ruffled peony/rose head, built from concentric rings of broad petals. */
function Peony({
  x,
  y,
  scale,
  rotate = 0,
  petal,
  core,
}: {
  x: number;
  y: number;
  scale: number;
  rotate?: number;
  petal: string;
  core: string;
}) {
  const d =
    "M0 0 C-15 -9 -25 -32 -13 -49 C-2 -64 20 -62 30 -47 C41 -30 30 -8 9 0 Z";
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {ring(9).map((a) => (
        <path key={`o${a}`} d={d} transform={`rotate(${a})`} fill={petal} fillOpacity="0.92" />
      ))}
      {ring(7, 22).map((a) => (
        <path key={`m${a}`} d={d} transform={`rotate(${a}) scale(0.66)`} fill={petal} fillOpacity="0.95" />
      ))}
      {ring(5, 40).map((a) => (
        <path key={`i${a}`} d={d} transform={`rotate(${a}) scale(0.4)`} fill={core} />
      ))}
      <circle r="7" fill={core} opacity="0.9" />
      <circle r="2.6" cx="-1.5" cy="-2" fill="#ffffff" opacity="0.55" />
    </g>
  );
}

/** Mauve calla lily: a curled spathe around a golden spadix. */
function Calla({ x, y, scale, rotate, fill, sheen }: { x: number; y: number; scale: number; rotate: number; fill: string; sheen: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0 C-22 -26 -30 -64 -17 -96 C-5 -126 22 -146 44 -140 C57 -136 60 -123 51 -114 C32 -98 23 -70 25 -44 C26 -22 16 -6 0 0 Z"
        fill={fill}
      />
      <path
        d="M9 -14 C16 -42 30 -70 49 -88 C58 -96 58 -107 50 -110 C41 -97 32 -82 25 -64 C17 -44 13 -26 9 -14 Z"
        fill={sheen}
        opacity="0.5"
      />
      <path d="M8 -9 C6 -33 13 -59 25 -79" fill="none" stroke="#e6c98f" strokeWidth="5.5" strokeLinecap="round" opacity="0.95" />
      <path d="M-6 -7 C-17 -30 -20 -60 -11 -86" fill="none" stroke="#6f5270" strokeWidth="2" strokeLinecap="round" opacity="0.28" />
    </g>
  );
}

/** Cream five-petal blossom with a small golden eye. */
function Blossom({ x, y, scale, rotate }: { x: number; y: number; scale: number; rotate: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {ring(5).map((a) => (
        <path
          key={a}
          transform={`rotate(${a})`}
          d="M0 -3 C-8 -11 -8 -22 0 -27 C8 -22 8 -11 0 -3 Z"
          fill="#fdf7ec"
          stroke="#ecdfc8"
          strokeWidth="0.9"
        />
      ))}
      <circle r="3.6" fill="#e3c069" />
      <circle r="1.4" cx="-0.8" cy="-0.9" fill="#ffffff" opacity="0.7" />
    </g>
  );
}

function Leaf({ x, y, rotate, scale = 1, fill, long = false }: { x: number; y: number; rotate: number; scale?: number; fill: string; long?: boolean }) {
  const d = long
    ? "M0 0 C16 -24 50 -26 70 0 C50 26 16 24 0 0 Z"
    : "M0 0 C11 -12 32 -14 46 0 C32 14 11 12 0 0 Z";
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d={d} fill={fill} />
      <path d="M3 0 H58" stroke="#3f4b30" strokeOpacity="0.22" strokeWidth="1" />
      <path d="M6 0 L16 -6 M14 0 L24 -6 M22 0 L32 -6 M30 0 L40 -6" stroke="#3f4b30" strokeOpacity="0.14" strokeWidth="0.8" />
    </g>
  );
}

function Berries({ x, y, scale, fill, rotate = 0 }: { x: number; y: number; scale: number; fill: string; rotate?: number }) {
  const spots = [
    [0, 0, 8],
    [15, -8, 6.5],
    [29, -17, 8],
    [43, -25, 6.5],
    [56, -35, 5.5],
  ] as const;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M-4 4 C20 -6 40 -20 60 -40" fill="none" stroke="#7c8b5e" strokeWidth="1.6" opacity="0.7" />
      {spots.map(([cx, cy, r]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r} fill={fill} />
          <circle cx={cx - r * 0.32} cy={cy - r * 0.32} r={r * 0.34} fill="#f6eef2" opacity="0.75" />
        </g>
      ))}
    </g>
  );
}

/** A strand of small pearls, following a soft curve. */
function Pearls({ x, y, rotate, scale = 1 }: { x: number; y: number; rotate: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0 0 C26 -8 54 -30 74 -60" fill="none" stroke="#d8c8a8" strokeWidth="1.1" opacity="0.6" />
      {Array.from({ length: 8 }, (_, i) => {
        const t = i / 7;
        const cx = 74 * t + 6 * Math.sin(t * 3);
        const cy = -60 * t + 4 * Math.cos(t * 3);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={3.1} fill="#f6efdd" />
            <circle cx={cx - 1} cy={cy - 1} r={1} fill="#ffffff" opacity="0.9" />
          </g>
        );
      })}
    </g>
  );
}

export function FloralWatercolor({ className = "", id }: ClusterProps) {
  const g = (name: string) => `${id}-${name}`;
  const leaf = `url(#${g("leaf")})`;
  const leafLight = `url(#${g("leafLight")})`;
  const olive = `url(#${g("olive")})`;
  const calla = `url(#${g("calla")})`;
  const peony = `url(#${g("peony")})`;
  const rose = `url(#${g("rose")})`;
  const berry = `url(#${g("berry")})`;

  return (
    <svg viewBox="0 0 300 380" role="presentation" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <filter id={g("wc")} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.018" numOctaves="3" seed="9" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <radialGradient id={g("peony")} cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fdeef1" />
          <stop offset="55%" stopColor="#f3c6d0" />
          <stop offset="100%" stopColor="#dd9dae" />
        </radialGradient>
        <radialGradient id={g("rose")} cx="42%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#fdf1ea" />
          <stop offset="58%" stopColor="#efd0c9" />
          <stop offset="100%" stopColor="#d9a3a8" />
        </radialGradient>
        <linearGradient id={g("calla")} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#8f6b8c" />
          <stop offset="50%" stopColor="#ac83a6" />
          <stop offset="100%" stopColor="#d3b6d0" />
        </linearGradient>
        <linearGradient id={g("leaf")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9fb083" />
          <stop offset="55%" stopColor="#74855a" />
          <stop offset="100%" stopColor="#57663d" />
        </linearGradient>
        <linearGradient id={g("leafLight")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bcc79c" />
          <stop offset="100%" stopColor="#8b9a6b" />
        </linearGradient>
        <linearGradient id={g("olive")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7d8b55" />
          <stop offset="100%" stopColor="#4e5c34" />
        </linearGradient>
        <radialGradient id={g("berry")} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#c7a9c9" />
          <stop offset="60%" stopColor="#a07fa6" />
          <stop offset="100%" stopColor="#7f6288" />
        </radialGradient>
      </defs>

      {/* Painterly layer: turbulence roughens the edges so it reads as brushwork. */}
      <g filter={`url(#${g("wc")})`}>
        {/* stems */}
        <g fill="none" stroke="#4f5d37" strokeWidth="2.6" strokeLinecap="round" opacity="0.9">
          <path d="M44 380 C62 312 96 250 150 188" />
          <path d="M22 380 C32 306 48 246 62 180" />
          <path d="M60 380 C92 336 142 314 208 280" />
          <path d="M34 380 C76 356 116 346 166 336" />
          <path d="M108 356 C134 314 164 278 196 248" strokeWidth="2" />
        </g>

        {/* eucalyptus sprays */}
        <g>
          <Leaf x={70} y={322} rotate={-18} scale={0.9} fill={leafLight} />
          <Leaf x={92} y={296} rotate={-50} scale={0.85} fill={leaf} />
          <Leaf x={104} y={266} rotate={-12} scale={0.9} fill={leafLight} />
          <Leaf x={118} y={240} rotate={-54} scale={0.82} fill={leaf} />
          <Leaf x={130} y={212} rotate={-16} scale={0.88} fill={leafLight} />
          <Leaf x={144} y={188} rotate={-58} scale={0.78} fill={leaf} />
          <Leaf x={22} y={344} rotate={168} scale={0.86} fill={leaf} />
          <Leaf x={18} y={314} rotate={206} scale={0.82} fill={leafLight} />
          <Leaf x={24} y={284} rotate={172} scale={0.86} fill={leaf} />
          <Leaf x={30} y={252} rotate={208} scale={0.8} fill={leafLight} />
          <Leaf x={42} y={222} rotate={176} scale={0.82} fill={leaf} />
          <Leaf x={100} y={342} rotate={8} scale={0.9} fill={leafLight} />
          <Leaf x={128} y={330} rotate={20} scale={0.86} fill={leaf} />
          <Leaf x={158} y={318} rotate={6} scale={0.9} fill={leafLight} />
          <Leaf x={186} y={304} rotate={22} scale={0.82} fill={leaf} />
        </g>

        {/* large olive leaves for depth */}
        <g>
          <Leaf x={4} y={372} rotate={-6} scale={1.2} fill={olive} long />
          <Leaf x={110} y={372} rotate={-40} scale={1.05} fill={leaf} long />
          <Leaf x={192} y={344} rotate={24} scale={0.95} fill={olive} long />
          <Leaf x={48} y={266} rotate={58} scale={0.82} fill={leafLight} long />
        </g>

        {/* calla lilies */}
        <Calla x={132} y={272} scale={0.9} rotate={10} fill={calla} sheen="#e9d7e7" />
        <Calla x={36} y={240} scale={0.62} rotate={-20} fill={calla} sheen="#e9d7e7" />

        {/* peonies and roses */}
        <Peony x={62} y={294} scale={1.06} rotate={6} petal={peony} core="#e7aebd" />
        <Peony x={160} y={330} scale={0.62} rotate={-14} petal={rose} core="#dba0a6" />
        <Peony x={226} y={292} scale={0.5} rotate={22} petal={peony} core="#e7aebd" />

        {/* small blossoms */}
        <Blossom x={118} y={222} scale={0.98} rotate={12} />
        <Blossom x={190} y={268} scale={0.8} rotate={-16} />
        <Blossom x={72} y={186} scale={0.72} rotate={30} />
        <Blossom x={156} y={152} scale={0.76} rotate={-8} />
        <Blossom x={100} y={252} scale={0.6} rotate={18} />
        <Blossom x={244} y={332} scale={0.62} rotate={4} />

        {/* berries and pearls */}
        <Berries x={168} y={272} scale={0.95} fill={berry} rotate={-36} />
        <Berries x={112} y={172} scale={0.72} fill={berry} rotate={-64} />
        <Pearls x={206} y={352} rotate={-12} scale={1.05} />
        <Pearls x={40} y={356} rotate={8} scale={0.85} />

        {/* buds */}
        <g fill={calla}>
          <ellipse cx="96" cy="160" rx="7" ry="12" transform="rotate(-24 96 160)" />
          <ellipse cx="89" cy="146" rx="5" ry="8.5" transform="rotate(-18 89 146)" fill="#e7c9e4" />
          <ellipse cx="232" cy="300" rx="6" ry="10" transform="rotate(28 232 300)" />
        </g>
      </g>
    </svg>
  );
}
