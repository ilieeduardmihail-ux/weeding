import type { MetadataRoute } from "next";

/**
 * No page on this site is public in the search-engine sense: a wedding is shared
 * by link on WhatsApp, and everything else is an admin panel. The meta tags say
 * `noindex` (see app/layout.tsx); this file asks crawlers not to even try.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
