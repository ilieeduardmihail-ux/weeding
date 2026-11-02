"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/admin", "Invitați"],
  ["/admin/seating", "Mese"],
  ["/admin/locations", "Locații"],
  ["/admin/report", "Raport"],
  ["/admin/budget", "Buget"],
  ["/admin/import", "Import"],
  ["/admin/settings", "Setări"],
] as const;

export function AdminNav() {
  const path = usePathname();
  if (path === "/admin/login") return null;
  return (
    <nav aria-label="Admin" className="border-b border-ink/15">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 py-2">
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            className={`shrink-0 rounded-md px-3 py-2 text-sm transition ${
              path === href ? "bg-ink text-sea" : "hover:bg-ink/10"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
