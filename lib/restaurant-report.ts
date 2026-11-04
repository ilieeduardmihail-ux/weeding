/**
 * Restaurant-facing report.
 *
 * The venue only needs two things: the final alphabetical list of guests with
 * their table, and how many of each menu to prepare. Imported guests count only
 * once they have been seated (that is what `venue_report.counted` encodes).
 */

export type VenueRow = {
  kind: "rsvp" | "plus" | "guest";
  name: string;
  is_child: boolean;
  table_number: number | null;
  counted: boolean;
};

/** Menu types are derived from the guest data we already have. */
export type MenuType = "Standard" | "Copii";
export const MENU_TYPES: readonly MenuType[] = ["Standard", "Copii"];

export const menuTypeFor = (isChild: boolean): MenuType => (isChild ? "Copii" : "Standard");

export type RestaurantPerson = {
  name: string;
  table: number | null;
  menu: MenuType;
};

export type MenuTotal = { menu: MenuType; count: number };

export type RestaurantReport = {
  people: RestaurantPerson[];
  menuTotals: MenuTotal[];
  total: number;
  seated: number;
  tables: number;
};

const byName = (a: RestaurantPerson, b: RestaurantPerson) =>
  a.name.localeCompare(b.name, "ro", { sensitivity: "base" });

export function buildRestaurantReport(rows: readonly VenueRow[]): RestaurantReport {
  const people = rows
    .filter((row) => row.counted)
    .map((row) => ({
      name: row.name.replace(/\s+/g, " ").trim(),
      table: row.table_number,
      menu: menuTypeFor(row.is_child),
    }))
    .sort(byName);

  const counts = new Map<MenuType, number>(MENU_TYPES.map((menu) => [menu, 0]));
  for (const person of people) {
    counts.set(person.menu, (counts.get(person.menu) ?? 0) + 1);
  }

  return {
    people,
    menuTotals: MENU_TYPES.map((menu) => ({ menu, count: counts.get(menu) ?? 0 })),
    total: people.length,
    seated: people.filter((person) => person.table !== null).length,
    tables: new Set(people.map((person) => person.table).filter((table) => table !== null)).size,
  };
}

const cell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/** CSV is the lightweight fallback; Excel gets the richer two-sheet file. */
export function restaurantCsv(report: RestaurantReport): string {
  const lines = ["Nume,Masa,Meniu"];
  for (const person of report.people) {
    lines.push([person.name, person.table ?? "", person.menu].map(cell).join(","));
  }
  lines.push("");
  lines.push("Meniu,Persoane");
  for (const total of report.menuTotals) {
    lines.push([total.menu, total.count].map(cell).join(","));
  }
  lines.push(["Total", report.total].map(cell).join(","));
  return lines.join("\r\n");
}
