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
  /** Already on the report view after migration v32. */
  allergies?: string | null;
  phone?: string | null;
  group_name?: string | null;
};

/** Menu types are derived from the guest data we already have. */
export type MenuType = "Standard" | "Copii";
export const MENU_TYPES: readonly MenuType[] = ["Standard", "Copii"];

export const menuTypeFor = (isChild: boolean): MenuType => (isChild ? "Copii" : "Standard");

export type RestaurantPerson = {
  name: string;
  table: number | null;
  menu: MenuType;
  /** Free text the guest wrote about allergies, if any. */
  allergies: string | null;
  phone: string | null;
  group: string | null;
};

export type MenuTotal = { menu: MenuType; count: number };

/** One row per table, for the "Mese" sheet the venue keeps at the door. */
export type TableTotal = {
  table: number;
  people: number;
  adults: number;
  children: number;
  capacity: number | null;
};

export type RestaurantReport = {
  people: RestaurantPerson[];
  menuTotals: MenuTotal[];
  tableTotals: TableTotal[];
  total: number;
  seated: number;
  tables: number;
};

const byName = (a: RestaurantPerson, b: RestaurantPerson) =>
  a.name.localeCompare(b.name, "ro", { sensitivity: "base" });

const clean = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

export function buildRestaurantReport(
  rows: readonly VenueRow[],
  allergiesByName?: ReadonlyMap<string, string | null>,
  capacities?: ReadonlyMap<number, number>,
): RestaurantReport {
  const people = rows
    .filter((row) => row.counted)
    .map((row) => {
      const name = row.name.replace(/\s+/g, " ").trim();
      const allergies = clean(row.allergies) || allergiesByName?.get(name.toLocaleLowerCase("ro"))?.trim() || null;
      return {
        name,
        table: row.table_number,
        menu: menuTypeFor(row.is_child),
        allergies,
        phone: clean(row.phone) || null,
        group: clean(row.group_name) || null,
      };
    })
    .sort(byName);

  const counts = new Map<MenuType, number>(MENU_TYPES.map((menu) => [menu, 0]));
  for (const person of people) {
    counts.set(person.menu, (counts.get(person.menu) ?? 0) + 1);
  }

  const byTable = new Map<number, TableTotal>();
  for (const person of people) {
    if (person.table === null) continue;
    const row = byTable.get(person.table) ?? {
      table: person.table,
      people: 0,
      adults: 0,
      children: 0,
      capacity: capacities?.get(person.table) ?? null,
    };
    row.people += 1;
    if (person.menu === "Copii") row.children += 1;
    else row.adults += 1;
    byTable.set(person.table, row);
  }

  return {
    people,
    menuTotals: MENU_TYPES.map((menu) => ({ menu, count: counts.get(menu) ?? 0 })),
    tableTotals: [...byTable.values()].sort((a, b) => a.table - b.table),
    total: people.length,
    seated: people.filter((person) => person.table !== null).length,
    tables: byTable.size,
  };
}

const cell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/** CSV is the lightweight fallback; Excel gets the richer three-sheet file. */
export function restaurantCsv(report: RestaurantReport): string {
  const lines = ["Nume,Masa,Meniu,Alergii,Telefon,Grup"];
  for (const person of report.people) {
    lines.push(
      [person.name, person.table ?? "", person.menu, person.allergies ?? "", person.phone ?? "", person.group ?? ""]
        .map(cell)
        .join(","),
    );
  }
  lines.push("");
  lines.push("Meniu,Persoane");
  for (const total of report.menuTotals) {
    lines.push([total.menu, total.count].map(cell).join(","));
  }
  lines.push(["Total", report.total].map(cell).join(","));
  return lines.join("\r\n");
}
