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

  const clients: InvoiceClient[] = overview.tenants.map((tenant) => ({
    id: tenant.id,
    slug: tenant.slug,
    displayName: tenant.displayName,
    email: tenant.admins[0]?.email ?? null,
  }));

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
