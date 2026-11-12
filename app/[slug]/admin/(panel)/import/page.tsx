"use client";

import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { GuestImport } from "@/components/admin/guest-import";

export default function ImportPage() {
  const { data } = useAdminData();
  if (!data) return <AdminSectionSkeleton />;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-4xl">Importă invitați</h1>
      <GuestImport existing={data.guestNames} />
    </main>
  );
}
