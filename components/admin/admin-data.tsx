"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_DATA_EVENT, type AdminData } from "@/lib/admin-data";
import { useAdminSlug } from "@/components/admin/admin-tenant";
import { createBrowserSupabase, hasSupabaseBrowser } from "@/lib/supabase/browser";

type AdminDataValue = {
  data: AdminData | null;
  error: string | null;
  /** True while the Supabase Realtime subscription is connected. */
  live: boolean;
  /** When `data` was requested. A write that finished later must not apply it. */
  loadedAt: number;
  /** Silent revalidation: the current data stays on screen while it loads. */
  refresh: () => Promise<void>;
};

const AdminDataContext = createContext<AdminDataValue | null>(null);

export function useAdminData() {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error("useAdminData must be used inside AdminDataProvider");
  return value;
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const slug = useAdminSlug();
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);

  const running = useRef(false);
  const queued = useRef(false);
  const lastLoaded = useRef(0);
  const lastPayload = useRef("");
  const liveRef = useRef(false);

  const refresh = useCallback(async () => {
    // Requests are serialized: while one runs, later callers mark it dirty and
    // get one more round afterwards. Returning the running request instead
    // would let a mutation finish without ever loading the value it wrote.
    if (running.current) {
      queued.current = true;
      return;
    }

    running.current = true;
    try {
      do {
        queued.current = false;

        // The moment the request leaves tells the caller whether the snapshot
        // could have seen a write that finished later.
        const startedAt = Date.now();
        try {
          const response = await fetch(`/${slug}/admin/bootstrap`, { cache: "no-store" });
          if (response.status === 401) {
            router.replace(`/${slug}/admin/login`);
            return;
          }
          // 403 means the wedding is suspended or the access ran out: the section
          // skeletons would never fill, so send the couple to the explainer.
          if (response.status === 403) {
            router.replace(`/${slug}/admin/expired`);
            return;
          }
          if (!response.ok) throw new Error(String(response.status));
          // Realtime pushes and the fallback poll very often bring back exactly
          // what is already on screen. Comparing the raw body first keeps big
          // lists from re-rendering (and re-parsing) for nothing.
          const body = await response.text();
          lastLoaded.current = Date.now();
          setError(null);
          if (body === lastPayload.current) continue;
          lastPayload.current = body;
          setData(JSON.parse(body) as AdminData);
          setLoadedAt(startedAt);
        } catch {
          setError("Nu am putut încărca datele. Verifică conexiunea și încearcă din nou.");
        }
      } while (queued.current);
    } finally {
      running.current = false;
    }
  }, [router, slug]);

  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  // First load: one parallel request for every section.
  useEffect(() => {
    if (data) return;
    void refresh();
  }, [data, refresh]);

  // Optimistic actions announce themselves; one silent refresh updates every section.
  useEffect(() => {
    const onChange = () => void refresh();
    window.addEventListener(ADMIN_DATA_EVENT, onChange);
    return () => window.removeEventListener(ADMIN_DATA_EVENT, onChange);
  }, [refresh]);

  // Coming back to the tab after a while gets fresh data; short switches do not.
  // While the live socket is connected the slow poll is pointless, so it only
  // runs as a fallback when realtime is down.
  useEffect(() => {
    const maybeRefresh = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastLoaded.current < 15_000) return;
      void refresh();
    };
    const onVisibility = () => maybeRefresh();
    window.addEventListener("focus", maybeRefresh);
    document.addEventListener("visibilitychange", onVisibility);
    const poll = window.setInterval(() => {
      if (!liveRef.current) maybeRefresh();
    }, 60_000);
    return () => {
      window.removeEventListener("focus", maybeRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(poll);
    };
  }, [refresh]);

  // Live RSVP updates arrive once for the whole admin, not once per section.
  useEffect(() => {
    if (!hasSupabaseBrowser) return;
    const supabase = createBrowserSupabase();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const changed = () => {
      if (document.visibilityState !== "visible") return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 250);
    };

    const channel = supabase
      .channel("admin-data-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps" }, changed)
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvp_guests" }, changed)
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      if (timer) clearTimeout(timer);
      setLive(false);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const value = useMemo<AdminDataValue>(
    () => ({ data, error, live, loadedAt, refresh }),
    [data, error, live, loadedAt, refresh]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}
