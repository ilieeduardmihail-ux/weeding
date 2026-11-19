/**
 * Everything the platform owner panel shows, in one round of queries.
 * Server only: it reads across every client, so it runs after an owner check
 * and through the service-role client (RLS would hide other tenants' rows).
 */
import { DEMO_SLUG } from "@/lib/marketing";
import { RETENTION } from "@/lib/legal";
import { serviceClient } from "@/lib/platform";
import type {
  Invoice,
  IssuerSettings,
  MailEntry,
  OfferRequest,
  OfferStatus,
  PlatformAdmin,
  PlatformKey,
  PlatformLead,
  PlatformTenant,
  PlatformOverview,
  VisitCounter,
  VisitStats,
} from "@/lib/platform-types";
import { EMPTY_ISSUER, EMPTY_VISITS } from "@/lib/platform-types";
import { purgeExpiredSandboxes } from "@/lib/demo/sandbox";

export type { PlatformAdmin, PlatformKey, PlatformTenant, PlatformOverview } from "@/lib/platform-types";

export async function loadPlatformOverview(): Promise<PlatformOverview> {
  const service = serviceClient();

  const [tenantsResult, adminsResult, keysResult, ownersResult] = await Promise.all([
    service
      .from("tenants")
      .select("id, slug, display_name, status, plan, created_at, activated_at, expires_at")
      // The demo is a real tenant, but not a client: it never belongs in the
      // owner's list, its counts or the invoice client picker. Sandboxes are
      // visitors' copies, listed under „Lead-uri" instead.
      .neq("slug", DEMO_SLUG)
      .eq("is_sandbox", false)
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
      plan: row.plan === "premium" ? "premium" : "standard",
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

const MAIL_KINDS: MailEntry["kind"][] = ["oferta", "factura", "cheie", "raspuns", "lead", "cod"];

function asMailKind(value: unknown): MailEntry["kind"] {
  return MAIL_KINDS.includes(value as MailEntry["kind"])
    ? (value as MailEntry["kind"])
    : "oferta";
}

/** The policy promises 30 days for the mail log; the cron calls this daily. */
export async function purgeExpiredMailLog(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - RETENTION.logsDays * 86_400_000).toISOString();
    await serviceClient().from("mail_log").delete().lt("at", cutoff);
  } catch {
    // Housekeeping must never break the page that triggered it.
  }
}

/** Metadata of the emails the app sent, newest first. Empty before migration. */
export async function loadMailLog(limit = 200): Promise<MailEntry[]> {
  try {
    await purgeExpiredMailLog();

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
        kind: asMailKind(row.kind),
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

function toOfferStatus(value: unknown): OfferStatus {
  return value === "raspuns" || value === "inchis" ? value : "nou";
}

/** Deletes offer requests older than the contact retention, for the daily cron. */
export async function purgeExpiredOffers(): Promise<void> {
  try {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - RETENTION.contactYears);
    await serviceClient().from("offer_requests").delete().lt("at", cutoff.toISOString());
  } catch {
    // Housekeeping must never break the page that triggered it.
  }
}

/** Requests from the offer form, newest first. Empty before the migration. */
export async function loadOfferRequests(limit = 200): Promise<OfferRequest[]> {
  try {
    const service = serviceClient();
    await purgeExpiredOffers();

    const { data, error } = await service
      .from("offer_requests")
      .select(
        "id, at, name, email, phone, period, message, status, replied_at, reply_count, tenant_id, key_sent_at"
      )
      .order("at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];

    return (data as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      at: String(row.at),
      name: String(row.name ?? ""),
      email: String(row.email ?? ""),
      phone: typeof row.phone === "string" && row.phone.trim() ? row.phone : null,
      period: typeof row.period === "string" && row.period.trim() ? row.period : null,
      message: String(row.message ?? ""),
      status: toOfferStatus(row.status),
      repliedAt: typeof row.replied_at === "string" ? row.replied_at : null,
      replyCount: Number(row.reply_count) || 0,
      tenantId: typeof row.tenant_id === "string" ? row.tenant_id : null,
      keySentAt: typeof row.key_sent_at === "string" ? row.key_sent_at : null,
    }));
  } catch {
    return [];
  }
}

/** How many requests are still waiting for an answer, for the dashboard badge. */
export async function countNewOfferRequests(): Promise<number> {
  try {
    const { count, error } = await serviceClient()
      .from("offer_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "nou");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/* -------------------------------------------------------------------- leads */

const LEAD_COLUMNS =
  "id, email, name, created_at, verified_at, last_seen_at, consent_at, policy_version, marketing_at, note, archived_at, sandbox_tenant_id";

/**
 * The demo accounts, newest first, each with the state of its copy. Runs after
 * an owner check; it also sweeps the expired copies, so opening this page is
 * enough to keep the database clean without a cron.
 */
export async function loadLeads(limit = 300): Promise<PlatformLead[]> {
  try {
    const service = serviceClient();
    await purgeExpiredSandboxes();

    const { data, error } = await service
      .from("leads")
      .select(LEAD_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];

    const rows = data as Record<string, unknown>[];
    const tenantIds = rows
      .map((row) => row.sandbox_tenant_id)
      .filter((id): id is string => typeof id === "string");

    const tenants = new Map<
      string,
      { slug: string; expiresAt: string | null; isSandbox: boolean }
    >();
    if (tenantIds.length > 0) {
      const { data: tenantRows } = await service
        .from("tenants")
        .select("id, slug, expires_at, is_sandbox")
        .in("id", tenantIds);
      for (const row of (tenantRows ?? []) as Record<string, unknown>[]) {
        tenants.set(String(row.id), {
          slug: String(row.slug),
          expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
          isSandbox: row.is_sandbox === true,
        });
      }
    }

    return rows.map((row) => {
      const tenantId = typeof row.sandbox_tenant_id === "string" ? row.sandbox_tenant_id : null;
      const tenant = tenantId ? tenants.get(tenantId) ?? null : null;
      return {
        id: String(row.id),
        email: String(row.email ?? ""),
        name: typeof row.name === "string" && row.name.trim() ? row.name : null,
        createdAt: String(row.created_at),
        verifiedAt: typeof row.verified_at === "string" ? row.verified_at : null,
        lastSeenAt: typeof row.last_seen_at === "string" ? row.last_seen_at : null,
        consentAt: String(row.consent_at),
        policyVersion: String(row.policy_version ?? ""),
        marketingAt: typeof row.marketing_at === "string" ? row.marketing_at : null,
        note: typeof row.note === "string" && row.note.trim() ? row.note : null,
        archivedAt: typeof row.archived_at === "string" ? row.archived_at : null,
        // A sandbox washed away by `purge_expired_sandboxes` leaves the lead
        // behind with a dangling id; the row is still worth a call.
        sandboxTenantId: tenant ? tenantId : null,
        sandboxSlug: tenant?.slug ?? null,
        expiresAt: tenant?.expiresAt ?? null,
        isSandbox: tenant?.isSandbox ?? false,
      };
    });
  } catch {
    return [];
  }
}

/** Confirmed leads nobody has written a note about yet, for the nav badge. */
export async function countNewLeads(): Promise<number> {
  try {
    const { count, error } = await serviceClient()
      .from("leads")
      .select("id", { count: "exact", head: true })
      .not("verified_at", "is", null)
      .is("archived_at", null)
      .is("note", null);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
