import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BudgetTracker, type Expense } from "@/components/admin/budget-tracker";
import { DEFAULT_CURRENCY, isCurrency } from "@/lib/currency";

export const instant = false;

export default async function BudgetPage() {
  await connection();
  const supabase = await createClient();
  const [{ data }, { data: settings }] = await Promise.all([
    supabase.from("expenses").select("*").order("created_at", { ascending: false }),
    supabase.from("event_settings").select("budget_currency").eq("id", 1).maybeSingle(),
  ]);

  const expenses: Expense[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    item_name: String(r.item_name),
    category: String(r.category),
    total_cost: Number(r.total_cost),
    amount_paid: Number(r.amount_paid),
    notes: typeof r.notes === "string" ? r.notes : null,
  }));

  const rawCurrency = (settings as { budget_currency?: unknown } | null)?.budget_currency;
  const currency = isCurrency(rawCurrency) ? rawCurrency : DEFAULT_CURRENCY;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-4xl">Buget</h1>
      <BudgetTracker expenses={expenses} initialCurrency={currency} />
    </main>
  );
}
