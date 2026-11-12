/**
 * A short-lived proof that a public RSVP belongs to the wedding whose page
 * rendered it.
 *
 * The public page signs its own tenant id; the server action accepts a write
 * only for a token it signed itself. Without this, a visitor could post replies
 * into any wedding's list by swapping the UUID that travels in the request.
 * The signature is HMAC-SHA256 over `tenantId:day`, so it cannot be forged and
 * does not need a database round trip (it costs microseconds).
 */
import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { demoMode } from "@/lib/demo/mode";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/service-env";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Its own secret when configured, otherwise the service-role key, which is the
 * only other high-entropy value that is guaranteed to exist on the server.
 */
function secret(): string {
  if (demoMode) return "demo-tenant-token";
  return (process.env.TENANT_TOKEN_SECRET || SUPABASE_SERVICE_ROLE_KEY || "").trim();
}

function dayStamp(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

function signature(tenantId: string, day: string, key: string): string {
  return createHmac("sha256", key).update(`${tenantId}:${day}`).digest("base64url");
}

/** Token for the page about to be rendered. Empty when no secret is available. */
export function signTenantToken(tenantId: string): string {
  const key = secret();
  if (!key || !UUID.test(tenantId)) return "";
  const day = dayStamp();
  return `${tenantId}.${day}.${signature(tenantId, day, key)}`;
}

/**
 * The tenant id a token vouches for, or null when it is missing, malformed or
 * signed with another secret. Yesterday is accepted too, so a page opened just
 * before midnight can still submit after it.
 */
export function readTenantToken(token: unknown): string | null {
  if (typeof token !== "string") return null;
  const key = secret();
  if (!key) return null;

  const [tenantId, day, mac] = token.split(".");
  if (!tenantId || !day || !mac || !UUID.test(tenantId)) return null;

  for (const candidate of [dayStamp(), dayStamp(-1)]) {
    if (day !== candidate) continue;
    const expected = Buffer.from(signature(tenantId, day, key));
    const given = Buffer.from(mac);
    if (given.length === expected.length && timingSafeEqual(given, expected)) return tenantId;
  }
  return null;
}
