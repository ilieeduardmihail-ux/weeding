import type { CSSProperties, ReactNode } from "react";
import { Particles } from "@/components/particles";
import { resolveTheme } from "@/lib/theme";

/**
 * Paints one wedding's colours. The stored theme is turned into CSS custom
 * properties on this wrapper, so every `bg-sea` / `text-ink` / `text-gold`
 * utility inside follows the palette.
 *
 * The paper itself is drawn on a fixed layer at -z-20, below the particle
 * canvas (which sits at -z-10). That ordering is what lets the slow drifting
 * dust show through the background again. The canvas lives here, on the public
 * wedding site only, so the admin and platform panels never run it.
 */
export function ThemeRoot({ theme, children }: { theme: unknown; children: ReactNode }) {
  const { cssVars } = resolveTheme(theme);
  return (
    <div className="relative min-h-svh" style={cssVars as CSSProperties}>
      <div aria-hidden className="theme-paper pointer-events-none fixed inset-0 -z-20" />
      <Particles />
      {children}
    </div>
  );
}
