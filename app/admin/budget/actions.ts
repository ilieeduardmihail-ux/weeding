"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema, paymentSchema, round2, type ExpenseInput, type PaymentInput } from "@/lib/expense-schema";

type Result = { ok: true } | { ok: false; error: string };

export async function addExpense(input: ExpenseInput): Promise<Result> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică formularul." };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    item_name: d.item_name,
    category: d.category,
    total_cost: round2(d.total_cost),
    amount_paid: round2(d.amount_paid),
    notes: d.notes || null,
  });
  if (error) return { ok: false, error: "Nu am putut salva cheltuiala." };
  revalidatePath("/admin/budget");
  return { ok: true };
}

/** Adds to amount_paid in one atomic SQL update. The total cost is never changed. */
export async function addPayment(input: PaymentInput): Promise<Result> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Plată invalidă." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_payment", { p_id: parsed.data.id, p_amount: round2(parsed.data.amount) });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("paid_not_above_total") ? "Suma depășește restul de plătit." : "Nu am putut salva plata.",
    };
  }
  revalidatePath("/admin/budget");
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { ok: false, error: "Nu am putut șterge cheltuiala." };
  revalidatePath("/admin/budget");
  return { ok: true };
}
