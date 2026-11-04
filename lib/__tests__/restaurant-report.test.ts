import { describe, expect, it } from "vitest";
import {
  buildRestaurantReport,
  menuTypeFor,
  restaurantCsv,
  type VenueRow,
} from "../restaurant-report";

const row = (over: Partial<VenueRow>): VenueRow => ({
  kind: "rsvp",
  name: "Nume",
  is_child: false,
  table_number: null,
  counted: true,
  ...over,
});

describe("restaurant report", () => {
  it("maps children to the Copii menu and everyone else to Standard", () => {
    expect(menuTypeFor(true)).toBe("Copii");
    expect(menuTypeFor(false)).toBe("Standard");
  });

  it("keeps only counted people and sorts them alphabetically", () => {
    const report = buildRestaurantReport([
      row({ name: "Popescu Ana", table_number: 2 }),
      row({ name: "Ionescu Maria", table_number: 1, is_child: true }),
      row({ name: "Georgescu Vlad", table_number: null, counted: false }),
      row({ name: "  Andrei   Pop ", table_number: 3 }),
    ]);

    expect(report.people.map((person) => person.name)).toEqual([
      "Andrei Pop",
      "Ionescu Maria",
      "Popescu Ana",
    ]);
    expect(report.people.find((person) => person.name === "Ionescu Maria")?.menu).toBe("Copii");
    expect(report.total).toBe(3);
    expect(report.seated).toBe(3);
    expect(report.tables).toBe(3);
  });

  it("counts menus, including the ones with no people", () => {
    const report = buildRestaurantReport([
      row({ name: "Adult 1", table_number: 1 }),
      row({ name: "Adult 2", table_number: 1 }),
      row({ name: "Copil 1", table_number: 2, is_child: true }),
    ]);

    expect(report.menuTotals).toEqual([
      { menu: "Standard", count: 2 },
      { menu: "Copii", count: 1 },
    ]);

    const empty = buildRestaurantReport([]);
    expect(empty.menuTotals).toEqual([
      { menu: "Standard", count: 0 },
      { menu: "Copii", count: 0 },
    ]);
    expect(empty.total).toBe(0);
  });

  it("exports a CSV with the alphabetical list and the menu totals", () => {
    const report = buildRestaurantReport([
      row({ name: "Popescu Ana", table_number: 2 }),
      row({ name: "Copil, Mic", table_number: 2, is_child: true }),
    ]);
    const csv = restaurantCsv(report);
    const lines = csv.split("\r\n");

    expect(lines[0]).toBe("Nume,Masa,Meniu");
    expect(lines[1]).toBe('"Copil, Mic","2","Copii"');
    expect(lines[2]).toBe('"Popescu Ana","2","Standard"');
    expect(csv).toContain("Meniu,Persoane");
    expect(csv).toContain('"Standard","1"');
    expect(csv).toContain('"Total","2"');
  });

  it("leaves the table empty for unseated people", () => {
    const report = buildRestaurantReport([row({ name: "Fara Masa", table_number: null })]);
    expect(restaurantCsv(report)).toContain('"Fara Masa","","Standard"');
  });
});
