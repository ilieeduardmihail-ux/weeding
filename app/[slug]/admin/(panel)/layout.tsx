import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { AdminDataProvider } from "@/components/admin/admin-data";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminTenantProvider } from "@/components/admin/admin-tenant";
import { PasswordChangeNotice } from "@/components/admin/password-change-notice";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/admin/actions";
import { getTenantContextForSlug } from "@/lib/tenant-session";
import { tenantIsAvailable } from "@/lib/tenants";

// The layout reads the session to know whether to show the first-login notice.
// Admin pages are per-user anyway, so let them render dynamically.
export const instant = false;

export default async function AdminPanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // The panel is per-user and reads live data: never a build-time snapshot.
  await connection();

  const { slug } = await params;
  const { email, needsPassword, tenant } = await getTenantContextForSlug(slug);

  // Signed out: to this wedding's login. Signed in but not a member: to a panel
  // they may actually use (the /admin resolver picks one).
  if (!email) redirect(`/${slug}/admin/login`);
  if (!tenant) redirect("/admin");

  // A wedding whose access ran out (or was suspended) keeps its files but loses
  // the panel: the couple lands on a clear explainer instead of broken pages.
  if (!tenantIsAvailable(tenant)) redirect(`/${slug}/admin/expired`);

  return (
    <AdminTenantProvider slug={slug}>
      <AdminDataProvider>
        <header className="glass-bar border-b border-ink/15">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="min-w-0">
              <p className="truncate font-display text-lg">{tenant.display_name}</p>
              <Link
                href={`/${tenant.slug}`}
                target="_blank"
                className="text-xs text-ink/60 underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
              >
                /{tenant.slug}
              </Link>
            </div>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut aria-hidden="true" /> Schimbă cont
              </Button>
            </form>
          </div>
        </header>
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
    </AdminTenantProvider>
  );
}
