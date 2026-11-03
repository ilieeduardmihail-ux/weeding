"use client";
import { useEffect, useRef } from "react";
import { MotionConfig, motion, useAnimationControls } from "framer-motion";
import { Countdown } from "./countdown";
import { OPEN_INVITATION_EVENT, requestOpenInvitation } from "@/lib/invitation";

type HeroProps = {
  names: [string, string];
  displayDate: string;
  city: string;
  eventIso: string;
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.22 } } };
const rise = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero({ names, displayDate, city, eventIso }: HeroProps) {
  const [a, b] = names;
  const controls = useAnimationControls();
  const leaving = useRef(false);

  // Start only once the browser is actually painting. If the page opens in a
  // background or occluded window, frames are paused; starting on mount would
  // run the whole entrance off-screen and the visitor would just see the end.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void controls.start("show");
    });
    return () => cancelAnimationFrame(frame);
  }, [controls]);

  // Zoom the hero in, then glide to the first content section. With reduced
  // motion, skip the zoom and jump straight to the content.
  useEffect(() => {
    const openInvitation = () => {
      const target = document.getElementById("locatii");
      if (!target) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        target.scrollIntoView({ block: "start" });
        return;
      }
      if (leaving.current) return;

      leaving.current = true;
      void controls
        .start({
          scale: 1.06,
          opacity: 0,
          transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        })
        .then(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          controls.set({ scale: 1, opacity: 1 });
          leaving.current = false;
        });
    };

    window.addEventListener(OPEN_INVITATION_EVENT, openInvitation);
    return () => window.removeEventListener(OPEN_INVITATION_EVENT, openInvitation);
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
          {displayDate}, {city}
        </motion.p>
        <motion.div variants={rise} className="mt-10">
          <Countdown target={eventIso} />
        </motion.div>
        <motion.div
          variants={rise}
          className="mt-12 flex w-full max-w-sm flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center"
        >
          <motion.a
            href="#locatii"
            onClick={(event) => {
              event.preventDefault();
              requestOpenInvitation();
            }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full bg-ink px-8 py-3 text-center text-sea transition-colors duration-200 ease-out hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            Deschide Invitația
          </motion.a>
          <a
            href="/calendar"
            className="rounded-full border border-ink/30 px-8 py-3 text-center transition-colors duration-200 ease-out hover:border-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            Adaugă în calendar
          </a>
        </motion.div>
      </motion.header>
    </MotionConfig>
  );
}
