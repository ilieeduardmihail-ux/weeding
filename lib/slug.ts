/**
 * The public address of a wedding, kept free of server-only imports so the
 * panel can show the slug while the owner types. The real uniqueness check and
 * the insert happen on the server (`lib/platform.ts` and the platform actions).
 */
import { DEMO_SLUG } from "@/lib/marketing";

/** Slugs that would collide with a real route or an internal name. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "platform",
  DEMO_SLUG,
  "start",
  "api",
  "invitatia-poza",
  "calendar",
  "confidentialitate",
  "cookies",
  "termeni",
  "subprocesatori",
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
