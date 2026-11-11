import type { CSSProperties, ReactNode } from "react";
import { resolveTheme } from "@/lib/theme";

/**
 * Paints one wedding's colours. The stored theme is turned into CSS custom
 * properties on this wrapper, so every `bg-sea` / `text-ink` / `text-gold`
 * utility inside follows the palette. The `.theme-canvas` class reads the same
 * variables for the paper background (see app/globals.css).
 */
export function ThemeRoot({ theme, children }: { theme: unknown; children: ReactNode }) {
  const { cssVars } = resolveTheme(theme);
  return (
    <div className="theme-canvas min-h-svh" style={cssVars as CSSProperties}>
      {children}
    </div>
  );
}
