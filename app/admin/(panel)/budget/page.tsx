"use client";

import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { BudgetTracker } from "@/components/admin/budget-tracker";

export default function BudgetPage() {
  const { data } = useAdminData();
  if (!data) return <AdminSectionSkeleton />;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-4xl">Buget</h1>
      <BudgetTracker expenses={data.expenses} />
    </main>
  );
}
