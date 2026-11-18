import { z } from "zod";
import { CATEGORIES } from "./admin-config";
import { CURRENCIES } from "./currency";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const parseMoney = (s: string) => Number(s.trim().replace(",", "."));

export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;

const expenseFields = z.object({
  item_name: z.string().trim().min(1, "Introdu numele cheltuielii").max(120),
  category: z.enum(CATEGORIES),
  currency: z.enum(CURRENCIES),
  total_cost: z.number().min(0, "Introdu costul total").max(1_000_000_000),
  amount_paid: z.number().min(0, "Introdu o sumă validă"),
  /** Restul de plată scadent înainte de nuntă. */
  due_before: z.number().min(0, "Introdu o sumă validă").max(1_000_000_000).default(0),
  /** Restul de plată scadent în ziua nunții sau după. */
  due_after: z.number().min(0, "Introdu o sumă validă").max(1_000_000_000).default(0),
  notes: z.string().trim().max(500).optional(),
});

/** Paid + the two remaining stages can never exceed the total. */
const checkStages = (v: {
  total_cost: number;
  amount_paid: number;
  due_before: number;
  due_after: number;
}) =>
  round2(v.due_before + v.due_after) <= round2(v.total_cost - v.amount_paid) + 0.01;

export const expenseSchema = expenseFields
  .refine((v) => v.amount_paid <= v.total_cost, {
    message: "Suma plătită nu poate depăși costul total",
    path: ["amount_paid"],
  })
  .refine(checkStages, {
    message: "Restul împărțit depășește suma rămasă de plătit",
    path: ["due_before"],
  });
export type ExpenseInput = z.infer<typeof expenseSchema>;

export const paymentSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive("Introdu o sumă mai mare decât 0").max(1_000_000_000),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const expenseUpdateSchema = expenseFields
  .extend({ id: z.string().uuid() })
  .refine((v) => v.amount_paid <= v.total_cost, {
    message: "Suma plătită nu poate depăși costul total",
    path: ["amount_paid"],
  })
  .refine(checkStages, {
    message: "Restul împărțit depășește suma rămasă de plătit",
    path: ["due_before"],
  });
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
