"use client";

import { useAdminData } from "@/components/admin/admin-data";
import { useAdminIsSandbox } from "@/components/admin/admin-tenant";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { SandboxLock } from "@/components/admin/sandbox-lock";
import dynamic from "next/dynamic";

const GuestImport = dynamic(
  () => import("@/components/admin/guest-import").then((mod) => mod.GuestImport),
  { loading: () => <AdminSectionSkeleton /> },
);

export default function ImportPage() {
  const isSandbox = useAdminIsSandbox();
  const { data } = useAdminData();
  if (!data) return <AdminSectionSkeleton />;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-4xl">Importă invitați</h1>
      {isSandbox ? <SandboxLock feature="import" /> : <GuestImport existing={data.guestNames} />}
    </main>
  );
}
