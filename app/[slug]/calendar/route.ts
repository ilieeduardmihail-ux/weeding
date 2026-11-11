import { buildCalendarEvent } from "@/lib/calendar";
import { loadPublicPage } from "@/lib/public-page";

/** All-day calendar entry for one tenant. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const loaded = await loadPublicPage(slug);
  if (!loaded) return new Response("Invitație indisponibilă.", { status: 404 });

  const { settings, tenant } = loaded;
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://wedding-ro.vercel.app";
  const body = buildCalendarEvent({
    ...settings,
    public_url: settings.public_url ?? `${base}/${tenant.slug}`,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nunta.ics"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
