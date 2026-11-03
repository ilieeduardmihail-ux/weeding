import { beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENCIES, formatMoney, isCurrency, moneyFormatter } from "../currency";

beforeEach(() => {
  vi.resetModules();
});

async function freshStore() {
  return import("../demo/store");
}

describe("budget currency", () => {
  it("accepts only RON and EUR", () => {
    expect(CURRENCIES).toEqual(["RON", "EUR"]);
    expect(isCurrency("RON")).toBe(true);
    expect(isCurrency("EUR")).toBe(true);
    expect(isCurrency("USD")).toBe(false);
    expect(isCurrency(null)).toBe(false);
  });

  it("formats numbers with the chosen currency, without converting them", () => {
    const ron = formatMoney(1500, "RON");
    const eur = formatMoney(1500, "EUR");

    expect(ron).not.toBe(eur);
    expect(moneyFormatter("RON").formatToParts(1500).find((p) => p.type === "currency")?.value).toBe("RON");
    expect(moneyFormatter("EUR").formatToParts(1500).find((p) => p.type === "currency")?.value).toBe("EUR");
  });
});

describe("demo seating tables", () => {
  it("starts from the old layout: ten tables with ten seats", async () => {
    const store = await freshStore();
    const tables = store.listSeatingTables();
    expect(tables).toHaveLength(10);
    expect(tables.every((t) => t.capacity === 10)).toBe(true);
    expect(tables.map((t) => t.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("adds a table with its own capacity", async () => {
    const store = await freshStore();
    const added = store.addSeatingTable(null, 6);
    expect(added.error).toBeNull();
    expect(added.number).toBe(11);
    expect(store.listSeatingTables().find((t) => t.number === 11)?.capacity).toBe(6);
  });

  it("rejects a duplicate table number", async () => {
    const store = await freshStore();
    expect(store.addSeatingTable(3, 10).error?.message).toBe("table exists");
  });

  it("enforces each table's real capacity", async () => {
    const store = await freshStore();
    store.addSeatingTable(20, 1);
    const guest = store.listSeating().find((p) => p.kind === "guest" && p.table_number === null)!;
    expect(store.assignTable(guest.kind, guest.id, 20).error).toBeNull();
    const other = store.listSeating().find((p) => p.kind === "guest" && p.table_number === null && p.id !== guest.id)!;
    expect(store.assignTable(other.kind, other.id, 20).error?.message).toBe("table full");
  });

  it("releases everyone when a table is deleted", async () => {
    const store = await freshStore();
    store.updateEventSettings({ seating_published: true });
    const seatedAtTwo = store.listSeating().filter((p) => p.table_number === 2);
    expect(seatedAtTwo.length).toBeGreaterThan(0);

    expect(store.deleteSeatingTable(2).error).toBeNull();
    expect(store.listSeating().filter((p) => p.table_number === 2)).toEqual([]);
    expect(store.listSeatingTables().some((t) => t.number === 2)).toBe(false);
    expect(store.publicSeating()?.some((t) => t.table === 2)).toBe(false);
  });

  it("never shrinks a table below the people already seated", async () => {
    const store = await freshStore();
    const used = store.listSeating().filter((p) => p.table_number === 1).length;
    expect(store.setTableCapacity(1, 1).error?.message).toBe("table occupied");
    expect(store.setTableCapacity(1, used).error).toBeNull();
    expect(store.setTableCapacity(1, used + 1).error).toBeNull();
  });

  it("publishes every table with capacity and names", async () => {
    const store = await freshStore();
    store.updateEventSettings({ seating_published: true });
    const published = store.publicSeating();
    expect(published).not.toBeNull();
    expect(published).toHaveLength(10);
    expect(published?.every((t) => typeof t.capacity === "number")).toBe(true);
    expect(published?.find((t) => t.table === 2)?.names).toContain("Elena Popescu");
  });

  it("keeps the plan private until published", async () => {
    const store = await freshStore();
    expect(store.publicSeating()).toBeNull();
  });
});
