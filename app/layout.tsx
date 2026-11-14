import type { Metadata, Viewport } from "next";
import { Fraunces, Figtree } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Romanian ș and ț live in Latin Extended-A, i.e. in the `latin-ext` file, which
// the browser has to download anyway. Naming that subset here makes Next preload
// it together with the latin one instead of discovering it after the CSS, so the
// headings and body text render with their real letterforms on the first paint.
const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces" });
const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree" });

// The home page overrides this with the names/date from /admin/settings.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://wedding-ro.vercel.app"),
  title: "Nunta noastră",
  description: "Site-ul nunții noastre",
  // Nothing here is meant to be found: every wedding is private and the admin
  // panels are private by definition. Setting it once on the root layout means a
  // new page cannot forget it; the pages that care also declare it themselves.
  robots: { index: false, follow: false },
};

// The browser chrome follows the theme too; both colours come from globals.css.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4ecdd" },
    { media: "(prefers-color-scheme: dark)", color: "#15170f" },
  ],
};

/**
 * Runs before the page paints, so a visitor who chose dark never sees the light
 * theme flash. It only writes a data attribute; the CSS decides what it means
 * and only the marketing pages (`.marketing`) react to it.
 */
const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem("theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=(m==="dark"||(m!=="light"&&d))?"dark":"light";}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" data-scroll-behavior="smooth" className={`${fraunces.variable} ${figtree.variable}`}>
      <body className="bg-sea font-sans text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
