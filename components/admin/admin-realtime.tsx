"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase, hasSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * Keeps the admin screens fresh: a Supabase Realtime subscription refreshes the
 * server component as soon as an RSVP is written, with a light polling fallback
 * for projects where the tables are not part of the realtime publication yet.
 */
export function AdminRealtime() {
  const router = useRouter();
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!hasSupabaseBrowser) return;

    const supabase = createBrowserSupabase();
    let debounce: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      // A hidden tab does not need to re-render; the visibility handler below
      // refreshes once when the admin comes back.
      if (document.visibilityState !== "visible") return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => router.refresh(), 250);
    };

    const channel = supabase
      .channel("admin-rsvp-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvp_guests" }, refresh)
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    // Safety net when Realtime is not enabled on the project yet.
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 15_000);

    return () => {
      if (debounce) clearTimeout(debounce);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [router]);

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
