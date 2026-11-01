"use client";
import { MotionConfig, motion } from "framer-motion";
import { wedding } from "@/lib/config";

export function Schedule() {
  return (
    <MotionConfig reducedMotion="user">
      <section className="bg-mist/60 py-24">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-4xl">The day</h2>
          <ol className="relative mt-12 space-y-12 border-l border-ink/25 pl-8">
            {wedding.events.map((e) => (
              <motion.li
                key={e.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <span className="absolute -left-[37px] top-2 size-2.5 rounded-full bg-gold" aria-hidden />
                <p className="text-sm text-ink/60">{e.time}</p>
                <h3 className="font-display text-2xl">{e.title}</h3>
                <p className="mt-1">{e.place}</p>
                <p className="text-ink/70">{e.address}</p>
                <a href={e.mapsUrl} target="_blank" rel="noreferrer"
                   className="mt-2 inline-block underline decoration-gold underline-offset-4">
                  Open in Maps
                </a>
              </motion.li>
            ))}
          </ol>
          <iframe
            title="Reception venue map"
            src={wedding.receptionEmbed}
            loading="lazy"
            className="mt-14 h-72 w-full rounded-lg border-0"
          />
        </div>
      </section>
    </MotionConfig>
  );
}
