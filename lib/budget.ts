import { CURRENCIES, type Currency } from "@/lib/currency";
import { round2 } from "@/lib/expense-schema";

/**
 * How much of the budget is already paid and how much is still due in each
 * stage. `amount_paid` is the advance; `due_before` and `due_after` split the
 * rest. Rows created before migration v31 have no split, so their remaining
 * money shows up as `unassigned` instead of being silently counted twice.
 */
export type StageTotals = {
  currency: Currency;
  count: number;
  total: number;
  paid: number;
  before: number;
  after: number;
  left: number;
  unassigned: number;
};

type StageExpense = {
  currency: Currency;
  total_cost: number;
  amount_paid: number;
  due_before?: number;
  due_after?: number;
};

export function stageTotals(expenses: readonly StageExpense[]): StageTotals[] {
  return CURRENCIES.map((currency) => {
    const list = expenses.filter((expense) => expense.currency === currency);
    const total = round2(list.reduce((sum, expense) => sum + expense.total_cost, 0));
    const paid = round2(list.reduce((sum, expense) => sum + expense.amount_paid, 0));
    const before = round2(list.reduce((sum, expense) => sum + (expense.due_before ?? 0), 0));
    const after = round2(list.reduce((sum, expense) => sum + (expense.due_after ?? 0), 0));
    const left = round2(total - paid);
    return {
      currency,
      count: list.length,
      total,
      paid,
      before,
      after,
      left,
      unassigned: Math.max(0, round2(left - before - after)),
    };
  }).filter((row) => row.count > 0);
}
