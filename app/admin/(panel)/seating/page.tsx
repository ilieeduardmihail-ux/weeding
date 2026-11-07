"use client";

import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { SeatingBoard } from "@/components/admin/seating-board";
import { AdminRealtime } from "@/components/admin/admin-realtime";

export default function SeatingPage() {
  const { data } = useAdminData();
  if (!data) return <AdminSectionSkeleton />;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-4xl">Așezare la mese</h1>
      <AdminRealtime />
      <SeatingBoard initial={data.seatingPeople} initialTables={data.seatingTables} />
    </main>
  );
}
