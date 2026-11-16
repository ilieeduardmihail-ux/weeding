/**
 * Everything the platform owner panel shows, in one round of queries.
 * Server only: it reads across every client, so it runs after an owner check
 * and through the service-role client (RLS would hide other tenants' rows).
 */
import { DEMO_SLUG } from "@/lib/marketing";
import { serviceClient } from "@/lib/platform";
import type {
  Invoice,
  IssuerSettings,
  MailEntry,
  PlatformAdmin,
  PlatformKey,
  PlatformTenant,
  PlatformOverview,
  VisitCounter,
  VisitStats,
} from "@/lib/platform-types";
import { EMPTY_ISSUER, EMPTY_VISITS } from "@/lib/platform-types";

export type { PlatformAdmin, PlatformKey, PlatformTenant, PlatformOverview } from "@/lib/platform-types";

export async function loadPlatformOverview(): Promise<PlatformOverview> {
  const service = serviceClient();

  const [tenantsResult, adminsResult, keysResult, ownersResult] = await Promise.all([
    service
      .from("tenants")
      .select("id, slug, display_name, status, created_at, activated_at, expires_at")
      // The demo is a real tenant, but not a client: it never belongs in the
      // owner's list, its counts or the invoice client picker.
      .neq("slug", DEMO_SLUG)
      .order("created_at", { ascending: true }),
    service.from("tenant_admins").select("tenant_id, email").order("email", { ascending: true }),
    service
      .from("access_keys")
      .select("id, tenant_id, label, duration_days, created_at, used_at, used_by_email, revoked_at")
      .order("created_at", { ascending: false }),
    service.from("platform_owners").select("email").order("email", { ascending: true }),
  ]);

  const adminsByTenant = new Map<string, PlatformAdmin[]>();
  for (const row of (adminsResult.data ?? []) as { tenant_id: string; email: string }[]) {
    const list = adminsByTenant.get(row.tenant_id) ?? [];
    list.push({ email: row.email });
    adminsByTenant.set(row.tenant_id, list);
  }

  const keysByTenant = new Map<string, PlatformKey[]>();
  for (const row of (keysResult.data ?? []) as Record<string, unknown>[]) {
    const tenantId = String(row.tenant_id);
    const list = keysByTenant.get(tenantId) ?? [];
    list.push({
      id: String(row.id),
      label: typeof row.label === "string" ? row.label : null,
      durationDays: Number(row.duration_days),
      createdAt: String(row.created_at),
      usedAt: typeof row.used_at === "string" ? row.used_at : null,
      usedByEmail: typeof row.used_by_email === "string" ? row.used_by_email : null,
      revokedAt: typeof row.revoked_at === "string" ? row.revoked_at : null,
    });
    keysByTenant.set(tenantId, list);
  }

  const tenants: PlatformTenant[] = ((tenantsResult.data ?? []) as Record<string, unknown>[]).map(
    (row) => ({
      id: String(row.id),
      slug: String(row.slug),
      displayName: String(row.display_name),
      status: String(row.status),
      createdAt: String(row.created_at),
      activatedAt: typeof row.activated_at === "string" ? row.activated_at : null,
      expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
      admins: adminsByTenant.get(String(row.id)) ?? [],
      keys: keysByTenant.get(String(row.id)) ?? [],
    })
  );

  return {
    tenants,
    owners: ((ownersResult.data ?? []) as { email: string }[]).map((row) => row.email),
  };
}

const INVOICE_COLUMNS =
  "id, number, issued_at, client_name, client_email, client_slug, tenant_id, description, amount, currency, paid, paid_at, notes";

function toInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: String(row.id),
    number: Number(row.number),
    issuedAt: String(row.issued_at),
    clientName: String(row.client_name),
    clientEmail: typeof row.client_email === "string" ? row.client_email : null,
    clientSlug: typeof row.client_slug === "string" ? row.client_slug : null,
    tenantId: typeof row.tenant_id === "string" ? row.tenant_id : null,
    description: String(row.description),
    amount: Number(row.amount),
    currency: String(row.currency),
    paid: row.paid === true,
    paidAt: typeof row.paid_at === "string" ? row.paid_at : null,
    notes: typeof row.notes === "string" ? row.notes : null,
  };
}

const ISSUER_COLUMNS =
  "issuer_name, issuer_address, issuer_email, issuer_phone, issuer_tax_id, issuer_bank, issuer_iban, currency, footer_note";

function toIssuer(row: Record<string, unknown> | null): IssuerSettings {
  if (!row) return EMPTY_ISSUER;
  const text = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
  return {
    issuerName: text(row.issuer_name),
    issuerAddress: text(row.issuer_address),
    issuerEmail: text(row.issuer_email),
    issuerPhone: text(row.issuer_phone),
    issuerTaxId: text(row.issuer_tax_id),
    issuerBank: text(row.issuer_bank),
    issuerIban: text(row.issuer_iban),
    currency: text(row.currency, "RON"),
    footerNote: text(row.footer_note),
  };
}

/** Invoices and issuer details for the platform panel. Owner-guarded at the page. */
export async function loadInvoices(): Promise<{ invoices: Invoice[]; issuer: IssuerSettings }> {
  const service = serviceClient();
  const [invoicesResult, settingsResult] = await Promise.all([
    service
      .from("invoices")
      .select(INVOICE_COLUMNS)
      .order("issued_at", { ascending: false })
      .order("number", { ascending: false }),
    service.from("platform_settings").select(ISSUER_COLUMNS).eq("id", 1).maybeSingle(),
  ]);

  return {
    invoices: ((invoicesResult.data ?? []) as Record<string, unknown>[]).map(toInvoice),
    issuer: toIssuer(settingsResult.data as Record<string, unknown> | null),
  };
}

/** One invoice, for the printable note. */
export async function loadInvoice(
  id: string
): Promise<{ invoice: Invoice; issuer: IssuerSettings } | null> {
  const service = serviceClient();
  const [invoiceResult, settingsResult] = await Promise.all([
    service.from("invoices").select(INVOICE_COLUMNS).eq("id", id).maybeSingle(),
    service.from("platform_settings").select(ISSUER_COLUMNS).eq("id", 1).maybeSingle(),
  ]);
  if (!invoiceResult.data) return null;
  return {
    invoice: toInvoice(invoiceResult.data as Record<string, unknown>),
    issuer: toIssuer(settingsResult.data as Record<string, unknown> | null),
  };
}

function toCounter(value: unknown): VisitCounter {
  const row = (value ?? {}) as Record<string, unknown>;
  const num = (key: string) => {
    const parsed = Number(row[key]);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
  };
  return { total: num("total"), h24: num("h24"), d7: num("d7"), u24: num("u24"), u7: num("u7") };
}

/**
 * Anonymous visit counters. Returns zeros when the table or function is not
 * deployed yet, so the panel works before the migration is run.
 */
export async function loadVisitStats(): Promise<VisitStats> {
  const empty: VisitStats = { marketing: EMPTY_VISITS, invites: EMPTY_VISITS, hourly: [] };
  try {
    const { data, error } = await serviceClient().rpc("visit_stats");
    if (error || !data) return empty;
    const raw = data as Record<string, unknown>;
    return {
      marketing: toCounter(raw.marketing),
      invites: toCounter(raw.invites),
      hourly: Array.isArray(raw.hourly)
        ? (raw.hourly as Record<string, unknown>[]).map((row) => ({
            hour: String(row.hour ?? ""),
            marketing: Number(row.marketing) || 0,
            invites: Number(row.invites) || 0,
          }))
        : [],
    };
  } catch {
    return empty;
  }
}

/** Metadata of the emails the app sent, newest first. Empty before migration. */
export async function loadMailLog(limit = 200): Promise<MailEntry[]> {
  try {
    const { data, error } = await serviceClient()
      .from("mail_log")
      .select("id, at, kind, to_address, subject, reply_to, ok, error, tenants(slug, display_name)")
      .order("at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];

    return (data as Record<string, unknown>[]).map((row) => {
      const tenant = (row.tenants ?? null) as { slug?: string; display_name?: string } | null;
      return {
        id: String(row.id),
        at: String(row.at),
        kind: (row.kind === "factura" || row.kind === "cheie" ? row.kind : "oferta") as MailEntry["kind"],
        to: String(row.to_address ?? ""),
        subject: String(row.subject ?? ""),
        replyTo: typeof row.reply_to === "string" ? row.reply_to : null,
        tenantSlug: tenant?.slug ? String(tenant.slug) : null,
        tenantName: tenant?.display_name ? String(tenant.display_name) : null,
        ok: row.ok === true,
        error: typeof row.error === "string" ? row.error : null,
      };
    });
  } catch {
    return [];
  }
}
