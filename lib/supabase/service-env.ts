/**
 * The one secret in this project that must never reach a browser: the
 * service-role key bypasses every RLS policy.
 *
 * `server-only` makes an accidental client import a build error instead of a
 * silent `undefined`, which is the whole point of keeping it in its own file:
 * `lib/supabase/env.ts` is deliberately importable from the browser (the
 * publishable key lives there), this file is not.
 */
import "server-only";

export const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
