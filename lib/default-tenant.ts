/**
 * The wedding served at the root of the domain before the marketing page took
 * that spot. Its links are still in circulation, so the root redirects here and
 * the legacy short paths (/calendar, /invitatia-poza) do too.
 *
 * Kept in its own module so `next.config.ts` can read it without importing the
 * Supabase client that `lib/tenants.ts` needs.
 */
export const DEFAULT_TENANT_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT?.trim() || "ana-si-stefan";
