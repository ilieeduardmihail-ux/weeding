"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminBasePath, currentTenantId } from "@/lib/tenant-session";
import {
  categorySchema,
  expenseSchema,
  paymentSchema,
  round2,
  type ExpenseInput,
  type PaymentInput,
} from "@/lib/expense-schema";

type Result = { ok: true } | { ok: false; error: string };

/**
 * The client generates the id so its optimistic row can be reconciled with the
 * server row without waiting for a round trip.
 */
export async function addExpense(input: ExpenseInput, id?: string): Promise<Result> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifică formularul." };
  const d = parsed.data;
  const rowId = id && z.string().uuid().safeParse(id).success ? id : undefined;
  const supabase = await createClient();
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };
  const { error } = await supabase.from("expenses").insert({
    ...(rowId ? { id: rowId } : {}),
    tenant_id: tenantId,
    item_name: d.item_name,
    category: d.category,
    currency: d.currency,
    total_cost: round2(d.total_cost),
    amount_paid: round2(d.amount_paid),
    notes: d.notes || null,
  });
  if (error) return { ok: false, error: "Nu am putut salva cheltuiala. Rulează migrarea v9 în Supabase." };
  revalidatePath(await adminBasePath(), "layout");
  return { ok: true };
}

/** Adds to amount_paid in one atomic SQL update. The total cost is never changed. */
export async function addPayment(input: PaymentInput): Promise<Result> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Plată invalidă." };
  const supabase = await createClient();
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };
  const { error } = await supabase.rpc("add_payment", { p_id: parsed.data.id, p_amount: round2(parsed.data.amount), p_tenant: tenantId });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("paid_not_above_total") ? "Suma depășește restul de plătit." : "Nu am putut salva plata.",
    };
  }
  revalidatePath(await adminBasePath(), "layout");
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<Result> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Cerere invalidă." };
  const supabase = await createClient();
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };
  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return { ok: false, error: "Nu am putut șterge cheltuiala." };
  revalidatePath(await adminBasePath(), "layout");
  return { ok: true };
}

/**
 * Changes only the category. Called after the row has already been updated
 * optimistically, so the request never blocks the UI.
 */
export async function updateExpenseCategory(id: string, category: string): Promise<Result> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Cerere invalidă." };
  const parsed = categorySchema.safeParse(category);
  if (!parsed.success) return { ok: false, error: "Categorie invalidă." };

  const supabase = await createClient();
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou în admin." };
  const { error } = await supabase.from("expenses").update({ category: parsed.data }).eq("id", id).eq("tenant_id", tenantId);
  if (error) return { ok: false, error: "Nu am putut salva categoria." };
  revalidatePath(await adminBasePath(), "layout");
  return { ok: true };
}
