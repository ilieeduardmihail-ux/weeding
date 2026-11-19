/**
 * The pieces of the demo account that are plain functions: the six-digit code,
 * its hash and the seven-day clock. Kept free of `server-only` and of Supabase
 * imports so they can be tested (and read) without a database.
 *
 * The code is never stored in clear: only an HMAC of `email:code`, keyed with a
 * server-side secret. Six digits alone are easy to brute-force; the pepper is
 * what makes a stolen dump useless.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const CODE_TTL_MINUTES = 15;
export const CODE_MAX_ATTEMPTS = 5;
/** One email a minute per address, whatever the server instance. */
export const CODE_RESEND_SECONDS = 60;
/** Keep in sync with the `interval '7 days'` in migration-v33. */
export const SANDBOX_DAYS = 7;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * `RATE_LIMIT_SALT` is already a server-only secret in production; the dedicated
 * `LEAD_CODE_PEPPER` lets it be rotated on its own.
 */
const PEPPER =
  (process.env.LEAD_CODE_PEPPER ?? process.env.RATE_LIMIT_SALT ?? "").trim() ||
  "ne-casatorim-demo-codes-dev";

export function generateLeadCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashLeadCode(code: string, email: string): string {
  return createHmac("sha256", PEPPER)
    .update(`${normalizeEmail(email)}:${code.trim()}`)
    .digest("hex");
}

/** Constant-time comparison, so a wrong code cannot be found one byte at a time. */
export function codeMatches(code: string, email: string, stored: string | null): boolean {
  if (!stored) return false;
  const given = Buffer.from(hashLeadCode(code, email), "hex");
  const expected = Buffer.from(stored, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Seconds still to wait before another code may be sent. Zero when free. */
export function resendWaitSeconds(sentAt: string | null, now = Date.now()): number {
  if (!sentAt) return 0;
  const wait = Math.ceil((new Date(sentAt).getTime() + CODE_RESEND_SECONDS * 1000 - now) / 1000);
  return Math.max(0, wait);
}

/** Days left before a sandbox disappears, for the bar in the panel. */
export function sandboxDaysLeft(expiresAt: string | null, now = Date.now()): number {
  if (!expiresAt) return SANDBOX_DAYS;
  const ms = new Date(expiresAt).getTime() - now;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
