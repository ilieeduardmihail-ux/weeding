/**
 * Server-only helpers for the platform owner: the service-role client (bypasses
 * RLS, so it is only ever used after an owner check) and access-key handling.
 *
 * Access keys are generated with `crypto.randomBytes` and only their SHA-256
 * hash is stored, so a client can never mint a working key: the alphabet is
 * server-side, and a row in `access_keys` is worthless without the code itself.
 */
import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/service-env";
import { demoMode } from "@/lib/demo/mode";
import { createClient as createSessionClient } from "@/lib/supabase/server";

/** Slugs that would collide with a real route or an internal name. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "platform",
  "start",
  "api",
  "invitatia-poza",
  "calendar",
  "confidentialitate",
  "opengraph-image",
  "icon",
  "_next",
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function slugProblem(slug: string): string | null {
  if (slug.length < 2) return "Adresa trebuie să aibă cel puțin 2 caractere.";
  if (slug.length > 60) return "Adresa poate avea cel mult 60 de caractere.";
  if (!SLUG_PATTERN.test(slug)) return "Adresa poate conține doar litere mici, cifre și cratime.";
  if (RESERVED_SLUGS.has(slug)) return "Această adresă este rezervată. Alege alta.";
  return null;
}

/* ------------------------------------------------------------------ access keys */

const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1, easy to read aloud

/** A friendly key such as WED-7K4M-9QXA-P2RT-H8ND. Only its hash is stored. */
export function generateAccessKey() {
  const groups: string[] = [];
  for (let group = 0; group < 4; group++) {
    let chunk = "";
    for (const byte of randomBytes(4)) chunk += KEY_ALPHABET[byte % KEY_ALPHABET.length];
    groups.push(chunk);
  }
  return `WED-${groups.join("-")}`;
}

/** Accepts keys typed with spaces or lowercase; dashes are optional. */
export function normalizeAccessKey(value: string) {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.startsWith("WED") ? clean.slice(3) : clean;
}

export function hashAccessKey(value: string) {
  return createHash("sha256").update(normalizeAccessKey(value)).digest("hex");
}

/* ------------------------------------------------------------------- clients */

let cachedService: ReturnType<typeof createServiceClient> | null = null;

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Service-role client. Throws when the key is not configured (production). */
export function serviceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  cachedService ??= createServiceClient();
  return cachedService;
}

export function platformIsConfigured() {
  if (demoMode) return false;
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Confirms the signed-in session belongs to a platform owner. Uses the normal
 * cookie client, so it can never be spoofed by a request body.
 */
export async function isOwnerRequest() {
  if (demoMode) return false;
  const supabase = await createSessionClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return false;
  const { data } = await supabase.rpc("is_platform_owner");
  return data === true;
}