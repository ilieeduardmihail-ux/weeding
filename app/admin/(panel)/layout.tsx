import { Suspense } from "react";
import { AdminDataProvider } from "@/components/admin/admin-data";
import { AdminNav } from "@/components/admin/admin-nav";
import { PasswordChangeNotice } from "@/components/admin/password-change-notice";
import { createClient } from "@/lib/supabase/server";

// The layout reads the session to know whether to show the first-login notice.
// Admin pages are per-user anyway, so let them render dynamically.
export const instant = false;

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  // Accounts created with a generated password carry this flag until the owner
  // sets a password of their own through the emailed link.
  const needsPassword = data.user?.user_metadata?.must_change_password === true;

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
