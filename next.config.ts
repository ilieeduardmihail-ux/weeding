import type { NextConfig } from "next";

/**
 * Content-Security-Policy, sent in report-only mode for now: the browser reports
 * violations without blocking, so we can watch for anything we missed (Next
 * injects inline bootstrap scripts, Supabase Realtime opens a websocket, Vercel
 * Analytics and Google Maps embeds have their own hosts) before enforcing it.
 */
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
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
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
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
