"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { GuestList, type GuestRow } from "@/components/admin/guest-list";
import { Button } from "@/components/ui/button";

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
  if (!data) {
    return (
      <>
        <AdminSectionSkeleton />
        {error && (
          <div className="mx-auto max-w-5xl px-6 pb-12">
            <p role="alert" className="rounded-lg bg-red-500/15 p-4 text-red-200">
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
          <Button asChild variant="outline"><a href="/admin/export">Export CSV</a></Button>
          <form action={signOut}><Button variant="ghost">Ieși din cont</Button></form>
        </div>
      </div>

      <Suspense fallback={<GuestList rows={data.rsvps} />}>
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
