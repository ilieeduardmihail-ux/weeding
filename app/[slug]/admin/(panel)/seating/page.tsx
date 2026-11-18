"use client";

import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { AdminRealtime } from "@/components/admin/admin-realtime";
import dynamic from "next/dynamic";

// The board is the heaviest admin component; only this section downloads it.
const SeatingBoard = dynamic(
  () => import("@/components/admin/seating-board").then((mod) => mod.SeatingBoard),
  { loading: () => <AdminSectionSkeleton /> },
);

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
