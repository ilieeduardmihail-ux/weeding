import { describe, expect, it } from "vitest";
import { stageTotals } from "../budget";

const expense = (over: Partial<Parameters<typeof stageTotals>[0][number]>) => ({
  currency: "RON" as const,
  total_cost: 0,
  amount_paid: 0,
  due_before: 0,
  due_after: 0,
  ...over,
});

describe("budget stages", () => {
  it("splits the remaining money into advance, before and after", () => {
    const [ron] = stageTotals([
      expense({ total_cost: 10000, amount_paid: 3000, due_before: 4000, due_after: 3000 }),
      expense({ total_cost: 5000, amount_paid: 1000, due_before: 2000, due_after: 2000 }),
    ]);

    expect(ron).toMatchObject({
      currency: "RON",
      count: 2,
      total: 15000,
      paid: 4000,
      before: 6000,
      after: 5000,
      left: 11000,
      unassigned: 0,
    });
  });

  it("keeps each currency separate", () => {
    const rows = stageTotals([
      expense({ total_cost: 1000, amount_paid: 500, due_before: 500 }),
      expense({ currency: "EUR", total_cost: 2000, amount_paid: 0, due_after: 2000 }),
    ]);

    expect(rows.map((row) => row.currency)).toEqual(["RON", "EUR"]);
    expect(rows[1]).toMatchObject({ total: 2000, left: 2000, after: 2000, before: 0 });
  });

  it("reports money that was never split between stages", () => {
    const [ron] = stageTotals([expense({ total_cost: 5000, amount_paid: 1000 })]);
    expect(ron?.left).toBe(4000);
    expect(ron?.unassigned).toBe(4000);
  });

  it("returns nothing for an empty list", () => {
    expect(stageTotals([])).toEqual([]);
  });
});
