/** Budget currency: a single choice for the whole budget, RON or EUR. */
export const CURRENCIES = ["RON", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "RON";

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

const formatters = new Map<Currency, Intl.NumberFormat>();

export function moneyFormatter(currency: Currency) {
  let fmt = formatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    formatters.set(currency, fmt);
  }
  return fmt;
}

export const formatMoney = (amount: number, currency: Currency) =>
  moneyFormatter(currency).format(amount);
