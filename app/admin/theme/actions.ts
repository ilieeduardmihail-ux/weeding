"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentTenantId } from "@/lib/tenant-session";
import { normalizeTheme, type Theme } from "@/lib/theme";

export type ThemeResult = { ok: true } | { ok: false; error: string };

/**
 * Stores the look of this wedding's public site. normalizeTheme drops anything
 * unknown (bad palette id, non-hex colours) and the database function checks
 * that the caller really administers the tenant before touching the row.
 */
export async function saveTheme(theme: Theme): Promise<ThemeResult> {
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false, error: "Sesiune expirată. Intră din nou în admin." };

  const clean = normalizeTheme(theme);

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_tenant_theme", { p_tenant: tenantId, p_theme: clean });
  if (error) {
    return { ok: false, error: "Nu am putut salva tema. Încearcă din nou în câteva secunde." };
  }

  // The public site is rendered per request, but invalidate it so the change is
  // visible immediately without waiting for the next navigation.
  revalidatePath("/");
  revalidatePath("/", "layout");
  return { ok: true };
}
