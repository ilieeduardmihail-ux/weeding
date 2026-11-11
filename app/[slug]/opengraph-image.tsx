import { ogAlt, ogContentType, ogSize, weddingOgImage } from "@/lib/og";
import { getDefaultEventSettings } from "@/lib/public-data";
import { loadPublicPage } from "@/lib/public-page";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

/** Link preview for one tenant. Unknown or expired tenants get a neutral card. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loaded = await loadPublicPage(slug);
  const settings = loaded?.settings ?? (await getDefaultEventSettings());
  return weddingOgImage(settings);
}
