import type { NextConfig } from "next";

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
  // Belt and braces for the meta tags: this also covers files that cannot carry
  // a `<meta>` (the calendar feed, the invitation image, exports).
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // No page needs the camera, the microphone or precise location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

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

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
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
  async headers() {
    return [
      { source: "/florals/:path*", headers: [...SECURITY_HEADERS, ...FLORAL_CACHE] },
      { source: "/(.*)", headers: SECURITY_HEADERS },
    ];
  },
};

export default nextConfig;
