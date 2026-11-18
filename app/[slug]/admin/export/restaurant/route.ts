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

  const [reportResult, allergyResult, tableResult] = await Promise.all([
    // `*` keeps the export working while the view gains columns (migration v32).
    supabase.from("venue_report").select("*").eq("tenant_id", tenantId),
    // Fallback for the family-head allergy when the view is still the old one.
    supabase.from("rsvps").select("name, allergies").eq("tenant_id", tenantId),
    supabase.from("seating_tables").select("number, capacity").eq("tenant_id", tenantId),
  ]);
  if (reportResult.error) return new Response("Nu am putut citi datele.", { status: 500 });

  const allergiesByName = new Map<string, string | null>();
  for (const row of allergyResult.data ?? []) {
    if (typeof row.name !== "string" || !row.allergies) continue;
    allergiesByName.set(row.name.replace(/\s+/g, " ").trim().toLocaleLowerCase("ro"), String(row.allergies));
  }

  const capacities = new Map<number, number>();
  for (const row of tableResult.data ?? []) {
    capacities.set(Number(row.number), Number(row.capacity));
  }

  const report = buildRestaurantReport((reportResult.data ?? []) as VenueRow[], allergiesByName, capacities);
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
    ["Nume", "Masa", "Meniu", "Alergii", "Telefon", "Grup"],
    ...report.people.map((person) => [
      person.name,
      person.table ?? "",
      person.menu,
      person.allergies ?? "",
      person.phone ?? "",
      person.group ?? "",
    ]),
  ]);
  people["!cols"] = [{ wch: 34 }, { wch: 8 }, { wch: 12 }, { wch: 40 }, { wch: 16 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, people, "Invitati");

  const tables = XLSX.utils.aoa_to_sheet([
    ["Masa", "Persoane", "Adulti", "Copii", "Locuri"],
    ...report.tableTotals.map((row) => [row.table, row.people, row.adults, row.children, row.capacity ?? ""]),
  ]);
  tables["!cols"] = [{ wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(workbook, tables, "Mese");

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
