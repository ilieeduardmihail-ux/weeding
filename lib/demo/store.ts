/**
 * DEMO MODE — in-memory data for previewing the site without Supabase.
 * Mirrors the tables/functions from schema.sql + migrations v2..v5.
 * State lives in the Node process, so it resets when the dev server restarts.
 */
import { DEFAULT_EVENT_SETTINGS, type EventSettings } from "@/lib/event-settings";

export type DemoGuest = {
  id: string;
  name: string;
  is_child: boolean;
  table_number: number | null;
};

export type DemoRsvp = {
  id: string;
  name: string;
  attending: boolean;
  message: string | null;
  created_at: string;
  table_number: number | null;
  rsvp_guests: DemoGuest[];
};

export type DemoImportedGuest = {
  id: string;
  full_name: string;
  is_child: boolean;
  table_number: number | null;
};

export type DemoExpense = {
  id: string;
  item_name: string;
  category: string;
  currency: "RON" | "EUR";
  total_cost: number;
  amount_paid: number;
  notes: string | null;
  created_at: string;
};

export type DemoLocation = {
  key: "church" | "venue";
  label: string;
  name: string;
  address: string;
  event_time: string;
  embed_url: string | null;
};

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

/** Case, extra spaces and diacritics are ignored — same rule as migration v4. */
export function nameKey(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const state = {
  rsvps: [
    {
      id: uuid(1),
      name: "Ana Ionescu",
      attending: true,
      message: "Can't wait! We'll be there for the ceremony and the party.",
      created_at: daysAgo(9),
      table_number: 1,
      rsvp_guests: [
        { id: uuid(101), name: "Dan Ionescu", is_child: false, table_number: 1 },
        { id: uuid(102), name: "Mara Ionescu", is_child: true, table_number: 1 },
      ],
    },
    {
      id: uuid(2),
      name: "Elena Popescu",
      attending: true,
      message: "Wonderful news — see you in June.",
      created_at: daysAgo(7),
      table_number: 2,
      rsvp_guests: [{ id: uuid(103), name: "Radu Popescu", is_child: false, table_number: 2 }],
    },
    {
      id: uuid(3),
      name: "Mihai Dumitrescu",
      attending: false,
      message: "So sorry, we'll be travelling that week. Congratulations!",
      created_at: daysAgo(5),
      table_number: null,
      rsvp_guests: [],
    },
    {
      id: uuid(4),
      name: "Ioana Munteanu",
      attending: true,
      message: null,
      created_at: daysAgo(3),
      table_number: null,
      rsvp_guests: [
        { id: uuid(104), name: "Vlad Munteanu", is_child: false, table_number: null },
        { id: uuid(105), name: "Sofia Munteanu", is_child: true, table_number: null },
        { id: uuid(106), name: "Tudor Munteanu", is_child: true, table_number: null },
      ],
    },
    {
      id: uuid(5),
      name: "Cristian Stan",
      attending: true,
      message: "Count me in for the party!",
      created_at: daysAgo(1),
      table_number: 2,
      rsvp_guests: [],
    },
  ] as DemoRsvp[],

  guests: [
    { id: uuid(201), full_name: "Alexandru Georgescu", is_child: false, table_number: 2 },
    { id: uuid(202), full_name: "Bianca Radu", is_child: false, table_number: null },
    { id: uuid(203), full_name: "Cătălin Marin", is_child: false, table_number: 3 },
    { id: uuid(204), full_name: "Diana Voicu", is_child: false, table_number: null },
  ] as DemoImportedGuest[],

  expenses: [
    {
      id: uuid(301),
      item_name: "Venue deposit",
      category: "Venue",
      currency: "RON",
      total_cost: 4500,
      amount_paid: 1500,
      notes: "Second instalment due in April",
      created_at: daysAgo(20),
    },
    {
      id: uuid(302),
      item_name: "Catering (110 guests)",
      category: "Catering",
      currency: "RON",
      total_cost: 8250,
      amount_paid: 8250,
      notes: null,
      created_at: daysAgo(18),
    },
    {
      id: uuid(303),
      item_name: "Photographer + album",
      category: "Photo & video",
      currency: "EUR",
      total_cost: 1800,
      amount_paid: 600,
      notes: null,
      created_at: daysAgo(14),
    },
    {
      id: uuid(304),
      item_name: "Floral centrepieces",
      category: "Flowers & decor",
      currency: "EUR",
      total_cost: 950,
      amount_paid: 0,
      notes: "Quote approved, invoice pending",
      created_at: daysAgo(6),
    },
    {
      id: uuid(305),
      item_name: "Band",
      category: "Music",
      currency: "RON",
      total_cost: 1200,
      amount_paid: 300,
      notes: null,
      created_at: daysAgo(2),
    },
  ] as DemoExpense[],

  eventSettings: { ...DEFAULT_EVENT_SETTINGS } as EventSettings,

  seatingTables: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, capacity: 10 })),

  locations: [
    {
      key: "church",
      label: "Biserică",
      name: "Biserica Sfântul Nicolae",
      address: "Strada Exemplu 12, București",
      event_time: "16:00",
      embed_url: null,
    },
    {
      key: "venue",
      label: "Local",
      name: "Restaurant Grădina Verde",
      address: "Șoseaua Exemplu 45, București",
      event_time: "19:30",
      embed_url: null,
    },
  ] as DemoLocation[],
};

let counter = 1000;
const nextId = () => uuid(counter++);

/* ------------------------------------------------------------------ reads */

export function listRsvps(orderBy: { column: string; ascending: boolean } = { column: "created_at", ascending: false }) {
  const rows = [...state.rsvps];
  const { column, ascending } = orderBy;
  rows.sort((a, b) => {
    const av = (a as Record<string, unknown>)[column];
    const bv = (b as Record<string, unknown>)[column];
    if (av === bv) return 0;
    const cmp = String(av) < String(bv) ? -1 : 1;
    return ascending ? cmp : -cmp;
  });
  return rows.map((r) => ({ ...r, rsvp_guests: r.rsvp_guests.map((g) => ({ ...g })) }));
}

export function listExpenses() {
  return [...state.expenses].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function listSeating() {
  const rows = [
    ...state.rsvps.map((r) => ({ id: r.id, kind: "rsvp", name: r.name, table_number: r.table_number })),
    ...state.rsvps.flatMap((r) =>
      r.rsvp_guests.map((g) => ({ id: g.id, kind: "plus", name: g.name, table_number: g.table_number }))
    ),
    ...state.guests.map((g) => ({ id: g.id, kind: "guest", name: g.full_name, table_number: g.table_number })),
  ];
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export function listGuestNames() {
  return state.guests.map((g) => ({ full_name: g.full_name }));
}

/* ----------------------------------------------------------------- rsvp API */

export type DemoStatus = {
  name: string;
  attending: boolean;
  table_number: number | null;
  booked_by: string | null;
  party: { name: string; table_number: number | null }[];
};

function statusOf(r: DemoRsvp): DemoStatus {
  const party = r.attending
    ? [...r.rsvp_guests]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((g) => ({ name: g.name, table_number: g.table_number }))
    : [];
  return {
    name: r.name,
    attending: r.attending,
    table_number: r.attending ? r.table_number : null,
    booked_by: null,
    party,
  };
}

export function checkRsvpStatus(rawName: string): DemoStatus | null {
  const key = nameKey(rawName);
  const own = state.rsvps.find((r) => nameKey(r.name) === key);
  if (own) return statusOf(own);

  // Someone added as a plus-one by another guest
  for (const r of state.rsvps) {
    const g = r.rsvp_guests.find((x) => nameKey(x.name) === key);
    if (!g) continue;
    return {
      name: g.name,
      attending: r.attending,
      table_number: g.table_number,
      booked_by: r.name,
      party: [],
    };
  }
  return null;
}

export function submitRsvp(input: {
  name: string;
  attending: boolean;
  message: string;
  guests: { name: string; isChild?: boolean; is_child?: boolean }[];
}) {
  const key = nameKey(input.name);
  const existing = state.rsvps.find((r) => nameKey(r.name) === key);

  // Keep the seats assigned before the edit, like the SQL function does.
  const previous = new Map<string, number | null>();
  if (existing) {
    previous.set(nameKey(existing.name), existing.table_number);
    existing.rsvp_guests.forEach((g) => previous.set(nameKey(g.name), g.table_number));
  }

  const guests: DemoGuest[] = input.attending
    ? input.guests.map((g) => ({
        id: nextId(),
        name: g.name,
        is_child: Boolean(g.isChild ?? g.is_child ?? false),
        table_number: previous.get(nameKey(g.name)) ?? null,
      }))
    : [];

  if (existing) {
    existing.attending = input.attending;
    existing.message = input.message || null;
    existing.created_at = new Date().toISOString();
    existing.rsvp_guests = guests;
    existing.table_number = input.attending ? previous.get(key) ?? existing.table_number : null;
    return existing.id;
  }

  const row: DemoRsvp = {
    id: nextId(),
    name: input.name,
    attending: input.attending,
    message: input.message || null,
    created_at: new Date().toISOString(),
    table_number: null,
    rsvp_guests: guests,
  };
  state.rsvps.push(row);
  return row.id;
}

/** Mirrors migration-v7 `admin_update_rsvp`: edits a reply and its party, keeping assigned seats. */
export function adminUpdateRsvp(input: {
  id: string;
  name: string;
  attending: boolean;
  message: string;
  guests: { id?: string | null; name: string; isChild?: boolean; is_child?: boolean }[];
}) {
  const row = state.rsvps.find((r) => r.id === input.id);
  if (!row) return { error: { message: "not found" } };

  const seats = new Map(row.rsvp_guests.map((g) => [g.id, g.table_number]));

  row.name = input.name.trim().replace(/\s+/g, " ");
  row.attending = input.attending;
  row.message = input.message.trim() === "" ? null : input.message;
  row.rsvp_guests = input.attending
    ? input.guests.map((g) => {
        const id = g.id || nextId();
        return {
          id,
          name: g.name.trim().replace(/\s+/g, " "),
          is_child: Boolean(g.isChild ?? g.is_child ?? false),
          table_number: seats.get(id) ?? null,
        };
      })
    : [];

  return { error: null };
}

export function deleteRsvp(id: string) {
  state.rsvps = state.rsvps.filter((r) => r.id !== id);
}

/* ------------------------------------------------------------ admin tables */

export function insertExpense(row: Omit<DemoExpense, "id" | "created_at"> & { id?: string }) {
  const expense: DemoExpense = { ...row, id: row.id ?? nextId(), created_at: new Date().toISOString() };
  state.expenses.push(expense);
  return expense;
}

export function addPayment(id: string, amount: number) {
  const e = state.expenses.find((x) => x.id === id);
  if (!e) return { error: { message: "not found" } };
  if (e.amount_paid + amount > e.total_cost + 0.001) {
    return { error: { message: "paid_not_above_total" } };
  }
  e.amount_paid = Math.round((e.amount_paid + amount) * 100) / 100;
  return { error: null };
}

export function deleteExpense(id: string) {
  state.expenses = state.expenses.filter((x) => x.id !== id);
}

export function importGuests(names: string[]) {
  let inserted = 0;
  for (const full_name of names) {
    if (state.guests.some((g) => nameKey(g.full_name) === nameKey(full_name))) continue;
    state.guests.push({ id: nextId(), full_name, is_child: false, table_number: null });
    inserted += 1;
  }
  return inserted;
}

export function deleteImportedGuest(id: string) {
  state.guests = state.guests.filter((g) => g.id !== id);
}

/** Mirrors `seating_tables`: add/remove tables and change their capacity. */
export function listSeatingTables() {
  return [...state.seatingTables].sort((a, b) => a.number - b.number);
}

export function addSeatingTable(number: number | null, capacity: number) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 30) {
    return { error: { message: "bad capacity" }, number: null };
  }

  let target = number;
  if (target === null) {
    for (let n = 1; n <= 99; n += 1) {
      if (!state.seatingTables.some((t) => t.number === n)) { target = n; break; }
    }
    if (target === null) return { error: { message: "no numbers left" }, number: null };
  }
  if (!Number.isInteger(target) || target < 1 || target > 99) {
    return { error: { message: "bad number" }, number: null };
  }
  if (state.seatingTables.some((t) => t.number === target)) {
    return { error: { message: "table exists" }, number: null };
  }

  state.seatingTables.push({ number: target, capacity });
  return { error: null, number: target };
}

export function deleteSeatingTable(number: number) {
  if (!state.seatingTables.some((t) => t.number === number)) {
    return { error: { message: "table missing" } };
  }
  state.rsvps.forEach((r) => { if (r.table_number === number) r.table_number = null; });
  state.rsvps.forEach((r) => {
    r.rsvp_guests.forEach((g) => { if (g.table_number === number) g.table_number = null; });
  });
  state.guests.forEach((g) => { if (g.table_number === number) g.table_number = null; });
  state.seatingTables = state.seatingTables.filter((t) => t.number !== number);
  return { error: null };
}

export function setTableCapacity(number: number, capacity: number) {
  const table = state.seatingTables.find((t) => t.number === number);
  if (!table) return { error: { message: "table missing" } };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 30) {
    return { error: { message: "bad capacity" } };
  }
  const used = listSeating().filter((p) => p.table_number === number).length;
  if (used > capacity) return { error: { message: "table occupied" } };
  table.capacity = capacity;
  return { error: null };
}

export function assignTable(kind: string, id: string, table: number | null) {
  const people = listSeating();
  if (table !== null) {
    const target = state.seatingTables.find((t) => t.number === table);
    if (!target) return { error: { message: "table missing" } };
    const taken = people.filter((p) => p.id !== id && p.table_number === table).length;
    if (taken >= target.capacity) return { error: { message: "table full" } };
  }
  if (kind === "rsvp") {
    const r = state.rsvps.find((x) => x.id === id);
    if (!r) return { error: { message: "not found" } };
    r.table_number = table;
  } else if (kind === "plus") {
    for (const r of state.rsvps) {
      const g = r.rsvp_guests.find((x) => x.id === id);
      if (g) g.table_number = table;
    }
  } else {
    const g = state.guests.find((x) => x.id === id);
    if (!g) return { error: { message: "not found" } };
    g.table_number = table;
  }
  return { error: null };
}

/** Mirrors migration-v9 `unassign_table`: back to the "Fără masă" pool. */
export function unassignTable(kind: string, id: string) {
  return assignTable(kind, id, null);
}

/* --------------------------------------------------------- event settings */

export function getEventSettings(): EventSettings {
  return { ...state.eventSettings };
}

export function updateEventSettings(patch: Partial<EventSettings>): EventSettings {
  state.eventSettings = { ...state.eventSettings, ...patch };
  return { ...state.eventSettings };
}

/* ------------------------------------------------------------- locations */

export function listLocations(): DemoLocation[] {
  return [...state.locations].sort((a, b) => a.key.localeCompare(b.key));
}

export function upsertLocation(row: DemoLocation): DemoLocation {
  const index = state.locations.findIndex((item) => item.key === row.key);
  if (index >= 0) state.locations[index] = { ...row };
  else state.locations.push({ ...row });
  return { ...row };
}

/* --------------------------------------------------- v5 read-only features */

/** Mirrors event_settings.seating_published: null means "not published yet". */
export function publicSeating(): { table: number; capacity: number; names: string[] }[] | null {
  if (!state.eventSettings.seating_published) return null;

  const byTable = new Map<number, string[]>();
  for (const person of listSeating()) {
    if (person.table_number === null) continue;
    const names = byTable.get(person.table_number) ?? [];
    names.push(person.name);
    byTable.set(person.table_number, names);
  }
  return listSeatingTables().map(({ number, capacity }) => ({
    table: number,
    capacity,
    names: (byTable.get(number) ?? []).sort((a, b) => a.localeCompare(b)),
  }));
}

export type VenueReportRow = {
  kind: "rsvp" | "plus" | "guest";
  name: string;
  is_child: boolean;
  table_number: number | null;
  counted: boolean;
};

/** Mirrors the `venue_report` view from migration v5. */
export function venueReport(): VenueReportRow[] {
  const rows: VenueReportRow[] = [];

  for (const rsvp of state.rsvps) {
    if (!rsvp.attending) continue;
    rows.push({
      kind: "rsvp",
      name: rsvp.name,
      is_child: false,
      table_number: rsvp.table_number,
      counted: true,
    });
    for (const guest of rsvp.rsvp_guests) {
      rows.push({
        kind: "plus",
        name: guest.name,
        is_child: guest.is_child,
        table_number: guest.table_number,
        counted: true,
      });
    }
  }

  for (const guest of state.guests) {
    rows.push({
      kind: "guest",
      name: guest.full_name,
      is_child: guest.is_child,
      table_number: guest.table_number,
      counted: guest.table_number !== null,
    });
  }

  return rows;
}
