import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://wedding-ro.vercel.app").replace(/\/+$/, "");

/** One public URL: the presentation page. Everything else is shared by link. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE}/`,
      lastModified: new Date("2026-11-13"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
