"use client";
import { useEffect } from "react";
import { MotionConfig, motion, useAnimationControls } from "framer-motion";
import { requestOpenInvitation } from "@/lib/invitation";
import { FloralCluster } from "@/components/floral-cluster";

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
        className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center"
      >
        {/* Two quiet botanical corners, like the flowers framing the printed
            invitation. They sit behind the type and never cover it. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          <FloralCluster
            id="flora-bottom-left"
            className="absolute bottom-0 left-0 hidden w-[clamp(11rem,17vw,15rem)] opacity-80 md:block"
          />
          <FloralCluster
            id="flora-top-right"
            className="absolute right-0 top-0 w-[clamp(6.5rem,9vw,8.5rem)] rotate-180 opacity-75"
          />
        </div>

        <div className="relative z-10 flex w-full flex-col items-center">
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
        </div>
      </motion.header>
    </MotionConfig>
  );
}
