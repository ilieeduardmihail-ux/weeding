"use client";
import { MotionConfig, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { mapsSearchUrl, type WeddingLocation } from "@/lib/config";
import { LazyMap } from "@/components/ui/lazy-map";
import { Reveal } from "@/components/ui/reveal";

export function Schedule({
  locations,
  intro,
}: {
  locations: WeddingLocation[];
  intro?: string | null;
}) {
  if (locations.length === 0) return null;

  return (
    <MotionConfig reducedMotion="user">
      <section id="locatii" className="scroll-mt-24 bg-mist/40 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            {intro ? (
              <p className="mb-5 whitespace-pre-line text-lg leading-relaxed text-ink/80">
                {intro}
              </p>
            ) : null}
            <h2 className="font-display text-4xl">Unde ne găsești</h2>
            <p className="mt-3 text-ink/70">
              Biserica și locul petrecerii, cu adresele la zi. Apasă pe hartă pentru indicații.
            </p>
          </Reveal>

          <ol className="relative mt-12 space-y-16 border-l border-ink/25 pl-8">
            {locations.map((location) => (
              <motion.li
                key={location.key}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <span className="absolute -left-[37px] top-2 size-2.5 rounded-full bg-gold" aria-hidden />
                <p className="text-sm text-ink/60">{location.event_time}</p>
                <h3 className="font-display text-3xl">{location.label}</h3>
                <p className="mt-1 text-lg">{location.name}</p>
                <p className="text-ink/70">{location.address}</p>
                <a
                  href={mapsSearchUrl(location)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-gold underline decoration-gold/50 underline-offset-4 transition-[color,text-decoration-color,transform] duration-200 ease-out hover:-translate-y-px hover:text-gold/90 hover:decoration-gold"
                >
                  <MapPin className="size-4" aria-hidden />
                  Deschide în Maps
                </a>

                {location.embed_url && (
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="glass card-hover mt-6 rounded-xl p-1.5"
                  >
                    <LazyMap title={`Hartă: ${location.name}`} src={location.embed_url} />
                  </motion.div>
                )}
              </motion.li>
            ))}
          </ol>
        </div>
      </section>
    </MotionConfig>
  );
}
