/**
 * Server-side loader for the admin dataset. Every table is read in parallel,
 * so the whole admin panel costs one round trip instead of one per section.
 */
import type { Kind, Person } from "@/components/admin/seating-board";
import type { GuestRow } from "@/components/admin/guest-list";
import type { Expense } from "@/components/admin/budget-tracker";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY, isCurrency } from "@/lib/currency";
import { normalizeSettings } from "@/lib/event-settings";
import { cleanLocation } from "@/lib/location-text";
import type { AdminData } from "@/lib/admin-data";
import { LOCATION_FALLBACK } from "@/lib/admin-data";
import { DEFAULT_TABLE_CAPACITY } from "@/lib/seating";
import type { WeddingLocation } from "@/lib/config";
import type { VenueRow } from "@/lib/restaurant-report";

type Db = Awaited<ReturnType<typeof createClient>>;

const defaultTables = () =>
  Array.from({ length: 10 }, (_, i) => ({ number: i + 1, capacity: DEFAULT_TABLE_CAPACITY }));

export async function loadAdminData(supabase: Db): Promise<AdminData> {
  const [rsvpsResult, peopleResult, tablesResult, expensesResult, locationsResult, settingsResult, guestsResult, reportResult] =
    await Promise.all([
      supabase.from("rsvps").select("*, rsvp_guests(*)").order("created_at", { ascending: false }),
      supabase.from("seating_people").select("id, kind, name, table_number").order("name"),
      supabase.from("seating_tables").select("number, capacity").order("number"),
      supabase.from("expenses").select("*").order("created_at", { ascending: false }),
      supabase.from("locations").select("key, label, name, address, event_time, embed_url").order("key", { ascending: true }),
      supabase.from("event_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("guests").select("full_name"),
      supabase.from("venue_report").select("*"),
    ]);

  const people: Person[] = (peopleResult.data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    kind: row.kind as Kind,
    name: row.name as string,
    table: (row.table_number as number | null) ?? null,
  }));

  // Before migration v8 the table does not exist yet: keep the fixed layout.
  const seatingTables = tablesResult.error
    ? defaultTables()
    : (tablesResult.data ?? []).map((row: Record<string, unknown>) => ({
        number: Number(row.number),
        capacity: Number(row.capacity),
      }));

  const expenses: Expense[] = (expensesResult.data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    item_name: String(row.item_name),
    category: String(row.category),
    currency: isCurrency(row.currency) ? row.currency : DEFAULT_CURRENCY,
    total_cost: Number(row.total_cost),
    amount_paid: Number(row.amount_paid),
    notes: typeof row.notes === "string" ? row.notes : null,
  }));

  const locationRows = ((locationsResult.data ?? []) as WeddingLocation[]).map(
    (row) => cleanLocation(row) as WeddingLocation
  );
  const locations = (["church", "venue"] as const).map(
    (key) => locationRows.find((row) => row.key === key) ?? LOCATION_FALLBACK.find((row) => row.key === key)!
  );

  const report: VenueRow[] = (reportResult.data ?? []).map((row: Record<string, unknown>) => ({
    kind: row.kind as VenueRow["kind"],
    name: String(row.name),
    is_child: row.is_child === true,
    table_number: row.table_number === null ? null : Number(row.table_number),
    counted: row.counted === true,
  }));

  return {
    rsvps: (rsvpsResult.data ?? []) as GuestRow[],
    seatingPeople: people,
    seatingTables,
    expenses,
    locations,
    settings: normalizeSettings(settingsResult.data as Record<string, unknown> | null),
    guestNames: (guestsResult.data ?? []).map((guest: Record<string, unknown>) => String(guest.full_name)),
    report,
  };
}
