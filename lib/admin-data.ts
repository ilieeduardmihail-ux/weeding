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

export type AdminData = {
  rsvps: GuestRow[];
  seatingPeople: Person[];
  seatingTables: SeatingTable[];
  expenses: Expense[];
  locations: WeddingLocation[];
  settings: EventSettings;
  /** Names already in the imported-guests list, used to detect duplicates. */
  guestNames: string[];
  /** Imported guests with their contact details, used by /admin/messages. */
  importedGuests: { id: string; name: string; phone: string | null }[];
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
