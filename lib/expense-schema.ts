import { z } from "zod";
import { CATEGORIES } from "./admin-config";
import { CURRENCIES } from "./currency";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const parseMoney = (s: string) => Number(s.trim().replace(",", "."));

export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;

export const expenseSchema = z
  .object({
    item_name: z.string().trim().min(1, "Introdu numele cheltuielii").max(120),
    category: z.enum(CATEGORIES),
    currency: z.enum(CURRENCIES),
    total_cost: z.number().min(0, "Introdu costul total").max(1_000_000_000),
    amount_paid: z.number().min(0, "Introdu o sumă validă"),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.amount_paid <= v.total_cost, {
    message: "Suma plătită nu poate depăși costul total",
    path: ["amount_paid"],
  });
export type ExpenseInput = z.infer<typeof expenseSchema>;

export const paymentSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive("Introdu o sumă mai mare decât 0").max(1_000_000_000),
});
export type PaymentInput = z.infer<typeof paymentSchema>;
