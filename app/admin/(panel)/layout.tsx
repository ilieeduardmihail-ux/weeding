import { Suspense } from "react";
import { AdminDataProvider } from "@/components/admin/admin-data";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
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
    </AdminDataProvider>
  );
}
