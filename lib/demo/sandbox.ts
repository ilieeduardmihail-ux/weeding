/**
 * Sandbox-urile sunt copii ale nunții demo, una per vizitator, ca fiecare om să
 * poată lucra în panou fără să atingă demonstrația publică sau datele altcuiva.
 *
 * Se creează cu cheia de service, printr-o funcție SQL care copiază tot
 * conținutul demo și dă vizitatorului acces la panou. Trăiesc 7 zile; curățarea
 * rulează oportunist (la o înscriere nouă, când se deschide „Lead-uri"), ca să
 * nu fie nevoie de un cron și de un secret în plus.
 */
import "server-only";

import { DEMO_SLUG } from "@/lib/marketing";
import { serviceClient } from "@/lib/platform";

/**
 * The seven days live with the rest of the demo constants, so the clone, the
 * bar and the tests cannot drift apart. Kept exported from here as before.
 */
export { SANDBOX_DAYS } from "@/lib/leads-code";

export type Sandbox = { id: string; slug: string };

/**
 * Creates the visitor's own copy of the demo wedding. Returns null (never
 * throws) so a caller can report one friendly message instead of a stack trace.
 */
export async function createSandboxFor(email: string): Promise<Sandbox | null> {
  try {
    const service = serviceClient();
    const { data, error } = await service.rpc("clone_demo_sandbox", {
      p_demo_slug: DEMO_SLUG,
      p_email: email,
    });
    if (error || typeof data !== "string") {
      console.error("[sandbox] clone failed", error);
      return null;
    }

    const { data: tenant } = await service
      .from("tenants")
      .select("slug")
      .eq("id", data)
      .maybeSingle();
    if (!tenant?.slug) return null;
    return { id: data, slug: String(tenant.slug) };
  } catch (error) {
    console.error("[sandbox] clone crashed", error);
    return null;
  }
}

/** Deletes every sandbox whose 7 days are gone. Safe to call often. */
export async function purgeExpiredSandboxes(): Promise<void> {
  try {
    await serviceClient().rpc("purge_expired_sandboxes");
  } catch {
    // Housekeeping must never break the page that triggered it.
  }
}
