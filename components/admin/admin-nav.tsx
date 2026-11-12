"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminPath } from "@/components/admin/admin-tenant";

const links = [
  ["", "Invitați"],
  ["/confirmari", "Confirmări"],
  ["/seating", "Mese"],
  ["/messages", "Mesaje"],
  ["/locations", "Locații"],
  ["/report", "Raport"],
  ["/restaurant", "Restaurant"],
  ["/budget", "Buget"],
  ["/import", "Import"],
  ["/theme", "Temă"],
  ["/settings", "Setări"],
] as const;

export function AdminNav() {
  const path = usePathname();
  const adminPath = useAdminPath();
  if (path.endsWith("/admin/login")) return null;
  return (
    <nav aria-label="Admin" className="glass-bar sticky top-0 z-40 border-b border-ink/15">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 py-2">
        {links.map(([suffix, label]) => {
          const href = adminPath(suffix);
          return (
            <Link
              key={suffix || "home"}
              href={href}
              // Default (viewport) prefetch: sections still render from the
              // router cache on click, but opening the panel no longer fires an
              // eager request for all eleven links at once.
              aria-current={path === href ? "page" : undefined}
              className={`shrink-0 rounded-md px-3 py-2 text-sm transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                path === href ? "bg-ink text-sea shadow-md shadow-black/20" : "hover:bg-ink/10"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
