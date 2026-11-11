import type { Metadata } from "next";
import { formatEventDate, type EventSettings } from "./event-settings";

/**
 * Open Graph / Twitter metadata for one wedding. The invitation photo is used as
 * the preview when the couple uploaded one; otherwise the generated card wins.
 */
export function weddingMetadata(settings: EventSettings, slug?: string): Metadata {
  const date = formatEventDate(settings);
  const title = `${settings.partner_1} & ${settings.partner_2}: ${date}`;
  const description = `Vă așteptăm în ${settings.city}, pe ${date}.`;
  const photoPath = slug ? `/${slug}/invitatia-poza` : "/invitatia-poza";
  const photo = settings.invitation_image_url ? photoPath : undefined;

  return {
    title,
    description,
    alternates: { canonical: slug ? `/${slug}` : "/" },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ro_RO",
      ...(photo
        ? { images: [{ url: photo, alt: `Invitația ${settings.partner_1} & ${settings.partner_2}` }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(photo ? { images: [photo] } : {}),
    },
  };
}
