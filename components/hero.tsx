"use client";
import { useEffect } from "react";
import { MotionConfig, motion, useAnimationControls } from "framer-motion";
import { requestOpenInvitation } from "@/lib/invitation";

type HeroProps = {
  names: [string, string];
  displayDate: string;
  displayTime: string;
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.22 } } };
const rise = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero({ names, displayDate, displayTime }: HeroProps) {
  const [a, b] = names;
  const controls = useAnimationControls();

  // Start only once the browser is actually painting. If the page opens in a
  // background or occluded window, frames are paused; starting on mount would
  // run the whole entrance off-screen and the visitor would just see the end.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void controls.start("show");
    });
    return () => cancelAnimationFrame(frame);
  }, [controls]);

  return (
    <MotionConfig reducedMotion="user">
      <motion.header
        variants={container}
        initial="hidden"
        animate={controls}
        className="flex min-h-svh flex-col items-center justify-center px-6 text-center"
      >
        <motion.h1 variants={rise} className="font-display text-[clamp(4rem,16vw,11rem)] leading-[0.9] tracking-tight">
          {a}
          <span className="block text-gold italic">&amp;</span>
          {b}
        </motion.h1>
        <motion.p variants={rise} className="mt-8 text-lg">
          {displayDate} · ora {displayTime}
        </motion.p>
        <motion.div
          variants={rise}
          className="mt-12 flex w-full max-w-sm flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center"
        >
          <motion.button
            type="button"
            onClick={requestOpenInvitation}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full bg-ink px-8 py-3 text-center text-sea shadow-lg shadow-black/20 transition-colors duration-200 ease-out hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            Deschide Invitația
          </motion.button>
        </motion.div>
      </motion.header>
    </MotionConfig>
  );
}
