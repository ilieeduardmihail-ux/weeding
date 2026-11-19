"use client";

import { createContext, useContext } from "react";

/**
 * The slug of the wedding whose panel is open, shared with every admin
 * component so links and requests are built for the right client.
 */
const AdminTenantContext = createContext<string | null>(null);

/**
 * Whether the open panel is a visitor's demo copy. A sandbox has no public
 * page and none of the product's outputs, so components hide what they cannot
 * do instead of letting the request fail on the server.
 */
const AdminSandboxContext = createContext(false);

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

export function useAdminIsSandbox(): boolean {
  return useContext(AdminSandboxContext);
}

export function AdminTenantProvider({
  slug,
  isSandbox = false,
  children,
}: {
  slug: string;
  isSandbox?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AdminTenantContext.Provider value={slug}>
      <AdminSandboxContext.Provider value={isSandbox}>{children}</AdminSandboxContext.Provider>
    </AdminTenantContext.Provider>
  );
}
