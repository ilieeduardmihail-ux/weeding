"use client";

import { createContext, useContext } from "react";

/**
 * The slug of the wedding whose panel is open, shared with every admin
 * component so links and requests are built for the right client.
 */
const AdminTenantContext = createContext<string | null>(null);

export function useAdminSlug(): string {
  const slug = useContext(AdminTenantContext);
  if (!slug) throw new Error("useAdminSlug must be used inside AdminTenantProvider");
  return slug;
}

/** Builds a URL inside the current wedding's panel, e.g. /ana-si-stefan/admin/messages. */
export function useAdminPath() {
  const slug = useAdminSlug();
  return (path = "") => `/${slug}/admin${path}`;
}

export function AdminTenantProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  return <AdminTenantContext.Provider value={slug}>{children}</AdminTenantContext.Provider>;
}
