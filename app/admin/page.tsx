import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { demoMode } from "@/lib/demo/mode";
import { getBaseTenantContext } from "@/lib/tenant-session";

// Sign-in lands here, then moves on to the signed-in account's own panel. This
// is what stops a client from ever opening another client's wedding.
export const instant = false;

/**
 * The last stop before the public site: an account that has no wedding can
 * still be a demo visitor whose 7-day sandbox was cleaned up. Sending them to
 * the invitation would look like a logout, so they get the account form back,
 * with the explanation already written there.
 */
async function isDemoLead(): Promise<boolean> {
  if (demoMode) return false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("is_lead");
    return data === true;
  } catch {
    return false;
  }
}

export default async function AdminResolver() {
  await connection();
  const { email, tenants, isOwner } = await getBaseTenantContext();

  if (!email) redirect("/admin/login");

  const first = tenants[0];
  if (first) redirect(`/${first.slug}/admin`);

  // Signed in but with no wedding of their own (platform owner): send them to
  // the place they can actually use instead of looping back to the login.
  if (isOwner) redirect("/platform");
  if (await isDemoLead()) redirect("/demo/cont?expirat=1");

  redirect("/");
}
