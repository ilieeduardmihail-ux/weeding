"use client";

import { useTransition } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/components/admin/admin-data";

/**
 * The dataset is loaded once for the whole panel. Until now a failed load left
 * every section on its skeleton forever, with no explanation: the provider kept
 * an `error` that no screen rendered. This is the one place that shows it.
 */
export function AdminDataStatus() {
  const { data, error, refresh } = useAdminData();
  const [pending, start] = useTransition();

  if (!error) return null;

  return (
    <div
      role="alert"
      className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-600/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900"
    >
      <p className="flex items-center gap-2">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        {error}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => start(async () => { await refresh(); })}
      >
        <RefreshCw aria-hidden="true" className={pending ? "animate-spin" : undefined} />
        {pending ? "Se încarcă…" : data ? "Reîmprospătează" : "Încearcă din nou"}
      </Button>
    </div>
  );
}
