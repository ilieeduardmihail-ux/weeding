import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminDataProvider } from "@/components/admin/admin-data";
import { AdminNav } from "@/components/admin/admin-nav";
import { PasswordChangeNotice } from "@/components/admin/password-change-notice";
import { getTenantContext } from "@/lib/tenant-session";
import { tenantIsAvailable } from "@/lib/tenants";

// The layout reads the session to know whether to show the first-login notice.
// Admin pages are per-user anyway, so let them render dynamically.
export const instant = false;

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // The panel is per-user and reads live data: never a build-time snapshot.
  await connection();

  const { email, needsPassword, tenant } = await getTenantContext();

  // A wedding whose access ran out (or was suspended) keeps its files but loses
  // the panel: the couple lands on a clear explainer instead of broken pages.
  if (tenant && !tenantIsAvailable(tenant)) redirect("/admin/expired");

  return (
    <AdminDataProvider>
      {/* Only the active-link state needs the pathname; keeping that tiny
          boundary isolated lets the page content itself prefetch fully. */}
      <Suspense
        fallback={<div className="glass-bar sticky top-0 z-40 h-[49px] border-b border-ink/15" />}
      >
        <AdminNav />
      </Suspense>
      <div className="animate-in fade-in duration-500">{children}</div>
      {email && <PasswordChangeNotice email={email} needsPassword={needsPassword} />}
    </AdminDataProvider>
  );
}
