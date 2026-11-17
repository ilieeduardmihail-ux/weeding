import type { ReactNode } from "react";

/**
 * Every owner page sits inside `.platform`. The paper and the dark palette are
 * scoped to this wrapper in `globals.css`, so the theme switch used by the site
 * can repaint the panel without touching the public invitations or the client
 * admin, which set their own colours from the stored wedding theme.
 */
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <div className="platform min-h-svh">{children}</div>;
}
