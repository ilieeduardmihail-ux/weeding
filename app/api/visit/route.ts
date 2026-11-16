import { createHash } from "node:crypto";
import { demoMode } from "@/lib/demo/mode";
import { serviceClient } from "@/lib/platform";
import { normalizeVisitPath } from "@/lib/visit-path";

/**
 * Records one anonymous page view.
 *
 * The row holds no IP and no cookie: only a salted hash of IP + browser, which
 * is enough to count unique visitors for a day or a week. Crawlers and social
 * previews are flagged instead of dropped, so a surprising spike can be
 * explained later.
 */
const BOT =
  /bot|crawl|spider|slurp|preview|headless|phantom|facebookexternalhit|whatsapp|telegram|slack|discord|embedly|pinterest|bing|google|yandex|baidu|lighthouse|pagespeed|curl|wget|python-requests|axios|node-fetch/i;

const WINDOW_MS = 30_000;

function noContent() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  // The demo build has no database; counting there would be meaningless.
  if (demoMode) return noContent();

  let body: { path?: unknown } | null = null;
  try {
    body = (await request.json()) as { path?: unknown };
  } catch {
    return noContent();
  }

  const target = normalizeVisitPath(body?.path);
  if (!target) return noContent();

  try {
    const supabase = serviceClient();

    let tenantId: string | null = null;
    if (target.slug) {
      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", target.slug)
        .maybeSingle();
      // /admin, /platform, /termeni also match the shape but are not weddings.
      if (!data) return noContent();
      tenantId = String(data.id);
    }

    const userAgent = request.headers.get("user-agent") ?? "";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const visitorHash = createHash("sha256")
      .update(`${ip}|${userAgent}|${process.env.RATE_LIMIT_SALT ?? ""}`)
      .digest("hex")
      .slice(0, 32);

    // A reload inside half a minute is the same visit. This is cheaper and more
    // accurate than a rate limit, which would drop a second real visitor.
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { data: recent } = await supabase
      .from("site_visits")
      .select("id")
      .eq("visitor_hash", visitorHash)
      .eq("path", target.path)
      .gte("at", since)
      .limit(1);
    if (recent?.length) return noContent();

    await supabase.from("site_visits").insert({
      path: target.path,
      tenant_id: tenantId,
      visitor_hash: visitorHash,
      is_bot: userAgent.length === 0 || BOT.test(userAgent),
    });
  } catch {
    // Analytics must never surface as a broken page.
  }

  return noContent();
}
