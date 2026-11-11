"use client";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast, useToast } from "@/components/ui/toast";
import { addExpense, addPayment, deleteExpense, updateExpenseCategory } from "@/app/admin/budget/actions";
import { CATEGORIES } from "@/lib/admin-config";
import { CURRENCIES, moneyFormatter, type Currency } from "@/lib/currency";
import { expenseSchema, parseMoney, round2, type Category, type ExpenseInput } from "@/lib/expense-schema";
import { mergeById } from "@/lib/merge-by-id";
import { notifyAdminDataChanged } from "@/lib/admin-data";

export type Expense = {
  id: string;
  item_name: string;
  category: string;
  currency: Currency;
  total_cost: number;
  amount_paid: number;
  notes: string | null;
};

/** An optimistic row that has not been confirmed by the server yet. */
type LocalExpense = Expense & { pending?: boolean };

type Result = { ok: true } | { ok: false; error: string };

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

const CURRENCY_LABEL: Record<Currency, string> = {
  RON: "LEI (RON)",
  EUR: "EURO (EUR)",
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** Shown when the server action itself fails (offline, request aborted). */
const NETWORK_ERROR = "Conexiunea a eșuat. Încearcă din nou.";

/** Content comparison used to keep unchanged rows when the server refreshes. */
const sameExpense = (a: Expense, b: Expense) =>
  a.item_name === b.item_name &&
  a.category === b.category &&
  a.currency === b.currency &&
  a.total_cost === b.total_cost &&
  a.amount_paid === b.amount_paid &&
  a.notes === b.notes;

// Top-level component: creating it inside the form would reset it on every render.
function Err({ errs, k }: { errs: Record<string, string>; k: string }) {
  return errs[k] ? <p className="text-sm text-red-700">{errs[k]}</p> : null;
}

/** A GPU-friendly progress bar: scaleX instead of animating width. */
function Progress({ ratio, label, now, max }: { ratio: number; label: string; now: number; max: number }) {
  const scale = Math.max(0, Math.min(1, ratio));
  return (
    <div className="mt-3 h-2 overflow-hidden rounded bg-ink/15" role="progressbar"
      aria-label={label} aria-valuenow={now} aria-valuemin={0} aria-valuemax={max}>
      <div
        className="h-full w-full origin-left rounded bg-gold transition-transform duration-500 ease-out"
        style={{ transform: `scaleX(${scale})` }}
      />
    </div>
  );
}

const Totals = memo(function Totals({
  totals,
}: {
  totals: { currency: Currency; count: number; total: number; paid: number; left: number }[];
}) {
  return (
    <>
      {totals.map(({ currency, count, total, paid, left }) => {
        const fmt = moneyFormatter(currency);
        return (
          <section key={currency} className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl">{currency}</h2>
              <span className="text-sm text-ink/55">{count} {count === 1 ? "cheltuială" : "cheltuieli"}</span>
            </div>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              {([["Buget total", total], ["Total plătit", paid], ["Rămas de plătit", left]] as const).map(([l, v]) => (
                <div key={l} className="glass-soft card-hover rounded-lg p-4">
                  <dd className={cx("font-display text-3xl tabular-nums", l === "Rămas de plătit" && v > 0 && "text-gold")}>{fmt.format(v)}</dd>
                  <dt className="text-sm text-ink/70">{l}</dt>
                </div>
              ))}
            </dl>
            <Progress
              ratio={total ? paid / total : 0}
              label={`Procentul din bugetul în ${currency} plătit`}
              now={Math.round(total ? (paid / total) * 100 : 0)}
              max={100}
            />
          </section>
        );
      })}
    </>
  );
});

const ExpenseRow = memo(function ExpenseRow({
  x,
  onDelete,
  onPay,
  onCategoryChange,
}: {
  x: LocalExpense;
  onDelete: (id: string) => void;
  onPay: (expense: Expense) => void;
  onCategoryChange: (expense: Expense, category: Category) => void;
}) {
  const fmt = moneyFormatter(x.currency);
  const rest = round2(x.total_cost - x.amount_paid);
  // Keep legacy rows that used an old category label readable instead of
  // silently showing the first option of the new list.
  const knownCategory = (CATEGORIES as readonly string[]).includes(x.category);
  return (
    <motion.li
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cx("glass-soft card-hover rounded-lg p-4", x.pending && "opacity-80")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{x.item_name}</p>
          <p className="flex items-center gap-1 text-xs text-ink/60">
            <select
              aria-label={`Categoria pentru ${x.item_name}`}
              title="Schimbă categoria"
              value={x.category}
              onChange={(e) => onCategoryChange(x, e.target.value as Category)}
              className="cursor-pointer appearance-none rounded bg-transparent py-0.5 text-xs text-ink/60 transition-colors duration-150 hover:text-ink focus:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/50"
            >
              {!knownCategory && (
                <option value={x.category} className="bg-sea text-ink">
                  {x.category}
                </option>
              )}
              {CATEGORIES.map((category) => (
                <option key={category} value={category} className="bg-sea text-ink">
                  {category}
                </option>
              ))}
            </select>
            · <span className="rounded bg-ink/10 px-1.5 py-0.5 font-medium text-ink/80">{x.currency}</span>
            {x.pending && <span className="ml-2 text-ink/40">se salvează…</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={cx("text-sm tabular-nums", rest > 0 ? "text-gold" : "text-ink/70")}>
            {rest > 0 ? `${fmt.format(rest)} rămași` : "Plătit integral"}
          </span>
          <button type="button" aria-label={`Șterge ${x.item_name}`}
            onClick={() => onDelete(x.id)}
            className="rounded-md p-2 transition-[background-color,transform] duration-200 ease-out hover:-translate-y-px hover:bg-ink/10 active:translate-y-0"><X className="size-4" /></button>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-ink/15">
        <div
          className="h-full w-full origin-left rounded bg-gold transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${x.total_cost ? Math.min(1, x.amount_paid / x.total_cost) : 0})` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink/70">
          Plătit <span className="tabular-nums">{fmt.format(x.amount_paid)}</span> din{" "}
          <span className="tabular-nums">{fmt.format(x.total_cost)}</span>
        </p>
        <Button type="button" variant="outline" size="sm" disabled={rest <= 0} onClick={() => onPay(x)}>
          <Plus className="size-4" /> Adaugă plată
        </Button>
      </div>
      {x.notes && <p className="mt-1 text-sm text-ink/60">{x.notes}</p>}
    </motion.li>
  );
});

const ExpenseList = memo(function ExpenseList({
  items,
  empty,
  onDelete,
  onPay,
  onCategoryChange,
}: {
  items: LocalExpense[];
  empty?: string;
  onDelete: (id: string) => void;
  onPay: (expense: Expense) => void;
  onCategoryChange: (expense: Expense, category: Category) => void;
}) {
  if (items.length === 0) {
    return <p className="mt-8 text-ink/70">{empty ?? "Nu există cheltuieli încă. Adaugă prima mai sus."}</p>;
  }

  return (
    <ul className="mt-8 space-y-3">
      {items.map((x) => (
        <ExpenseRow
          key={x.id}
          x={x}
          onDelete={onDelete}
          onPay={onPay}
          onCategoryChange={onCategoryChange}
        />
      ))}
    </ul>
  );
});

type CategoryTab = { value: string; label: string; count: number };

/** Purely local category filter: clicking a tab never touches the server. */
const CategoryTabs = memo(function CategoryTabs({
  tabs,
  total,
  active,
  onSelect,
}: {
  tabs: CategoryTab[];
  total: number;
  active: string | null;
  onSelect: (value: string | null) => void;
}) {
  return (
    <div
      className="mt-8 flex flex-wrap items-center gap-1"
      role="group"
      aria-label="Filtrează cheltuielile după categorie"
    >
      <button
        type="button"
        aria-pressed={active === null}
        onClick={() => onSelect(null)}
        className={cx(
          "rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ease-out",
          active === null
            ? "bg-ink text-sea shadow-md shadow-black/20"
            : "text-ink/70 hover:bg-ink/10 hover:text-ink",
        )}
      >
        Toate <span className="ml-1 text-xs tabular-nums opacity-60">{total}</span>
      </button>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-pressed={active === tab.value}
          onClick={() => onSelect(tab.value)}
          className={cx(
            "rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ease-out",
            active === tab.value
              ? "bg-ink text-sea shadow-md shadow-black/20"
              : "text-ink/70 hover:bg-ink/10 hover:text-ink",
          )}
        >
          {tab.label} <span className="ml-1 text-xs tabular-nums opacity-60">{tab.count}</span>
        </button>
      ))}
    </div>
  );
});

const blankForm = {
  item: "",
  cat: CATEGORIES[0] as string,
  currency: "RON" as Currency,
  total: "",
  paid: "",
  notes: "",
};

type FormState = typeof blankForm;

const ExpenseForm = memo(function ExpenseForm({
  onBeginAdd,
  onFinishAdd,
  onError,
}: {
  onBeginAdd: (data: ExpenseInput, id: string) => void;
  onFinishAdd: (data: ExpenseInput, id: string) => Promise<Result>;
  onError: (message: string) => void;
}) {
  const [f, setF] = useState<FormState>(blankForm);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = useCallback(
    (k: keyof FormState, v: string) => setF((s) => ({ ...s, [k]: v })),
    [],
  );

  const onAddSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const t = parseMoney(f.total);
      const p = f.paid === "" ? 0 : parseMoney(f.paid);
      const er: Record<string, string> = {};
      if (!Number.isFinite(t)) er.total_cost = "Introdu costul total";
      if (!Number.isFinite(p)) er.amount_paid = "Introdu o sumă validă";
      const parsed = expenseSchema.safeParse({
        item_name: f.item,
        category: f.cat,
        currency: f.currency,
        total_cost: t,
        amount_paid: p,
        notes: f.notes || undefined,
      });
      if (!parsed.success) parsed.error.issues.forEach((i) => { er[String(i.path[0])] ??= i.message; });
      setErrs(er);
      if (Object.keys(er).length || !parsed.success) return;

      setServerErr(null);
      const id = newId();
      // Paint the row before the network round trip; the request runs in the
      // background and never blocks the rest of the page.
      onBeginAdd(parsed.data, id);
      setSaving(true);
      void (async () => {
        const r = await onFinishAdd(parsed.data, id);
        setSaving(false);
        if (r.ok) {
          // Keep the chosen category and currency: adding several similar
          // expenses is faster than retyping everything.
          setF((prev) => ({ ...blankForm, cat: prev.cat, currency: prev.currency }));
        } else {
          setServerErr(r.error);
          onError(r.error);
        }
      })();
    },
    [f, onBeginAdd, onFinishAdd, onError],
  );

  return (
    <form onSubmit={onAddSubmit} noValidate className="glass mt-8 grid gap-4 rounded-xl p-4 sm:grid-cols-2">
      <h2 className="font-display text-2xl sm:col-span-2">Adaugă o cheltuială</h2>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="item">Numele cheltuielii</Label>
        <Input id="item" value={f.item} onChange={(e) => set("item", e.target.value)} /><Err errs={errs} k="item_name" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cat">Categorie</Label>
        <select id="cat" value={f.cat} onChange={(e) => set("cat", e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm transition-[border-color,box-shadow] duration-200 ease-out hover:border-ink/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="currency">Monedă</Label>
        <select id="currency" value={f.currency} onChange={(e) => set("currency", e.target.value as Currency)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm transition-[border-color,box-shadow] duration-200 ease-out hover:border-ink/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25">
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>{CURRENCY_LABEL[currency]}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="total">Cost total ({f.currency})</Label>
        <Input id="total" inputMode="decimal" value={f.total} onChange={(e) => set("total", e.target.value)} /><Err errs={errs} k="total_cost" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="paid">Sumă plătită ({f.currency})</Label>
        <Input id="paid" inputMode="decimal" placeholder="0" value={f.paid} onChange={(e) => set("paid", e.target.value)} /><Err errs={errs} k="amount_paid" />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="notes">Note (opțional)</Label>
        <Input id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      {serverErr && <p role="alert" className="text-red-700 sm:col-span-2">{serverErr}</p>}
      <Button type="submit" disabled={saving} className="bg-ink text-sea hover:bg-ink/85 sm:col-span-2">
        <Plus className="size-4" /> Adaugă cheltuiala
      </Button>
    </form>
  );
});

function PaymentDialog({
  expense,
  onClose,
  onBeginPay,
  onFinishPay,
}: {
  expense: Expense | null;
  onClose: () => void;
  onBeginPay: (expense: Expense, amount: number) => void;
  onFinishPay: (expense: Expense, amount: number) => Promise<Result>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fmt = moneyFormatter(expense?.currency ?? "RON");

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
    if (!valid) { setErr(`Introdu o sumă între 0 și ${fmt.format(remaining)}.`); return; }
    const amount = round2(value);
    onBeginPay(expense, amount);
    setSaving(true);
    void (async () => {
      const r = await onFinishPay(expense, amount);
      setSaving(false);
      if (r.ok) onClose();
      else setErr(r.error);
    })();
  };

  return (
    <dialog ref={ref} onClose={onClose}
      className="glass-bar m-auto w-[min(92vw,26rem)] rounded-xl p-6 text-ink backdrop:bg-black/50">
      {expense && (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <h2 className="font-display text-2xl">Adaugă o plată</h2>
          <div className="text-sm text-ink/75">
            <p className="font-medium text-ink">{expense.item_name}</p>
            <p>Total {fmt.format(expense.total_cost)}, plătit {fmt.format(expense.amount_paid)}, rămas {fmt.format(remaining)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment">Sumă ({expense.currency})</Label>
            <div className="flex gap-2">
              <Input id="payment" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Button type="button" variant="outline" onClick={() => setAmount(String(remaining))}>Plătește restul</Button>
            </div>
            {valid && <p className="text-sm text-ink/70">Noul total plătit: {fmt.format(round2(expense.amount_paid + value))}</p>}
            {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Anulează</Button>
            <Button type="submit" disabled={saving} className="bg-ink text-sea hover:bg-ink/85">
              {saving ? "Se salvează…" : "Adaugă plata"}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}

type ItemsState = { source: Expense[]; items: LocalExpense[] };

export function BudgetTracker({ expenses }: { expenses: Expense[] }) {
  const [store, setStore] = useState<ItemsState>(() => ({ source: expenses, items: expenses }));
  const [paying, setPaying] = useState<Expense | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const { toast, show, dismiss } = useToast();

  // Adjust state during render (the React-endorsed pattern) rather than in an
  // effect: after a background refresh the fresh rows replace the list, while
  // unchanged rows keep their identity (memoized rows do not re-render) and
  // optimistic rows still in flight stay on screen.
  if (store.source !== expenses) {
    setStore((prev) => {
      const serverIds = new Set(expenses.map((e) => e.id));
      const inFlight = prev.items.filter((e) => e.pending && !serverIds.has(e.id));
      const merged = mergeById(prev.items, expenses, sameExpense);
      return { source: expenses, items: inFlight.length ? [...inFlight, ...merged] : merged };
    });
  }

  const items = store.items;
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const setItems = useCallback((updater: (prev: LocalExpense[]) => LocalExpense[]) => {
    setStore((prev) => ({ ...prev, items: updater(prev.items) }));
  }, []);

  const totals = useMemo(
    () =>
      CURRENCIES.map((currency) => {
        const list = items.filter((e) => e.currency === currency);
        const total = list.reduce((s, e) => s + e.total_cost, 0);
        const paid = list.reduce((s, e) => s + e.amount_paid, 0);
        return { currency, count: list.length, total, paid, left: round2(total - paid) };
      }).filter((t) => t.count > 0),
    [items],
  );

  // Category counts and the filtered list are pure client-side derivations.
  // Clicking a tab only sets state: no server call, no re-fetch.
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.category, (map.get(item.category) ?? 0) + 1);
    return map;
  }, [items]);

  const tabs = useMemo<CategoryTab[]>(
    () => CATEGORIES.map((value) => ({ value, label: value, count: counts.get(value) ?? 0 })),
    [counts],
  );

  const visibleItems = useMemo(
    () => (category === null ? items : items.filter((item) => item.category === category)),
    [items, category],
  );

  const beginAdd = useCallback((data: ExpenseInput, id: string) => {
    const optimistic: LocalExpense = {
      id,
      item_name: data.item_name,
      category: data.category,
      currency: data.currency,
      total_cost: round2(data.total_cost),
      amount_paid: round2(data.amount_paid),
      notes: data.notes || null,
      pending: true,
    };
    setItems((prev) => [optimistic, ...prev]);
  }, [setItems]);

  const finishAdd = useCallback(async (data: ExpenseInput, id: string): Promise<Result> => {
    let r: Result;
    try {
      r = await addExpense(data, id);
    } catch {
      r = { ok: false, error: NETWORK_ERROR };
    }
    if (r.ok) {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, pending: false } : x)));
      notifyAdminDataChanged();
    } else {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }
    return r;
  }, [setItems]);

  const remove = useCallback(async (id: string) => {
    const list = itemsRef.current;
    const index = list.findIndex((x) => x.id === id);
    if (index < 0) return;
    const removed = list[index]!;
    setItems((prev) => prev.filter((x) => x.id !== id));

    const r = await deleteExpense(id).catch(() => ({ ok: false as const, error: NETWORK_ERROR }));
    if (!r.ok) {
      setItems((prev) => {
        if (prev.some((x) => x.id === id)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
      show(r.error, "error");
    } else {
      notifyAdminDataChanged();
    }
  }, [setItems, show]);

  const changeCategory = useCallback(
    (expense: Expense, next: Category) => {
      const previous = expense.category;
      if (previous === next) return;
      // Instant: the row changes before the request leaves the browser.
      setItems((prev) => prev.map((x) => (x.id === expense.id ? { ...x, category: next } : x)));
      void updateExpenseCategory(expense.id, next)
        .catch(() => ({ ok: false as const, error: NETWORK_ERROR }))
        .then((r) => {
          if (r.ok) {
            notifyAdminDataChanged();
            return;
          }
          // Silent revert of this row only; the rest of the list is untouched.
          setItems((prev) =>
            prev.map((x) => (x.id === expense.id ? { ...x, category: previous } : x))
          );
          show(r.error, "error");
        });
    },
    [setItems, show],
  );

  const beginPay = useCallback((expense: Expense, amount: number) => {
    const id = expense.id;
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, amount_paid: round2(x.amount_paid + amount) } : x)),
    );
    // Keep the open dialog in sync with the optimistic row.
    setPaying((prev) =>
      prev && prev.id === id ? { ...prev, amount_paid: round2(prev.amount_paid + amount) } : prev,
    );
  }, [setItems]);

  const finishPay = useCallback(async (expense: Expense, amount: number): Promise<Result> => {
    const id = expense.id;
    const r = await addPayment({ id, amount }).catch(() => ({
      ok: false as const,
      error: NETWORK_ERROR,
    }));
    if (!r.ok) {
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, amount_paid: round2(x.amount_paid - amount) } : x)),
      );
      setPaying((prev) =>
        prev && prev.id === id ? { ...prev, amount_paid: round2(prev.amount_paid - amount) } : prev,
      );
      show(r.error, "error");
    } else {
      notifyAdminDataChanged();
    }
    return r;
  }, [setItems, show]);

  const openPay = useCallback((expense: Expense) => setPaying(expense), []);
  const closePay = useCallback(() => setPaying(null), []);
  const showError = useCallback((message: string) => show(message, "error"), [show]);
  const selectCategory = useCallback((value: string | null) => setCategory(value), []);

  return (
    <>
      <Totals totals={totals} />
      <ExpenseForm onBeginAdd={beginAdd} onFinishAdd={finishAdd} onError={showError} />
      <CategoryTabs tabs={tabs} total={items.length} active={category} onSelect={selectCategory} />
      <ExpenseList
        items={visibleItems}
        empty={category === null ? undefined : "Nicio cheltuială în această categorie."}
        onDelete={remove}
        onPay={openPay}
        onCategoryChange={changeCategory}
      />
      <PaymentDialog expense={paying} onClose={closePay} onBeginPay={beginPay} onFinishPay={finishPay} />
      <Toast toast={toast} onDismiss={dismiss} />
    </>
  );
}
