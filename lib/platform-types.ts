/**
 * Shapes shared by the platform panel (client) and its data loader (server).
 * Kept free of server-only imports so the dashboard can use them in the browser.
 */

export type PlatformAdmin = { email: string };

export type PlatformKey = {
  id: string;
  label: string | null;
  durationDays: number;
  createdAt: string;
  usedAt: string | null;
  usedByEmail: string | null;
  revokedAt: string | null;
};

export type PlatformTenant = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  admins: PlatformAdmin[];
  keys: PlatformKey[];
};

export type PlatformOverview = {
  tenants: PlatformTenant[];
  owners: string[];
};

/** A simple payment note: no VAT, the amount is entered freely per invoice. */
export type Invoice = {
  id: string;
  number: number;
  issuedAt: string; // YYYY-MM-DD
  clientName: string;
  clientEmail: string | null;
  clientSlug: string | null;
  tenantId: string | null;
  description: string;
  amount: number;
  currency: string;
  paid: boolean;
  paidAt: string | null;
  notes: string | null;
};

/** Issuer details printed on every invoice; filled in later by the owner. */
export type IssuerSettings = {
  issuerName: string;
  issuerAddress: string;
  issuerEmail: string;
  issuerPhone: string;
  issuerTaxId: string;
  issuerBank: string;
  issuerIban: string;
  currency: string;
  footerNote: string;
};

export const EMPTY_ISSUER: IssuerSettings = {
  issuerName: "",
  issuerAddress: "",
  issuerEmail: "",
  issuerPhone: "",
  issuerTaxId: "",
  issuerBank: "",
  issuerIban: "",
  currency: "RON",
  footerNote: "",
};

export type InvoiceTotals = { count: number; total: number; paid: number; unpaid: number };

/** Totals for a list of invoices, computed once so list and summary agree. */
export function invoiceTotals(invoices: Invoice[]): InvoiceTotals {
  let total = 0;
  let paid = 0;
  for (const invoice of invoices) {
    total += invoice.amount;
    if (invoice.paid) paid += invoice.amount;
  }
  return { count: invoices.length, total, paid, unpaid: total - paid };
}

/** Money rendered in the Romanian convention, e.g. "1.200,00 RON". */
export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export type TenantHealth = {
  tone: "active" | "pending" | "expired" | "suspended";
  label: string;
};

/** Health of a client, derived once so the list and the badges agree. */
export function tenantHealth(tenant: PlatformTenant, now = Date.now()): TenantHealth {
  if (tenant.status === "suspended") return { tone: "suspended", label: "Suspendat" };
  if (tenant.status === "pending") return { tone: "pending", label: "Neactivat" };
  if (tenant.expiresAt && new Date(tenant.expiresAt).getTime() <= now)
    return { tone: "expired", label: "Expirat" };
  return { tone: "active", label: "Activ" };
}
