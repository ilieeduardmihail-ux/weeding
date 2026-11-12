import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getBaseTenantContext } from "@/lib/tenant-session";

// Old /admin/<section> links (bookmarks, messages already sent to clients) keep
// working: they are forwarded to the same section of the account's own panel.
export const instant = false;

export default async function LegacyAdminRedirect({
  params,
}: {
  params: Promise<{ rest: string[] }>;
}) {
  await connection();
  const { rest } = await params;
  const { tenants, isOwner } = await getBaseTenantContext();

  const first = tenants[0];
  if (!first) redirect(isOwner ? "/platform" : "/");

  const tail = (rest ?? []).map((part) => encodeURIComponent(part)).join("/");
  redirect(`/${first.slug}/admin${tail ? `/${tail}` : ""}`);
}
