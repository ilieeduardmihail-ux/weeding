import { connection } from "next/server";
import { AdminNav } from "@/components/admin/admin-nav";

// Admin data is per-request; never prerender a snapshot of the guest list.
export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
