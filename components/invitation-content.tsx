"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { INVITATION_ZOOM_MS, OPEN_INVITATION_EVENT, scrollToInvitation } from "@/lib/invitation";

/**
 * The landing screen only shows the hero. Everything else is not mounted in the
 * DOM and the page cannot scroll until the visitor opens the invitation. Once
 * opened, the content stays available for the rest of the session.
 */
export function InvitationContent({ children }: { children: ReactNode }) {
  const [opened, setOpened] = useState(false);
  const openedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const open = () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (openedRef.current) {
        scrollToInvitation(reduced ? "auto" : "smooth");
        return;
      }

      openedRef.current = true;
      setOpened(true);

      if (reduced) {
        requestAnimationFrame(() => requestAnimationFrame(() => scrollToInvitation("auto")));
      } else {
        timer = setTimeout(() => scrollToInvitation("smooth"), INVITATION_ZOOM_MS);
      }
    };

    window.addEventListener(OPEN_INVITATION_EVENT, open);
    return () => {
      window.removeEventListener(OPEN_INVITATION_EVENT, open);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // No scrolling behind the closed landing screen.
  useEffect(() => {
    if (opened) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [opened]);

  if (!opened) return null;

  return <div className="animate-in fade-in duration-500">{children}</div>;
}
