"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

/**
 * Google Maps, behind an explicit click.
 *
 * An auto-loading iframe would let Google read the visitor's device and set its
 * cookies before any consent — the pattern ANSPDCP has been fining under
 * Legea 506/2004, art. 4 alin. (5). Nothing leaves the browser until the guest
 * presses the button; the address and the "Deschide în Maps" link next to this
 * box still work without it.
 */
export function LazyMap({ title, src }: { title: string; src: string }) {
  const [allowed, setAllowed] = useState(false);

  if (allowed) {
    return (
      <div className="h-64 w-full">
        <iframe
          title={title}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-64 w-full rounded-lg border-0"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-ink/15 bg-ink/[0.03] px-6 py-8 text-center">
      <MapPin className="size-6 text-gold" aria-hidden />
      <p className="max-w-sm text-sm leading-relaxed text-ink/70">
        Harta este găzduită de Google Maps și se încarcă doar dacă apeși. Până atunci nu pleacă
        nicio cerere către Google.
      </p>
      <button
        type="button"
        onClick={() => setAllowed(true)}
        className="rounded-full bg-ink px-5 py-2 text-sm text-sea transition-[background-color,transform] duration-200 ease-out hover:bg-ink/85 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        Încarcă harta
      </button>
      <p className="text-xs text-ink/50">
        Poți deschide harta și din linkul „Deschide în Maps” de mai sus, fără să încarci integrarea.
      </p>
    </div>
  );
}
