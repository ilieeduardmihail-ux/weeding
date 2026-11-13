import {
  alt as ogAlt,
  contentType as ogContentType,
  marketingOgImage,
  size as ogSize,
} from "@/lib/marketing-og";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

/** Link preview for the presentation page at the root of the domain. */
export default function OpengraphImage() {
  return marketingOgImage();
}
