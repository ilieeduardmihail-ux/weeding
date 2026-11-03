"use client";
import { MotionConfig, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { mapsSearchUrl, type WeddingLocation } from "@/lib/config";

export function Schedule({ locations }: { locations: WeddingLocation[] }) {
  if (locations.length === 0) return null;

  return (
    <MotionConfig reducedMotion="user">
      <section id="locatii" className="scroll-mt-24 bg-mist/40 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-4xl">Unde ne găsești</h2>
          <p className="mt-3 text-ink/70">
            Biserica și locul petrecerii, cu adresele la zi. Apasă pe hartă pentru indicații.
          </p>

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
                  className="mt-3 inline-flex items-center gap-2 text-sm text-gold underline decoration-gold/50 underline-offset-4 transition-colors duration-200 hover:decoration-gold"
                >
                  <MapPin className="size-4" aria-hidden />
                  Deschide în Maps
                </a>

                {location.embed_url && (
                  <iframe
                    title={`Hartă: ${location.name}`}
                    src={location.embed_url}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="mt-6 h-64 w-full rounded-xl border border-ink/15"
                  />
                )}
              </motion.li>
            ))}
          </ol>
        </div>
      </section>
    </MotionConfig>
  );
}
