import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentTenantId } from "@/lib/tenant-session";
import { buildRestaurantReport, restaurantCsv, type VenueRow } from "@/lib/restaurant-report";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(request: Request) {
  // Always export the current data, never a build-time snapshot.
  await connection();
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return new Response("Neautorizat", { status: 401 });

  const tenantId = await currentTenantId();
  if (!tenantId) return new Response("Neautorizat", { status: 401 });

  const { data, error } = await supabase
    .from("venue_report")
    .select("kind, name, is_child, table_number, counted")
    .eq("tenant_id", tenantId);
  if (error) return new Response("Nu am putut citi datele.", { status: 500 });

  const report = buildRestaurantReport((data ?? []) as VenueRow[]);
  const format = new URL(request.url).searchParams.get("format");

  if (format === "csv") {
    return new Response(`\uFEFF${restaurantCsv(report)}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="restaurant.csv"',
        "Cache-Control": "no-store",
      },
    });
  }

  // Loaded only when someone actually downloads the spreadsheet.
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  const people = XLSX.utils.aoa_to_sheet([
    ["Nume", "Masa", "Meniu"],
    ...report.people.map((person) => [person.name, person.table ?? "", person.menu]),
  ]);
  people["!cols"] = [{ wch: 34 }, { wch: 8 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, people, "Invitati");

  const totals = XLSX.utils.aoa_to_sheet([
    ["Meniu", "Persoane"],
    ...report.menuTotals.map((total) => [total.menu, total.count]),
    ["Total", report.total],
  ]);
  totals["!cols"] = [{ wch: 16 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, totals, "Totaluri");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_TYPE,
      "Content-Disposition": 'attachment; filename="restaurant.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
