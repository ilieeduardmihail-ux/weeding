import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

// The home page overrides this with the names/date from /admin/settings.
export const metadata: Metadata = {
  title: "Our wedding",
  description: "Wedding website",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${figtree.variable}`}>
      <body className="bg-sea font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
