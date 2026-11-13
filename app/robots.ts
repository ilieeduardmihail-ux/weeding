import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://wedding-ro.vercel.app").replace(/\/+$/, "");

/**
 * Only the presentation page is public. Weddings are shared by link and the
 * panels are private, so they are disallowed, not listed: a crawler that finds
 * a wedding URL should not follow it into the site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/$", disallow: "/" }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
