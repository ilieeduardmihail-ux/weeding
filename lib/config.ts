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
