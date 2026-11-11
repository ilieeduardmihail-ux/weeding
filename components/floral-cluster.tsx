/**
 * Botanical corner inspired by the printed invitation: dusty-rose calla lilies,
 * cream garden roses, small white blossoms, pink berries and olive eucalyptus.
 * Drawn as SVG so it stays crisp, weighs almost nothing and needs no image
 * request. Used only in two corners of the landing, never behind the text.
 */

type ClusterProps = { className?: string; id: string };

const OUTER_PETALS = [0, 72, 144, 216, 288];
const INNER_PETALS = [36, 108, 180, 252, 324];

function Rose({
  x,
  y,
  scale,
  fill,
  center,
  stroke,
}: {
  x: number;
  y: number;
  scale: number;
  fill: string;
  center: string;
  stroke: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {OUTER_PETALS.map((angle) => (
        <path
          key={`o${angle}`}
          transform={`rotate(${angle})`}
          d="M0 6 C-11 -12 -1 -39 20 -41 C40 -43 49 -19 35 -2 C25 9 9 12 0 6 Z"
          fill={fill}
          stroke={stroke}
          strokeOpacity="0.28"
          strokeWidth="1"
        />
      ))}
      {INNER_PETALS.map((angle) => (
        <path
          key={`i${angle}`}
          transform={`rotate(${angle}) scale(0.62)`}
          d="M0 6 C-11 -12 -1 -39 20 -41 C40 -43 49 -19 35 -2 C25 9 9 12 0 6 Z"
          fill={fill}
          stroke={stroke}
          strokeOpacity="0.22"
          strokeWidth="1"
        />
      ))}
      <circle r="10.5" fill={center} opacity="0.85" />
      <path
        d="M-7 -4 C-10 3 -4 10 3 8 C10 6 11 -2 5 -5"
        fill="none"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M5 -5 C10 -7 12 -1 8 3"
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.65"
      />
    </g>
  );
}

function Calla({
  x,
  y,
  scale,
  rotate,
  fill,
}: {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  fill: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0 C-19 -25 -25 -60 -14 -90 C-4 -118 20 -136 40 -131 C52 -128 55 -117 47 -109 C30 -94 21 -69 23 -45 C24 -25 15 -8 0 0 Z"
        fill={fill}
      />
      <path
        d="M10 -12 C16 -38 28 -64 45 -80 C53 -87 53 -97 46 -100 C38 -89 30 -76 24 -61 C17 -44 14 -26 10 -12 Z"
        fill="#f7dee1"
        opacity="0.45"
      />
      <path
        d="M7 -8 C5 -30 11 -54 22 -72"
        fill="none"
        stroke="#e2c48c"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M-6 -6 C-16 -28 -18 -56 -10 -80"
        fill="none"
        stroke="#8e5561"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
    </g>
  );
}

function Blossom({
  x,
  y,
  scale,
  rotate,
}: {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {OUTER_PETALS.map((angle) => (
        <path
          key={angle}
          transform={`rotate(${angle})`}
          d="M0 -2 C-7 -9 -7 -18 0 -22 C7 -18 7 -9 0 -2 Z"
          fill="#fbf6ec"
          stroke="#e7d9c3"
          strokeWidth="0.8"
        />
      ))}
      <circle r="3.4" fill="#d9b46a" />
    </g>
  );
}

function Leaf({
  x,
  y,
  rotate,
  scale = 1,
  fill,
  long = false,
}: {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  fill: string;
  long?: boolean;
}) {
  const d = long
    ? "M0 0 C14 -22 46 -24 64 0 C46 24 14 22 0 0 Z"
    : "M0 0 C10 -10 28 -12 40 0 C28 12 10 10 0 0 Z";
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d={d} fill={fill} />
      <path d="M3 0 H54" stroke="#3f4b30" strokeOpacity="0.25" strokeWidth="1" />
    </g>
  );
}

function Berries({
  x,
  y,
  scale,
  fill,
  rotate = 0,
}: {
  x: number;
  y: number;
  scale: number;
  fill: string;
  rotate?: number;
}) {
  const spots = [
    [0, 0, 7],
    [13, -7, 6],
    [26, -15, 7.5],
    [39, -22, 6],
    [50, -31, 5],
  ] as const;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {spots.map(([cx, cy, r]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r} fill={fill} />
          <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.3} fill="#fbeeef" opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

export function FloralCluster({ className = "", id }: ClusterProps) {
  const g = (name: string) => `${id}-${name}`;
  const leaf = `url(#${g("leaf")})`;
  const leafLight = `url(#${g("leafLight")})`;
  const calla = `url(#${g("calla")})`;
  const rose = `url(#${g("rose")})`;
  const roseBlush = `url(#${g("roseBlush")})`;
  const berry = `url(#${g("berry")})`;

  return (
    <svg
      viewBox="0 0 260 350"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <radialGradient id={g("rose")} cx="35%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#fdf5e9" />
          <stop offset="52%" stopColor="#f0d8cb" />
          <stop offset="100%" stopColor="#d6a5a9" />
        </radialGradient>
        <radialGradient id={g("roseBlush")} cx="35%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#fae7e4" />
          <stop offset="55%" stopColor="#e8bfc2" />
          <stop offset="100%" stopColor="#c58d98" />
        </radialGradient>
        <linearGradient id={g("calla")} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#a86e7c" />
          <stop offset="48%" stopColor="#c08693" />
          <stop offset="100%" stopColor="#e7c2c8" />
        </linearGradient>
        <linearGradient id={g("leaf")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b9b6b" />
          <stop offset="55%" stopColor="#6b7a4e" />
          <stop offset="100%" stopColor="#4f5d37" />
        </linearGradient>
        <linearGradient id={g("leafLight")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a9b58a" />
          <stop offset="100%" stopColor="#7c8b5e" />
        </linearGradient>
        <radialGradient id={g("berry")} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f3d6da" />
          <stop offset="60%" stopColor="#d9a3ac" />
          <stop offset="100%" stopColor="#bd7f8c" />
        </radialGradient>
      </defs>

      {/* stems */}
      <g fill="none" stroke="#4f5d37" strokeWidth="2.6" strokeLinecap="round" opacity="0.92">
        <path d="M38 350 C56 292 86 238 132 180" />
        <path d="M20 350 C30 284 44 228 56 168" />
        <path d="M52 350 C82 310 128 292 188 262" />
        <path d="M32 350 C72 330 106 322 152 314" />
        <path d="M96 330 C120 292 148 258 176 232" strokeWidth="2" />
      </g>

      {/* eucalyptus sprays */}
      <g>
        <Leaf x={62} y={300} rotate={-18} scale={0.9} fill={leafLight} />
        <Leaf x={82} y={276} rotate={-48} scale={0.85} fill={leaf} />
        <Leaf x={92} y={248} rotate={-12} scale={0.9} fill={leafLight} />
        <Leaf x={104} y={224} rotate={-52} scale={0.82} fill={leaf} />
        <Leaf x={114} y={198} rotate={-16} scale={0.88} fill={leafLight} />
        <Leaf x={126} y={176} rotate={-56} scale={0.8} fill={leaf} />
        <Leaf x={20} y={318} rotate={168} scale={0.86} fill={leaf} />
        <Leaf x={16} y={290} rotate={205} scale={0.82} fill={leafLight} />
        <Leaf x={22} y={262} rotate={172} scale={0.86} fill={leaf} />
        <Leaf x={28} y={234} rotate={208} scale={0.8} fill={leafLight} />
        <Leaf x={38} y={206} rotate={176} scale={0.82} fill={leaf} />
        <Leaf x={88} y={318} rotate={8} scale={0.9} fill={leafLight} />
        <Leaf x={112} y={309} rotate={20} scale={0.86} fill={leaf} />
        <Leaf x={138} y={300} rotate={6} scale={0.9} fill={leafLight} />
        <Leaf x={163} y={288} rotate={22} scale={0.84} fill={leaf} />
        <Leaf x={186} y={274} rotate={4} scale={0.8} fill={leafLight} />
      </g>

      {/* larger olive leaves for depth */}
      <g>
        <Leaf x={6} y={342} rotate={-8} scale={1.15} fill={leaf} long />
        <Leaf x={98} y={344} rotate={-40} scale={1} fill={leafLight} long />
        <Leaf x={168} y={318} rotate={24} scale={0.9} fill={leaf} long />
        <Leaf x={44} y={252} rotate={58} scale={0.8} fill={leafLight} long />
      </g>

      {/* flowers */}
      <Calla x={118} y={252} scale={0.88} rotate={9} fill={calla} />
      <Calla x={34} y={224} scale={0.6} rotate={-19} fill={calla} />

      <Rose x={58} y={272} scale={1.02} fill={rose} center="#e6c3bd" stroke="#c08d92" />
      <Rose x={140} y={306} scale={0.62} fill={rose} center="#e6c3bd" stroke="#c08d92" />
      <Rose x={200} y={272} scale={0.46} fill={roseBlush} center="#d9a6ae" stroke="#b8797f" />

      <Blossom x={106} y={206} scale={0.95} rotate={12} />
      <Blossom x={170} y={250} scale={0.78} rotate={-16} />
      <Blossom x={64} y={172} scale={0.7} rotate={30} />
      <Blossom x={140} y={142} scale={0.74} rotate={-8} />
      <Blossom x={92} y={232} scale={0.58} rotate={18} />
      <Blossom x={216} y={308} scale={0.6} rotate={4} />

      <Berries x={150} y={252} scale={0.95} fill={berry} rotate={-34} />
      <Berries x={102} y={158} scale={0.7} fill={berry} rotate={-62} />

      {/* buds */}
      <g fill={calla}>
        <ellipse cx="88" cy="152" rx="6.5" ry="11" transform="rotate(-24 88 152)" />
        <ellipse cx="82" cy="140" rx="4.5" ry="8" transform="rotate(-18 82 140)" fill={roseBlush} />
        <ellipse cx="206" cy="278" rx="5.5" ry="9.5" transform="rotate(28 206 278)" />
      </g>
    </svg>
  );
}
