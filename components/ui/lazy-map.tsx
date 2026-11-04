"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Mounts the Google Maps iframe only when the map is about to enter the
 * viewport. Two embeds on the landing flow are heavy, and none of them is
 * needed before the guest scrolls to the locations section.
 */
export function LazyMap({ title, src }: { title: string; src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Browsers without IntersectionObserver render the map immediately; modern
  // ones keep it unmounted until it is about to scroll into view.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "350px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="h-64 w-full">
      {visible ? (
        <iframe
          title={title}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-64 w-full rounded-lg border-0"
        />
      ) : (
        <div className="grid h-64 w-full place-items-center rounded-lg bg-ink/5 text-xs text-ink/40" aria-hidden>
          Harta se încarcă…
        </div>
      )}
    </div>
  );
}
