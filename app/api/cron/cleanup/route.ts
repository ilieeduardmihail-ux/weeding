import { connection, NextResponse } from "next/server";
import { purgeExpiredSandboxes } from "@/lib/demo/sandbox";
import { purgeExpiredMailLog, purgeExpiredOffers } from "@/lib/platform-data";
import { serviceClient } from "@/lib/platform";

/**
 * The daily cleanup the legal pages promise: demo copies and their accounts,
 * demo leads, RSVPs six months after the wedding, anonymous visits, the mail
 * log and offer correspondence. Vercel calls it once a day (see vercel.json);
 * everything it does is idempotent, so a repeated call is harmless.
 *
 * `CRON_SECRET` is required in production: without it anyone could trigger a
 * full-table cleanup. Locally, `npm run dev` can call it without a secret.
 */

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Runs one of the v35 SQL helpers and returns how many rows it removed. */
async function purgeWith(name: string): Promise<number> {
  try {
    const { data, error } = await serviceClient().rpc(name);
    if (error) {
      console.error(`[cron] ${name} failed`, error);
      return 0;
    }
    return typeof data === "number" ? data : 0;
  } catch (error) {
    console.error(`[cron] ${name} crashed`, error);
    return 0;
  }
}

export async function GET(request: Request) {
  await connection();

  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sandboxes = await purgeExpiredSandboxes();
  const rsvps = await purgeWith("purge_expired_rsvps");
  const visits = await purgeWith("purge_expired_visits");

  await purgeExpiredMailLog();
  await purgeExpiredOffers();

  return NextResponse.json(
    { ok: true, at: new Date().toISOString(), sandboxes, rsvps, visits },
    { headers: { "Cache-Control": "no-store" } },
  );
}
