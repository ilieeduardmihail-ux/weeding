"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addExpense, addPayment, deleteExpense } from "@/app/admin/budget/actions";
import { CATEGORIES, CURRENCY } from "@/lib/admin-config";
import { expenseSchema, parseMoney, round2 } from "@/lib/expense-schema";

export type Expense = {
  id: string; item_name: string; category: string; total_cost: number; amount_paid: number; notes: string | null;
};

const fmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 2 });
const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

// Top-level component: creating it inside the form would reset it on every render.
function Err({ errs, k }: { errs: Record<string, string>; k: string }) {
  return errs[k] ? <p className="text-sm text-red-700">{errs[k]}</p> : null;
}

function PaymentDialog({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (expense && !d.open) { setAmount(""); setErr(null); d.showModal(); }
    if (!expense && d.open) d.close();
  }, [expense]);

  const remaining = expense ? round2(expense.total_cost - expense.amount_paid) : 0;
  const value = parseMoney(amount);
  const valid = Number.isFinite(value) && value > 0 && value <= remaining;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;
    if (!valid) { setErr(`Enter an amount between 0 and ${fmt.format(remaining)}.`); return; }
    start(async () => {
      const r = await addPayment({ id: expense.id, amount: round2(value) });
      if (r.ok) onClose(); else setErr(r.error);
    });
  };

  return (
    <dialog ref={ref} onClose={onClose}
      className="m-auto w-[min(92vw,26rem)] rounded-xl bg-sea p-6 text-ink backdrop:bg-black/50">
      {expense && (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <h2 className="font-display text-2xl">Add payment</h2>
          <div className="text-sm text-ink/75">
            <p className="font-medium text-ink">{expense.item_name}</p>
            <p>Total {fmt.format(expense.total_cost)}, paid {fmt.format(expense.amount_paid)}, left {fmt.format(remaining)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment">Amount ({CURRENCY})</Label>
            <div className="flex gap-2">
              <Input id="payment" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Button type="button" variant="outline" onClick={() => setAmount(String(remaining))}>Pay rest</Button>
            </div>
            {valid && <p className="text-sm text-ink/70">New paid total: {fmt.format(round2(expense.amount_paid + value))}</p>}
            {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending} className="bg-ink text-sea hover:bg-ink/85">
              {pending ? "Saving…" : "Add payment"}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}

export function BudgetTracker({ expenses }: { expenses: Expense[] }) {
  const blank = { item: "", cat: CATEGORIES[0] as string, total: "", paid: "", notes: "" };
  const [f, setF] = useState(blank);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [paying, setPaying] = useState<Expense | null>(null);
  const [pending, start] = useTransition();

  const total = expenses.reduce((s, e) => s + e.total_cost, 0);
  const paid = expenses.reduce((s, e) => s + e.amount_paid, 0);
  const left = round2(total - paid);
  const set = (k: keyof typeof blank, v: string) => setF((s) => ({ ...s, [k]: v }));

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseMoney(f.total);
    const p = f.paid === "" ? 0 : parseMoney(f.paid);
    const er: Record<string, string> = {};
    if (!Number.isFinite(t)) er.total_cost = "Enter the total cost";
    if (!Number.isFinite(p)) er.amount_paid = "Enter a valid amount";
    const parsed = expenseSchema.safeParse({
      item_name: f.item, category: f.cat, total_cost: t, amount_paid: p, notes: f.notes || undefined,
    });
    if (!parsed.success) parsed.error.issues.forEach((i) => { er[String(i.path[0])] ??= i.message; });
    setErrs(er);
    if (Object.keys(er).length || !parsed.success) return;
    setServerErr(null);
    start(async () => {
      const r = await addExpense(parsed.data);
      if (r.ok) setF(blank); else setServerErr(r.error);
    });
  };

  return (
    <>
      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {([["Total Budget", total], ["Total Paid", paid], ["Remaining to Pay", left]] as const).map(([l, v]) => (
          <div key={l} className="rounded-lg bg-mist/70 p-4">
            <dd className={cx("font-display text-3xl tabular-nums", l === "Remaining to Pay" && v > 0 && "text-gold")}>{fmt.format(v)}</dd>
            <dt className="text-sm text-ink/70">{l}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-3 h-2 rounded bg-ink/15" role="progressbar" aria-label="Share of the budget paid"
        aria-valuenow={Math.round(total ? (paid / total) * 100 : 0)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded bg-gold transition-all" style={{ width: `${total ? (paid / total) * 100 : 0}%` }} />
      </div>

      <form onSubmit={onAdd} noValidate className="mt-8 grid gap-4 rounded-lg border border-ink/15 p-4 sm:grid-cols-2">
        <h2 className="font-display text-2xl sm:col-span-2">Add an expense</h2>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="item">Item name</Label>
          <Input id="item" value={f.item} onChange={(e) => set("item", e.target.value)} /><Err errs={errs} k="item_name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cat">Category</Label>
          <select id="cat" value={f.cat} onChange={(e) => set("cat", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="total">Total cost ({CURRENCY})</Label>
          <Input id="total" inputMode="decimal" value={f.total} onChange={(e) => set("total", e.target.value)} /><Err errs={errs} k="total_cost" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="paid">Amount paid ({CURRENCY})</Label>
          <Input id="paid" inputMode="decimal" placeholder="0" value={f.paid} onChange={(e) => set("paid", e.target.value)} /><Err errs={errs} k="amount_paid" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        {serverErr && <p role="alert" className="text-red-700 sm:col-span-2">{serverErr}</p>}
        <Button type="submit" disabled={pending} className="bg-ink text-sea hover:bg-ink/85 sm:col-span-2">
          <Plus className="size-4" /> Add expense
        </Button>
      </form>

      {expenses.length === 0 ? (
        <p className="mt-8 text-ink/70">No expenses yet. Add your first one above.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {expenses.map((x) => {
            const rest = round2(x.total_cost - x.amount_paid);
            return (
              <li key={x.id} className="rounded-lg border border-ink/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{x.item_name}</p>
                    <p className="text-xs text-ink/60">{x.category}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className={cx("text-sm tabular-nums", rest > 0 ? "text-gold" : "text-ink/70")}>
                      {rest > 0 ? `${fmt.format(rest)} left` : "Paid in full"}
                    </span>
                    <button type="button" aria-label={`Delete ${x.item_name}`}
                      onClick={() => start(async () => { await deleteExpense(x.id); })}
                      className="rounded-md p-2 hover:bg-ink/10"><X className="size-4" /></button>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded bg-ink/15">
                  <div className="h-full rounded bg-gold" style={{ width: `${x.total_cost ? (x.amount_paid / x.total_cost) * 100 : 0}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-ink/70">
                    Paid <span className="tabular-nums">{fmt.format(x.amount_paid)}</span> of{" "}
                    <span className="tabular-nums">{fmt.format(x.total_cost)}</span>
                  </p>
                  <Button type="button" variant="outline" size="sm" disabled={rest <= 0} onClick={() => setPaying(x)}>
                    <Plus className="size-4" /> Add payment
                  </Button>
                </div>
                {x.notes && <p className="mt-1 text-sm text-ink/60">{x.notes}</p>}
              </li>
            );
          })}
        </ul>
      )}
      <PaymentDialog expense={paying} onClose={() => setPaying(null)} />
    </>
  );
}
