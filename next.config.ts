import type { NextConfig } from "next";
import { DEFAULT_TENANT_SLUG } from "./lib/default-tenant";

/**
 * Content-Security-Policy, sent in report-only mode for now: the browser reports
 * violations without blocking, so we can watch for anything we missed (Next
 * injects inline bootstrap scripts, Supabase Realtime opens a websocket, Vercel
 * Analytics and Google Maps embeds have their own hosts) before enforcing it.
 */
const isDev = process.env.NODE_ENV === "development";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "media-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // `unsafe-eval` is only needed by the dev server's refresh runtime; production
  // ships without it, so an injected string cannot be turned into code.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "script-src-attr 'none'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com",
  "frame-src https://www.google.com",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy-Report-Only", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // No page needs the camera, the microphone or precise location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/**
 * Belt and braces for the meta tags: every page except the presentation page is
 * private (weddings are shared by link, panels are panels), and this header also
 * covers responses that cannot carry a `<meta>` — calendar feeds, invitation
 * images, exports. The presentation page is excluded below.
 */
const NO_ROBOTS = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" };

/**
 * Files in `public/` are served with `max-age=0, must-revalidate` by default, so
 * every visit costs a conditional request per decoration. These names are part of
 * the asset (the width is baked into them), so they can be cached for a while.
 */
const FLORAL_CACHE = [
  {
    key: "Cache-Control",
    value: "public, max-age=2592000, stale-while-revalidate=86400",
  },
];

/** Screenshots change when the product changes, so they get a shorter TTL. */
const PREVIEW_CACHE = [
  {
    key: "Cache-Control",
    value: "public, max-age=3600, stale-while-revalidate=86400",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  /**
   * The invoice fonts are read from disk at runtime (`lib/invoice-pdf.ts`), so
   * the tracer has to be told about them: without this the serverless bundle
   * ships without `assets/fonts` and every PDF fails in production. Only the
   * two routes that build a note need them.
   */
  outputFileTracingIncludes: {
    "/platform/facturi/[id]": ["./assets/fonts/**"],
    "/platform/facturi/[id]/pdf": ["./assets/fonts/**"],
  },
  experimental: {
    // Prefetched admin sections stay usable in the client router for a while,
    // so going back to a section never starts a fresh server request.
    staleTimes: {
      dynamic: 30,
      static: 60,
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      // The short links printed on the old invitation and sent on WhatsApp.
      { source: "/calendar", destination: `/${DEFAULT_TENANT_SLUG}/calendar`, permanent: true },
      { source: "/invitatia-poza", destination: `/${DEFAULT_TENANT_SLUG}/invitatia-poza`, permanent: true },
    ];
  },
  async headers() {
    return [
      // The presentation page is the one page meant to be found.
      { source: "/", headers: SECURITY_HEADERS },
      // Everything else, including every wedding and every panel.
      { source: "/((?!$|florals/|previews/|sitemap.xml|robots.txt).*)", headers: [...SECURITY_HEADERS, NO_ROBOTS] },
      { source: "/florals/:path*", headers: [...SECURITY_HEADERS, NO_ROBOTS, ...FLORAL_CACHE] },
      { source: "/previews/:path*", headers: [...SECURITY_HEADERS, NO_ROBOTS, ...PREVIEW_CACHE] },
    ];
  },
};

export default nextConfig;
