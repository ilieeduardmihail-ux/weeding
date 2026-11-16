"use client";

import { useEffect } from "react";

/**
 * One anonymous visit, sent once per tab and path. No cookie is written: the
 * server hashes IP + browser + a server-side salt and keeps only the hash, so
 * the same person is counted as one unique visitor for the day/week.
 *
 * It is deliberately passive: nothing renders, nothing blocks, and a failure is
 * silent. The page works exactly the same if the endpoint is down.
 */
export function VisitBeacon({ path }: { path: string }) {
  useEffect(() => {
    if (typeof navigator === "undefined" || navigator.webdriver) return;
    if (document.visibilityState === "hidden") return;

    const key = `visit:${path}`;
    try {
      // Back/forward and soft reloads in the same tab must not count twice.
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked (private mode, strict settings): count anyway.
    }

    const body = JSON.stringify({ path });
    const send = () => {
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/visit", new Blob([body], { type: "application/json" }));
          return;
        }
      } catch {
        // fall through to fetch
      }
      void fetch("/api/visit", {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch(() => undefined);
    };

    if (document.readyState === "complete") send();
    else window.addEventListener("load", send, { once: true });

    return () => window.removeEventListener("load", send);
  }, [path]);

  return null;
}
