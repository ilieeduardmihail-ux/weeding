"use client";

import { useMemo, useState } from "react";
import { Check, Gift, Plus, Users, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { moneyFormatter, type Currency } from "@/lib/currency";
import { round2 } from "@/lib/expense-schema";
import type { Expense } from "@/components/admin/budget-tracker";

/** Gifts are usually rounded up to a friendly note. */
const roundGift = (value: number) => Math.ceil(value / 10) * 10;

/**
 * Premium: how much a guest should give so the couple covers the vendors they
 * picked. Works with drag & drop on a computer and with a tap on a phone.
 */
export function GiftCalculator({
  expenses,
  defaultGuests,
}: {
  expenses: Expense[];
  defaultGuests: number;
}) {
  const currencies = useMemo(() => {
    const set = new Set<Currency>();
    for (const expense of expenses) set.add(expense.currency);
    return [...set];
  }, [expenses]);

  const [currency, setCurrency] = useState<Currency>(currencies[0] ?? "RON");
  const [guests, setGuests] = useState(String(Math.max(1, defaultGuests)));
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [dragging, setDragging] = useState(false);

  const list = useMemo(
    () => expenses.filter((expense) => expense.currency === currency),
    [expenses, currency],
  );

  const add = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const remove = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const toggle = (id: string) => (selected.has(id) ? remove(id) : add(id));

  const count = Math.max(1, Number(guests) || 1);
  const fmt = moneyFormatter(currency);

  const total = useMemo(
    () =>
      list
        .filter((expense) => selected.has(expense.id))
        .reduce((sum, expense) => sum + expense.total_cost, 0),
    [list, selected],
  );

  const perPerson = round2(total / count);
  const perCouple = round2(perPerson * 2);

  return (
    <section className="glass mt-8 rounded-xl p-5" aria-labelledby="gift-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="gift-title" className="flex items-center gap-2 font-display text-2xl">
            <Gift className="size-5 text-gold" aria-hidden /> Calculator de dar
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink/65">
            Alege cheltuielile pe care vrei să le acoperi din daruri. Pe calculator le tragi în
            zonă, pe telefon apeși „+”. Rezultatul se recalculează instant.
          </p>
        </div>
        {currencies.length > 1 && (
          <div className="flex gap-1" role="group" aria-label="Moneda calculatorului">
            {currencies.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={option === currency}
                onClick={() => {
                  setCurrency(option);
                  setSelected(new Set());
                }}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  option === currency ? "bg-ink text-sea" : "bg-ink/5 text-ink/70 hover:bg-ink/10"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-sm font-medium">Cheltuieli din buget</p>
          {list.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">
              Nu există cheltuieli în {currency}. Adaugă una în buget ca să o poți include.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {list.map((expense) => {
                const checked = selected.has(expense.id);
                return (
                  <li
                    key={expense.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", expense.id);
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                    className={`flex cursor-grab items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors active:cursor-grabbing ${
                      checked ? "border-gold/60 bg-gold/10" : "border-ink/10 bg-paper/40 hover:bg-ink/5"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{expense.item_name}</p>
                      <p className="text-xs text-ink/55">
                        {expense.category} · {fmt.format(expense.total_cost)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggle(expense.id)}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        checked
                          ? "border-gold bg-gold/20 text-ink"
                          : "border-ink/20 text-ink/65 hover:bg-ink/10"
                      }`}
                    >
                      {checked ? <Check className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
                      {checked ? "Adăugat" : "Adaugă"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const id = event.dataTransfer.getData("text/plain");
              if (id) add(id);
            }}
            className={`mt-4 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
              dragging ? "border-gold bg-gold/15 text-ink" : "border-ink/20 text-ink/55"
            }`}
          >
            <Wallet className="mx-auto size-5 text-gold" aria-hidden />
            <p className="mt-2">
              {selected.size > 0
                ? `${selected.size} ${selected.size === 1 ? "cheltuială selectată" : "cheltuieli selectate"}`
                : "Trage aici cheltuielile sau folosește butonul „Adaugă”."}
            </p>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="mt-2 text-xs text-ink/60 underline underline-offset-4 hover:text-ink"
              >
                Golește selecția
              </button>
            )}
          </div>
        </div>

        <div className="glass-soft rounded-xl p-5">
          <div className="space-y-2">
            <Label htmlFor="gift-guests" className="flex items-center gap-2">
              <Users className="size-4" aria-hidden /> Număr de invitați
            </Label>
            <Input
              id="gift-guests"
              type="number"
              min={1}
              max={1000}
              inputMode="numeric"
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
            />
            <p className="text-xs text-ink/50">Implicit: persoanele confirmate în RSVP.</p>
          </div>

          <dl className="mt-5 space-y-3 border-t border-ink/10 pt-4">
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-ink/55">Cost total selectat</dt>
              <dd className="font-display text-2xl tabular-nums">{fmt.format(total)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-ink/55">Dar minim / persoană</dt>
              <dd className="font-display text-3xl tabular-nums text-gold">{fmt.format(perPerson)}</dd>
              <p className="text-xs text-ink/50">Recomandat rotunjit: {fmt.format(roundGift(perPerson))}</p>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-ink/55">Dar minim / cuplu</dt>
              <dd className="font-display text-2xl tabular-nums">{fmt.format(perCouple)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-ink/50">
            Calcul orientativ: costul cheltuielilor alese împărțit la numărul de invitați.
          </p>
        </div>
      </div>
    </section>
  );
}
