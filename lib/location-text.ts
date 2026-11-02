import type { WeddingLocation } from "./config";

/**
 * The first seed of `locations` was pasted with the wrong encoding, so Supabase
 * stored "BisericÄƒ" instead of "Biserică". These replacements repair the text
 * on read, and the admin form saves it back clean.
 */
const MOJIBAKE: [string, string][] = [
  ["Äƒ", "ă"],
  ["Ä‚", "Ă"],
  ["Ã¢", "â"],
  ["Ã‚", "Â"],
  ["Ã®", "î"],
  ["ÃŽ", "Î"],
  ["È™", "ș"],
  ["È˜", "Ș"],
  ["È›", "ț"],
  ["Èš", "Ț"],
  ["ÅŸ", "ș"],
  ["Åž", "Ș"],
];

export function cleanLocationText(value: string) {
  let text = value;
  for (const [broken, fixed] of MOJIBAKE) text = text.split(broken).join(fixed);
  return text;
}

/** Old English seed labels become the Romanian ones; custom labels are kept. */
export function locationLabel(key: string, label: string) {
  if (key === "church" && /^church\b/i.test(label.trim())) return "Biserică";
  if (key === "venue" && /^venue\b/i.test(label.trim())) return "Local";
  return cleanLocationText(label);
}

export function cleanLocation(location: WeddingLocation): WeddingLocation {
  return {
    ...location,
    label: locationLabel(location.key, location.label),
    name: cleanLocationText(location.name),
    address: cleanLocationText(location.address),
  };
}
