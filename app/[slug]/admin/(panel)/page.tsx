"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { useAdminData } from "@/components/admin/admin-data";
import { useAdminIsSandbox, useAdminPath } from "@/components/admin/admin-tenant";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import type { GuestRow } from "@/components/admin/guest-list";
import { Button } from "@/components/ui/button";

// The table (and its delete dialog) is only downloaded by the admin panel, and
// only when this section is actually opened.
const GuestList = dynamic(
  () => import("@/components/admin/guest-list").then((mod) => mod.GuestList),
  { loading: () => <AdminSectionSkeleton /> },
);

function GuestListWithFeedback({ rows }: { rows: GuestRow[] }) {
  const params = useSearchParams();
  return (
    <GuestList
      rows={rows}
      edited={params.get("edited") ?? undefined}
      error={params.get("error") ?? undefined}
    />
  );
}

function Dashboard() {
  const { data, error, refresh } = useAdminData();
  const adminPath = useAdminPath();
  const isSandbox = useAdminIsSandbox();
  if (!data) {
    return (
      <>
        <AdminSectionSkeleton />
        {error && (
          <div className="mx-auto max-w-5xl px-6 pb-12">
            <p role="alert" className="rounded-lg bg-red-600/10 p-4 text-red-800">
              {error}{" "}
              <button type="button" className="underline" onClick={() => void refresh()}>
                Reîncearcă
              </button>
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">Lista invitaților</h1>
        <div className="flex gap-3">
          {!isSandbox && (
            <Button asChild variant="outline"><a href={adminPath("/export")}>Export CSV</a></Button>
          )}
          <form action={signOut}><Button variant="ghost">Ieși din cont</Button></form>
        </div>
      </div>

      <Suspense fallback={<AdminSectionSkeleton />}>
        <GuestListWithFeedback rows={data.rsvps} />
      </Suspense>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
