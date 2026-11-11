import { getDefaultEventSettings } from "@/lib/public-data";
import { ogAlt, ogContentType, ogSize, weddingOgImage } from "@/lib/og";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

/** Link preview for the wedding served at the root of the domain. */
export default async function OpengraphImage() {
  const settings = await getDefaultEventSettings();
  return weddingOgImage(settings);
}
