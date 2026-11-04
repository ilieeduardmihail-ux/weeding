"use client";
import { motion } from "framer-motion";
import { requestOpenInvitation } from "@/lib/invitation";

export function MobileRsvp() {
  return (
    <div className="glass-bar fixed inset-x-0 bottom-0 z-50 border-t border-ink/15 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:hidden">
      <motion.button
        type="button"
        onClick={requestOpenInvitation}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-sea shadow-lg shadow-black/25 transition-colors duration-200 ease-out hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        Deschide Invitația
      </motion.button>
    </div>
  );
}
