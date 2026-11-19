import { connection } from "next/server";
import { isOwnerRequest, platformIsConfigured } from "@/lib/platform";
import { loadLeads } from "@/lib/platform-data";

const esc = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const date = (value: string | null) =>
  value ? new Date(value).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" }) : "";

/**
 * The lead list as a spreadsheet, for calling people offline. Owner only, and
 * always built from the live rows — a download must never be a stale snapshot.
 */
export async function GET() {
  await connection();
  if (!(await isOwnerRequest())) return new Response("Neautorizat", { status: 401 });
  if (!platformIsConfigured()) return new Response("Neconfigurat", { status: 503 });

  const leads = await loadLeads(1000);

  const lines = [
    "nume,email,creat,confirmat,acord_oferta,ultima_vizita,stare,adresa,expira,nota,arhivat",
  ];
  for (const lead of leads) {
    const state = lead.archivedAt
      ? "arhivat"
      : lead.sandboxTenantId
        ? lead.isSandbox
          ? "demo"
          : "client"
        : "expirat";
    lines.push(
      [
        lead.name ?? "",
        lead.email,
        date(lead.createdAt),
        date(lead.verifiedAt),
        lead.marketingAt ? "da" : "nu",
        date(lead.lastSeenAt),
        state,
        lead.sandboxSlug ? `/${lead.sandboxSlug}` : "",
        date(lead.expiresAt),
        lead.note ?? "",
        lead.archivedAt ? "da" : "nu",
      ]
        .map(esc)
        .join(",")
    );
  }

  return new Response(`\uFEFF${lines.join("\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lead-uri.csv"',
      "Cache-Control": "no-store",
    },
  });
}
