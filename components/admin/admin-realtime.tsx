"use client";

import { useAdminData } from "@/components/admin/admin-data";
import { hasSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * Live status indicator. The subscription itself lives in AdminDataProvider, so
 * it is created once for the whole admin instead of once per open section.
 */
export function AdminRealtime() {
  const { live } = useAdminData();
  if (!hasSupabaseBrowser) return null;

  return (
    <p className="mt-4 inline-flex items-center gap-2 text-xs text-ink/55" role="status">
      <span
        aria-hidden
        className={`size-2 rounded-full ${live ? "bg-emerald-400" : "bg-ink/30"}`}
      />
      {live ? "Actualizare în timp real" : "Se conectează la actualizările live…"}
    </p>
  );
}
