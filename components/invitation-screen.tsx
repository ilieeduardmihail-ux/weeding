"use client";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { OPEN_INVITATION_EVENT } from "@/lib/invitation";

/**
 * Screen swap for the guest site.
 *
 * Only one screen exists in the DOM at a time: first the landing, then the
 * invitation. The landing is unmounted (not hidden, not scrolled past) once the
 * visitor opens the invitation, and the rest of the site mounts in its place.
 */
export function InvitationScreen({
  landing,
  children,
}: {
  landing: ReactNode;
  children: ReactNode;
}) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const open = () => setOpened(true);
    window.addEventListener(OPEN_INVITATION_EVENT, open);
    return () => window.removeEventListener(OPEN_INVITATION_EVENT, open);
  }, []);

  // The landing fills the viewport: nothing scrolls behind it. Once the
  // invitation mounts, the page starts again from the top.
  useEffect(() => {
    if (opened) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [opened]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        {opened ? (
          <motion.div
            key="invitation"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            exit={{
              opacity: 0,
              scale: 1.025,
              filter: "blur(2px)",
              transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
            }}
            className="pb-24 sm:pb-0"
          >
            {landing}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
