"use client";
import { useEffect, useState, type ReactNode } from "react";
import { OPEN_INVITATION_EVENT } from "@/lib/invitation";

/**
 * Screen swap for the guest site.
 *
 * Only one screen exists in the DOM at a time: first the landing, then the
 * invitation. The landing is unmounted (not hidden, not scrolled past) once the
 * visitor opens the invitation, and the rest of the site mounts in its place.
 *
 * The swap itself is instant — the invitation simply fades in — so the click
 * feels immediate. The entrance class is applied only to that swap, never to
 * the first paint: a link that opens the invitation directly (#rsvp, or a name
 * already filled in by the couple) must show the content at once.
 */
export function InvitationScreen({
  landing,
  children,
  autoOpen = false,
}: {
  landing: ReactNode;
  children: ReactNode;
  autoOpen?: boolean;
}) {
  const [opened, setOpened] = useState(autoOpen);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    const open = () => {
      setSwapping(true);
      setOpened(true);
    };
    window.addEventListener(OPEN_INVITATION_EVENT, open);
    return () => window.removeEventListener(OPEN_INVITATION_EVENT, open);
  }, []);

  // The landing fills the viewport: nothing scrolls behind it. Once the
  // invitation mounts, jump to the section from the link (#rsvp) or to the top.
  useEffect(() => {
    if (opened) {
      const hash = window.location.hash;
      const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (target) target.scrollIntoView({ behavior: "auto", block: "start" });
      else window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [opened]);

  if (!opened) {
    return <div className="pb-24 sm:pb-0">{landing}</div>;
  }

  return (
    <div className={swapping ? "animate-screen-in motion-reduce:animate-none" : undefined}>{children}</div>
  );
}
