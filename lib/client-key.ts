import { headers } from "next/headers";
import { createHash } from "node:crypto";

/** Anonymous, salted hash of the visitor's IP, used only for rate limiting. */
export async function clientKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip + (process.env.RATE_LIMIT_SALT ?? "")).digest("hex");
}
