import { connection } from "next/server";
import { getEventSettings } from "@/lib/public-data";

/**
 * Same-origin copy of the uploaded invitation photo.
 *
 * It is used as the Open Graph image (so WhatsApp shows the invitation as the
 * preview of the RSVP link) and by the admin share button (so the browser can
 * fetch the file without CORS issues). In demo mode the photo is stored as a
 * data URL, which is decoded here.
 */
export async function GET() {
  // Read the link per request, so replacing the photo is visible immediately.
  await connection();
  const { invitation_image_url: url } = await getEventSettings();
  if (!url) return new Response("Lipsește poza invitației.", { status: 404 });

  if (url.startsWith("data:image/")) {
    const comma = url.indexOf(",");
    if (comma === -1) return new Response("Poză invalidă.", { status: 404 });
    const type = url.slice(5, comma).split(";")[0] || "image/jpeg";
    const base64 = url.slice(comma + 1);
    return new Response(Buffer.from(base64, "base64"), {
      headers: { "Content-Type": type, "Cache-Control": "no-store" },
    });
  }

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok || !response.body) {
      return new Response("Poza nu a putut fi încărcată.", { status: 502 });
    }
    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return new Response("Poza nu a putut fi încărcată.", { status: 502 });
  }
}
