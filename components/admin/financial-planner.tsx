"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CalendarClock, PiggyBank, Wallet } from "lucide-react";
import { moneyFormatter, type Currency } from "@/lib/currency";
import { round2 } from "@/lib/expense-schema";
import type { Expense } from "@/components/admin/budget-tracker";

const DAY = 86_400_000;

/** Whole months left, rounded up: 2 days still need a month's saving. */
function monthsUntil(date: string, now: number) {
  const target = new Date(`${date}T12:00:00`).getTime();
  if (Number.isNaN(target)) return 0;
  const days = Math.ceil((target - now) / DAY);
  return days <= 0 ? 0 : Math.ceil(days / 30.44);
}

/**
 * Premium: turns the remaining budget into a monthly saving target. The wedding
 * date comes from the settings, so changing the date updates the plan.
 */
export function FinancialPlanner({
  expenses,
  eventDate,
}: {
  expenses: Expense[];
  eventDate: string;
}) {
  // The clock is an external store: no state written from an effect, and the
  // server render uses `null` so hydration never disagrees about the date.
  const now = useSyncExternalStore(
    (onChange) => {
      const timer = window.setInterval(onChange, 60_000);
      return () => window.clearInterval(timer);
    },
    () => Date.now(),
    () => null,
  );

  const rows = useMemo(() => {
    const byCurrency = new Map<Currency, { total: number; paid: number; left: number }>();
    for (const expense of expenses) {
      const current = byCurrency.get(expense.currency) ?? { total: 0, paid: 0, left: 0 };
      current.total = round2(current.total + expense.total_cost);
      current.paid = round2(current.paid + expense.amount_paid);
      current.left = round2(current.total - current.paid);
      byCurrency.set(expense.currency, current);
    }
    return [...byCurrency.entries()];
  }, [expenses]);

  const months = now === null ? null : monthsUntil(eventDate, now);

  return (
    <section className="glass mt-8 rounded-xl p-5" aria-labelledby="planner-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="planner-title" className="font-display text-2xl">Planificator financiar</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink/65">
            Cât trebuie pus deoparte în fiecare lună ca să acoperiți restul de plată până la nuntă.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-3 py-1 text-xs font-medium text-ink/70">
          <CalendarClock className="size-3.5" aria-hidden />
          {months === null ? "Se calculează…" : months === 0 ? "Nunta a trecut" : `${months} luni rămase`}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-ink/65">
          Adaugă prima cheltuială ca să vedem cât aveți de economisit lunar.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {rows.map(([currency, totals]) => {
            const fmt = moneyFormatter(currency);
            const monthly = months && months > 0 ? round2(totals.left / months) : totals.left;
            return (
              <li key={currency} className="glass-soft rounded-lg p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55">
                  <Wallet className="size-3.5" aria-hidden /> {currency}
                </p>
                <p className="mt-2 font-display text-3xl tabular-nums">{fmt.format(totals.left)}</p>
                <p className="text-sm text-ink/60">rămași de plătit</p>
                <div className="mt-4 flex items-baseline gap-2 border-t border-ink/10 pt-3">
                  <PiggyBank className="size-4 self-center text-gold" aria-hidden />
                  <span className="font-display text-2xl tabular-nums text-gold">{fmt.format(monthly)}</span>
                  <span className="text-sm text-ink/60">/ lună</span>
                </div>
                <p className="mt-1 text-xs text-ink/50">
                  {months && months > 0
                    ? `Timp de ${months} ${months === 1 ? "lună" : "luni"}, până pe ${new Date(`${eventDate}T12:00:00`).toLocaleDateString("ro-RO")}.`
                    : "Nunta a trecut; suma a rămas de achitat."}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
