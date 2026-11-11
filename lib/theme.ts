/**
 * The look of a wedding site: a colour palette (with a few per-client tweaks)
 * and one of several decorative sets drawn behind the landing. Stored in the
 * `tenants.theme` jsonb column, so every client can differ without a new deploy.
 *
 * Kept free of server-only imports: the public site and the admin editor both
 * use it, in the browser and on the server.
 */

export type FloralIntensity = "subtle" | "medium" | "rich";
export type FloralPlacement = "corners" | "top" | "bottom" | "frame";

export type ThemeColors = {
  /** Page base colour. */
  background?: string;
  /** Body text colour. */
  text?: string;
  /** Gold foil: links, dividers, the ampersand. */
  accent?: string;
};

export type Theme = {
  palette: string;
  colors: ThemeColors;
  floral: {
    enabled: boolean;
    set: string;
    intensity: FloralIntensity;
    placement: FloralPlacement;
  };
};

/* ------------------------------------------------------------------ palettes */

export type Palette = {
  id: string;
  name: string;
  swatch: string;
  bg: string;
  paper: string;
  mist: string;
  text: string;
  accent: string;
  sage: string;
  rose: string;
};

export const PALETTES: Palette[] = [
  {
    id: "ivory",
    name: "Ivory & măsliniu",
    swatch: "#a9853f",
    bg: "#f4ecdd",
    paper: "#fbf6ec",
    mist: "#e9dcc5",
    text: "#2c3325",
    accent: "#a9853f",
    sage: "#6b7a4e",
    rose: "#b07984",
  },
  {
    id: "champagne",
    name: "Șampanie",
    swatch: "#c2a24a",
    bg: "#f6efe0",
    paper: "#fdf8ee",
    mist: "#ece0c9",
    text: "#3b3320",
    accent: "#c2a24a",
    sage: "#7c7a4a",
    rose: "#c39a86",
  },
  {
    id: "blush",
    name: "Roz prăfuit",
    swatch: "#b07984",
    bg: "#f7ecec",
    paper: "#fdf5f5",
    mist: "#ecdadc",
    text: "#3a2b2f",
    accent: "#b07984",
    sage: "#6f7a5a",
    rose: "#c98d97",
  },
  {
    id: "sage",
    name: "Salvie",
    swatch: "#7d8a52",
    bg: "#eef0e4",
    paper: "#f7f9f0",
    mist: "#e0e4cf",
    text: "#2f3a28",
    accent: "#7d8a52",
    sage: "#5f6b3d",
    rose: "#b58c86",
  },
  {
    id: "sky",
    name: "Cer senin",
    swatch: "#7d97a8",
    bg: "#eef2f5",
    paper: "#f7fafc",
    mist: "#dde6ec",
    text: "#26333b",
    accent: "#7d97a8",
    sage: "#6f8676",
    rose: "#b08494",
  },
  {
    id: "terracotta",
    name: "Teracotă",
    swatch: "#b5623c",
    bg: "#f7ede6",
    paper: "#fdf6f1",
    mist: "#eedbcf",
    text: "#3d2a22",
    accent: "#b5623c",
    sage: "#7a7248",
    rose: "#c07f6c",
  },
  {
    id: "forest",
    name: "Pădure",
    swatch: "#5f7350",
    bg: "#eef1ea",
    paper: "#f7faf3",
    mist: "#dfe5d6",
    text: "#22301f",
    accent: "#5f7350",
    sage: "#4d5f3f",
    rose: "#a98a84",
  },
];

export function paletteById(id: string) {
  return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
}

/* -------------------------------------------------------------- floral sets */

export const FLORAL_SETS = [
  { id: "botanical", name: "Botanic clasic" },
  { id: "eucalyptus", name: "Eucalipt" },
  { id: "roses", name: "Trandafiri" },
  { id: "blossoms", name: "Flori de cireș" },
  { id: "laurel", name: "Laurel" },
  { id: "vine", name: "Iederă" },
  { id: "hearts", name: "Inimi" },
  { id: "sparkles", name: "Scânteieri" },
  { id: "confetti", name: "Confetti" },
  { id: "wildflowers", name: "Flori de câmp" },
  { id: "arch", name: "Arc floral" },
] as const;

export const FLORAL_INTENSITIES: { id: FloralIntensity; name: string }[] = [
  { id: "subtle", name: "Discret" },
  { id: "medium", name: "Echilibrat" },
  { id: "rich", name: "Bogat" },
];

export const FLORAL_PLACEMENTS: { id: FloralPlacement; name: string }[] = [
  { id: "corners", name: "Colțuri" },
  { id: "top", name: "Sus" },
  { id: "bottom", name: "Jos" },
  { id: "frame", name: "Cadru" },
];

export const DEFAULT_THEME: Theme = {
  palette: "ivory",
  colors: {},
  floral: { enabled: true, set: "botanical", intensity: "medium", placement: "corners" },
};

/* ------------------------------------------------------------------ helpers */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value.trim());
}

function expand(hex: string) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

/** Lightens (percent > 0) or darkens (percent < 0) a hex colour. */
export function shade(hex: string, percent: number) {
  if (!isHexColor(hex)) return hex;
  const amount = Math.round((percent / 100) * 255);
  const [r, g, b] = expand(hex).map((channel) =>
    Math.min(255, Math.max(0, channel + amount))
  );
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function text(value: unknown, fallback: string) {
  return isHexColor(value) ? value.trim() : fallback;
}

export function normalizeTheme(raw: unknown): Theme {
  const source = (raw ?? {}) as Record<string, unknown>;
  const colors = (source.colors ?? {}) as Record<string, unknown>;
  const floral = (source.floral ?? {}) as Record<string, unknown>;

  const palette = PALETTES.some((p) => p.id === source.palette)
    ? String(source.palette)
    : DEFAULT_THEME.palette;

  const set = FLORAL_SETS.some((s) => s.id === floral.set)
    ? String(floral.set)
    : DEFAULT_THEME.floral.set;
  const intensity = FLORAL_INTENSITIES.some((i) => i.id === floral.intensity)
    ? (floral.intensity as FloralIntensity)
    : DEFAULT_THEME.floral.intensity;
  const placement = FLORAL_PLACEMENTS.some((p) => p.id === floral.placement)
    ? (floral.placement as FloralPlacement)
    : DEFAULT_THEME.floral.placement;

  return {
    palette,
    colors: {
      background: isHexColor(colors.background) ? colors.background.trim() : undefined,
      text: isHexColor(colors.text) ? colors.text.trim() : undefined,
      accent: isHexColor(colors.accent) ? colors.accent.trim() : undefined,
    },
    floral: {
      enabled: typeof floral.enabled === "boolean" ? floral.enabled : DEFAULT_THEME.floral.enabled,
      set,
      intensity,
      placement,
    },
  };
}

export type ResolvedTheme = {
  /** CSS custom properties ready to set on the site wrapper. */
  cssVars: Record<string, string>;
  floral: Theme["floral"];
  palette: Palette;
};

/**
 * Turns the stored theme into the concrete colours the page paints with. Any
 * palette colour can be overridden, and the derived surface tones follow the
 * chosen background so a custom colour never looks uneven.
 */
export function resolveTheme(raw: unknown): ResolvedTheme {
  const theme = normalizeTheme(raw);
  const palette = paletteById(theme.palette);

  const sea = text(theme.colors.background, palette.bg);
  const ink = text(theme.colors.text, palette.text);
  const gold = text(theme.colors.accent, palette.accent);

  // If the background moved, tilt the surfaces the same way instead of keeping
  // the palette's fixed light tones.
  const follows = sea !== palette.bg;
  const mist = follows ? shade(sea, -7) : palette.mist;
  const paper = follows ? shade(sea, 6) : palette.paper;

  return {
    palette,
    floral: theme.floral,
    cssVars: {
      "--color-sea": sea,
      "--color-mist": mist,
      "--color-paper": paper,
      "--color-ink": ink,
      "--color-gold": gold,
      "--color-sage": palette.sage,
      "--color-rose": palette.rose,
    },
  };
}
