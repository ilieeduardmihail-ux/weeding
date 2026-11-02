import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

// The home page overrides this with the names/date from /admin/settings.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://weeding.vercel.app"),
  title: "Nunta noastră",
  description: "Site-ul nunții noastre",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${fraunces.variable} ${figtree.variable}`}>
      <body className="bg-sea font-sans text-ink antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
