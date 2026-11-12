import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOwnerRequest, platformIsConfigured } from "@/lib/platform";
import { loadInvoices, loadPlatformOverview } from "@/lib/platform-data";
import { EMPTY_ISSUER } from "@/lib/platform-types";
import { InvoicesPanel, type InvoiceClient } from "./panel";

export const instant = false;

export const metadata: Metadata = {
  title: "Facturi",
  robots: { index: false, follow: false },
};

export default async function InvoicesPage() {
  // Owner-only and live: never a build-time snapshot.
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!(await isOwnerRequest())) redirect("/platform/login");

  const configured = platformIsConfigured();
  const [invoiceData, overview] = configured
    ? await Promise.all([loadInvoices(), loadPlatformOverview()])
    : [
        { invoices: [], issuer: EMPTY_ISSUER },
        { tenants: [], owners: [] },
      ];

  // A wedding's first admin is usually also its owner account, which is not
  // what belongs on an invoice. Prefer the first admin that is not one of this
  // platform's owners; the form still lets the address be edited or cleared.
  const ownerEmails = new Set(overview.owners.map((email) => email.trim().toLowerCase()));

  const clients: InvoiceClient[] = overview.tenants.map((tenant) => {
    const admins = tenant.admins.map((admin) => admin.email);
    const clientAdmin = admins.find((email) => !ownerEmails.has(email.trim().toLowerCase()));
    return {
      id: tenant.id,
      slug: tenant.slug,
      displayName: tenant.displayName,
      email: clientAdmin ?? null,
    };
  });

  return (
    <InvoicesPanel
      invoices={invoiceData.invoices}
      issuer={invoiceData.issuer}
      clients={clients}
      today={new Date().toISOString().slice(0, 10)}
      configured={configured}
      ownerEmail={data?.user?.email ?? ""}
    />
  );
}
