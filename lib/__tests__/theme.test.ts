import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  FLORAL_SETS,
  PALETTES,
  isHexColor,
  normalizeTheme,
  paletteById,
  resolveTheme,
  shade,
} from "../theme";

describe("theme model", () => {
  it("falls back to the default look for empty or unknown input", () => {
    expect(normalizeTheme(undefined)).toEqual(DEFAULT_THEME);
    expect(normalizeTheme({ palette: "nope", colors: {}, floral: {} })).toEqual(DEFAULT_THEME);
    expect(
      normalizeTheme({ palette: "forest", floral: { set: "ghost", intensity: "x", placement: "y" } })
    ).toMatchObject({ palette: "forest", floral: DEFAULT_THEME.floral });
  });

  it("keeps only valid hex colour overrides", () => {
    const theme = normalizeTheme({
      palette: "sage",
      colors: { background: "#ABC", text: "not-a-colour", accent: "#112233" },
    });
    expect(theme.colors).toEqual({ background: "#ABC", text: undefined, accent: "#112233" });
  });

  it("resolves the palette and reflects background overrides on the surfaces", () => {
    const shown = resolveTheme({ palette: "blush" });
    expect(shown.palette.id).toBe("blush");
    expect(shown.cssVars["--color-sea"]).toBe(paletteById("blush").bg);
    expect(shown.cssVars["--color-ink"]).toBe(paletteById("blush").text);

    const custom = resolveTheme({ palette: "blush", colors: { background: "#101820" } });
    expect(custom.cssVars["--color-sea"]).toBe("#101820");
    // The raised/alternate surfaces tilt with the base instead of staying light.
    expect(custom.cssVars["--color-paper"]).toBe(shade("#101820", 6));
    expect(custom.cssVars["--color-mist"]).toBe(shade("#101820", -7));
  });

  it("offers the promised variety: palettes and at least ten floral sets", () => {
    expect(PALETTES.length).toBeGreaterThanOrEqual(6);
    expect(FLORAL_SETS.length).toBeGreaterThanOrEqual(10);
  });

  it("validates and shades hex colours safely", () => {
    expect(isHexColor("#fff")).toBe(true);
    expect(isHexColor("#a9853f")).toBe(true);
    expect(isHexColor("gold")).toBe(false);
    expect(shade("#000000", 100)).toBe("#ffffff");
    expect(shade("#ffffff", -100)).toBe("#000000");
    expect(shade("nope", 10)).toBe("nope");
  });
});
