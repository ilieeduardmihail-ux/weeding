import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getBaseTenantContext } from "@/lib/tenant-session";

// Sign-in lands here, then moves on to the signed-in account's own panel. This
// is what stops a client from ever opening another client's wedding.
export const instant = false;

export default async function AdminResolver() {
  await connection();
  const { email, tenants, isOwner } = await getBaseTenantContext();

  if (!email) redirect("/admin/login");

  const first = tenants[0];
  if (first) redirect(`/${first.slug}/admin`);

  // Signed in but with no wedding of their own (platform owner): send them to
  // the place they can actually use instead of looping back to the login.
  redirect(isOwner ? "/platform" : "/");
}
