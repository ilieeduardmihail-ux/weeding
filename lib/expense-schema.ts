import { z } from "zod";
import { CATEGORIES } from "./admin-config";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const parseMoney = (s: string) => Number(s.trim().replace(",", "."));

export const expenseSchema = z
  .object({
    item_name: z.string().trim().min(1, "Enter an item name").max(120),
    category: z.enum(CATEGORIES),
    total_cost: z.number().min(0, "Enter the total cost").max(1_000_000_000),
    amount_paid: z.number().min(0, "Enter a valid amount"),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.amount_paid <= v.total_cost, {
    message: "Paid can’t exceed the total cost",
    path: ["amount_paid"],
  });
export type ExpenseInput = z.infer<typeof expenseSchema>;

export const paymentSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive("Enter an amount above 0").max(1_000_000_000),
});
export type PaymentInput = z.infer<typeof paymentSchema>;
