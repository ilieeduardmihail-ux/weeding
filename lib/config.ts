export const MAX_GUESTS = 6;

/** A place guests need to find: the church and the reception venue. */
export type WeddingLocation = {
  key: string;
  label: string;
  name: string;
  address: string;
  event_time: string;
  embed_url: string | null;
};

/** Shown only if the database cannot be reached, so the page never looks broken. */
export const FALLBACK_LOCATIONS: WeddingLocation[] = [
  {
    key: "church",
    label: "Biserică",
    name: "Biserica Sfântul Nicolae",
    address: "Strada Exemplu 12, București",
    event_time: "16:00",
    embed_url: null,
  },
  {
    key: "venue",
    label: "Local",
    name: "Restaurant Grădina Verde",
    address: "Șoseaua Exemplu 45, București",
    event_time: "19:30",
    embed_url: null,
  },
];

/** "Biserica Sfântul Nicolae, Strada Exemplu 12" -> Google Maps search link. */
export const mapsSearchUrl = (location: Pick<WeddingLocation, "name" | "address">) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${location.name}, ${location.address}`
  )}`;

// Names, date, time, city and the RSVP cutoff live in `event_settings`.
// The two locations live in `locations` and are edited from /admin/locations.
// Only the FAQ is code.
export const wedding = {
  faq: [
    {
      q: "Unde putem parca?",
      a: "La local există parcare gratuită. În apropierea bisericii locurile sunt limitate, așa că vă recomandăm să veniți cu un taxi sau să lăsați mașina la local și să mergeți împreună.",
    },
    {
      q: "Ce ținută este potrivită?",
      a: "Ținută elegantă: rochii de cocktail și costume. Curtea este cu pietriș, așa că tocurile groase sau pantofii comozi sunt o idee mai bună decât tocurile foarte subțiri.",
    },
    {
      q: "Unde ne putem caza?",
      a: "În oraș sunt mai multe hoteluri la 10–15 minute de biserică. Vă recomandăm să rezervați din timp; dacă aveți nevoie de o recomandare, scrieți-ne și vă ajutăm cu drag.",
    },
    {
      q: "Pot veni cu copiii?",
      a: "Da. Adăugați-i în formularul de confirmare și marcați-i ca fiind copii, ca să putem planifica locurile la masă și meniurile.",
    },
  ],
};
