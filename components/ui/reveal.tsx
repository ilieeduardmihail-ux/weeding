"use client";
import type { ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";

/**
 * Fade-in-up on scroll. Wrapped in MotionConfig by InvitationScreen, so
 * `prefers-reduced-motion` turns it into a plain fade.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  amount = 0.2,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  amount?: number;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount }}
        transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
