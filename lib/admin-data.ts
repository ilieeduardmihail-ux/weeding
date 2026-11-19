/**
 * Shape of the full admin dataset. It is loaded once from /admin/bootstrap and
 * shared by every admin section through a client provider, so switching
 * sections never waits for a new server round trip.
 */
import type { GuestRow } from "@/components/admin/guest-list";
import type { Person } from "@/components/admin/seating-board";
import type { Expense } from "@/components/admin/budget-tracker";
import type { EventSettings } from "@/lib/event-settings";
import type { SeatingTable } from "@/lib/seating";
import type { VenueRow } from "@/lib/restaurant-report";
import type { WeddingLocation } from "@/lib/config";
import type { Theme } from "@/lib/theme";
import type { TenantPlan } from "@/lib/tenants";

export type AdminData = {
  /** The tenant slug, used to build the WhatsApp RSVP links. */
  slug: string;
  /** Standard or Premium: Premium unlocks budget, vendors and the planners. */
  plan: TenantPlan;
  rsvps: GuestRow[];
  seatingPeople: Person[];
  seatingTables: SeatingTable[];
  expenses: Expense[];
  locations: WeddingLocation[];
  settings: EventSettings;
  /** Colour palette and floral decor chosen for this wedding's public site. */
  theme: Theme;
  /** Names already in the imported-guests list, used to detect duplicates. */
  guestNames: string[];
  /** Imported guests with their contact details, used by /admin/messages. */
  importedGuests: {
    id: string;
    name: string;
    phone: string | null;
    isChild: boolean;
    allergies: string | null;
    group: string | null;
  }[];
  /** `venue_report` view: confirmed RSVPs, plus-ones and seated imported guests. */
  report: VenueRow[];
};

/** Admin form fallback when a location row is still missing from the database. */
export const LOCATION_FALLBACK: WeddingLocation[] = [
  {
    key: "church",
    label: "Biserică",
    name: "",
    address: "",
    event_time: "16:00",
    embed_url: null,
  },
  {
    key: "venue",
    label: "Local",
    name: "",
    address: "",
    event_time: "19:30",
    embed_url: null,
  },
];

/** Fired by optimistic mutations so every admin section refreshes once, silently. */
export const ADMIN_DATA_EVENT = "admin-data-change";

export function notifyAdminDataChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ADMIN_DATA_EVENT));
}

/**
 * Whether a server snapshot may replace the local optimistic state.
 *
 * A request that started before the last write finished can still hold the old
 * value: applying it would flash a guest back to „Fără masă" for a moment, then
 * the next refresh would seat them again. Such snapshots are dropped; the
 * refresh queued by the successful write brings the same data a moment later.
 */
export function snapshotIsFresh(loadedAt: number, mutatedAt: number, pending: number) {
  return pending === 0 && loadedAt >= mutatedAt;
}
