"use client";

import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { useAdminData } from "@/components/admin/admin-data";
import { useAdminPath } from "@/components/admin/admin-tenant";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { Button } from "@/components/ui/button";
import { buildRestaurantReport } from "@/lib/restaurant-report";

export default function RestaurantPage() {
  const { data } = useAdminData();
  const adminPath = useAdminPath();
  if (!data) return <AdminSectionSkeleton />;

  const report = buildRestaurantReport(data.report);
  const standard = report.menuTotals.find((total) => total.menu === "Standard")?.count ?? 0;
  const children = report.menuTotals.find((total) => total.menu === "Copii")?.count ?? 0;
  const unassigned = report.total - report.seated;

  const stats = [
    ["Persoane", report.total, "incluse în raport"],
    ["Mese folosite", report.tables, "cu cel puțin o persoană"],
    ["Meniuri standard", standard, "adulți"],
    ["Meniuri copii", children, "copii"],
  ] as const;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-4xl">Restaurant</h1>
      <p className="mt-2 text-ink/70">
        Lista finală pentru local, ordonată alfabetic, cu masa fiecărei persoane și totalul
        meniurilor. Descarcă fișierul direct din datele actuale.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="bg-ink text-sea hover:bg-ink/85">
          <a href={adminPath("/export/restaurant")}>
            <Download className="size-4" /> Descarcă Excel (.xlsx)
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={adminPath("/export/restaurant?format=csv")}>
            <FileText className="size-4" /> Descarcă CSV
          </a>
        </Button>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(([label, value, hint]) => (
          <div key={label} className="glass-soft card-hover rounded-lg p-5">
            <dd className="font-display text-4xl tabular-nums">{value}</dd>
            <dt className="text-sm text-ink/70">{label}</dt>
            <p className="mt-1 text-xs text-ink/50">{hint}</p>
          </div>
        ))}
      </dl>

      {unassigned > 0 && (
        <p className="mt-6 rounded-lg border border-gold/35 bg-gold/10 p-4 text-sm text-ink/80">
          {unassigned} {unassigned === 1 ? "persoană nu are încă masă" : "persoane nu au încă masă"}.
          Lista poate fi descărcată și așa, dar localul are nevoie de mese complete.{" "}
          <Link href={adminPath("/seating")} className="text-gold underline decoration-gold/50 underline-offset-4">
            Mergi la așezare
          </Link>
          .
        </p>
      )}

      {report.people.length === 0 ? (
        <p className="mt-12 text-ink/70">Nimic de trimis încă — nu există persoane confirmate sau invitați cu masă.</p>
      ) : (
        <div className="glass-soft mt-10 overflow-x-auto rounded-xl">
          <table className="w-full min-w-[520px] text-left">
            <thead className="border-b border-ink/20 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">Nume</th>
                <th className="px-4 py-3 font-medium">Masa</th>
                <th className="px-4 py-3 font-medium">Meniu</th>
              </tr>
            </thead>
            <tbody>
              {report.people.map((person, index) => (
                <tr
                  key={`${person.name}-${index}`}
                  className="border-b border-ink/10 transition-colors duration-200 last:border-0 hover:bg-ink/5"
                >
                  <td className="px-4 py-2">{person.name}</td>
                  <td className="px-4 py-2 tabular-nums">
                    {person.table ?? <span className="text-ink/40">—</span>}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-ink/10 px-1.5 py-0.5 text-xs font-medium text-ink/80">
                      {person.menu}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
