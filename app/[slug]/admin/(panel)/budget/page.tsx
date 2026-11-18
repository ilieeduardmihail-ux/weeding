"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { UpgradeNotice } from "@/components/admin/upgrade-notice";

// The Premium modules are only downloaded when a Premium wedding opens them.
const BudgetTracker = dynamic(
  () => import("@/components/admin/budget-tracker").then((mod) => mod.BudgetTracker),
  { loading: () => <AdminSectionSkeleton /> },
);
const FinancialPlanner = dynamic(
  () => import("@/components/admin/financial-planner").then((mod) => mod.FinancialPlanner),
  { loading: () => <AdminSectionSkeleton /> },
);
const GiftCalculator = dynamic(
  () => import("@/components/admin/gift-calculator").then((mod) => mod.GiftCalculator),
  { loading: () => <AdminSectionSkeleton /> },
);

export default function BudgetPage() {
  const { data } = useAdminData();

  const headcount = useMemo(() => {
    if (!data) return 1;
    const attending = data.rsvps.filter((row) => row.attending);
    return Math.max(1, attending.length + attending.reduce((sum, row) => sum + row.rsvp_guests.length, 0));
  }, [data]);

  if (!data) return <AdminSectionSkeleton />;

  if (data.plan !== "premium") {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <UpgradeNotice />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-4xl">Buget & furnizori</h1>
      <p className="mt-2 max-w-2xl text-ink/70">
        Fiecare furnizor, cu avansul plătit și cu restul împărțit între „înainte de nuntă” și
        „în ziua nunții”. Planificatorul și calculatorul de dar pornesc din aceleași sume.
      </p>
      <BudgetTracker expenses={data.expenses} />
      <FinancialPlanner expenses={data.expenses} eventDate={data.settings.event_date} />
      <GiftCalculator expenses={data.expenses} defaultGuests={headcount} />
    </main>
  );
}
