"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  KeyRound,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast, useToast } from "@/components/ui/toast";
import { tenantHealth, type PlatformTenant, type PlatformOverview } from "@/lib/platform-types";
import {
  createAdminAccount,
  createTenant,
  deleteTenant,
  generateKey,
  renewTenant,
  setTenantStatus,
  signOutOwner,
} from "@/app/platform/actions";

const dateFmt = new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" });

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFmt.format(new Date(value));
}

/** Predefined durations, in the days the server stores. */
const DURATION_PRESETS = [
  { label: "6 luni", days: 180 },
  { label: "1 an", days: 365 },
  { label: "1 an și 6 luni", days: 540 },
  { label: "2 ani", days: 730 },
] as const;

/** Turns a day count into something readable, e.g. 365 -> "1 an (365 zile)". */
function durationLabel(days: number) {
  const preset = DURATION_PRESETS.find((p) => p.days === days);
  return preset ? `${preset.label} (${days} zile)` : `${days} zile`;
}

/**
 * Duration picker shared by the key, direct-account and renew forms: quick
 * presets plus a free "Personalizat" field, all submitted as a day count.
 */
function DurationPicker({
  idPrefix,
  name,
  label = "Durată",
  defaultDays = 365,
}: {
  idPrefix: string;
  name: string;
  label?: string;
  defaultDays?: number;
}) {
  const isPreset = DURATION_PRESETS.some((p) => p.days === defaultDays);
  const [days, setDays] = useState(defaultDays);
  const [custom, setCustom] = useState(!isPreset);

  const chip = (active: boolean) =>
    `rounded-md border px-2.5 py-1 text-xs transition-colors ${
      active ? "border-ink bg-ink text-sea" : "border-ink/25 hover:bg-ink/10"
    }`;

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {DURATION_PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            aria-pressed={!custom && days === preset.days}
            onClick={() => {
              setCustom(false);
              setDays(preset.days);
            }}
            className={chip(!custom && days === preset.days)}
          >
            {preset.label}
          </button>
        ))}
        <button type="button" aria-pressed={custom} onClick={() => setCustom(true)} className={chip(custom)}>
          Personalizat
        </button>
      </div>

      {custom ? (
        <div className="flex items-center gap-2">
          <Input
            id={`${idPrefix}-custom`}
            type="number"
            name={name}
            min={1}
            max={3650}
            value={days}
            onChange={(event) => setDays(Number(event.target.value) || 0)}
            className="w-28"
          />
          <span className="text-xs text-ink/60">zile</span>
        </div>
      ) : (
        <>
          <input type="hidden" name={name} value={days} />
          <p className="text-xs text-ink/60">{durationLabel(days)}</p>
        </>
      )}
    </div>
  );
}

const TONE: Record<string, string> = {
  active: "border-emerald-700/40 bg-emerald-700/10 text-emerald-800",
  pending: "border-amber-600/40 bg-amber-500/10 text-amber-800",
  expired: "border-red-700/40 bg-red-700/10 text-red-800",
  suspended: "border-ink/30 bg-ink/10 text-ink/70",
};

function Badge({ tenant }: { tenant: PlatformTenant }) {
  const health = tenantHealth(tenant);
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${TONE[health.tone]}`}>
      {health.label}
    </span>
  );
}

export function PlatformDashboard({
  overview,
  ownerEmail,
  configured,
}: {
  overview: PlatformOverview;
  ownerEmail: string;
  configured: boolean;
}) {
  const { toast, show, dismiss } = useToast();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Platformă</p>
          <h1 className="font-display text-4xl">Clienți</h1>
          <p className="mt-1 text-sm text-ink/65">
            {overview.tenants.length} nunți · {overview.owners.length} administrator
            {overview.owners.length === 1 ? "" : "i"} de platformă
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/platform/facturi">Facturi</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/platform/documente">Documente</Link>
          </Button>
          <form action={signOutOwner}>
            <Button type="submit" variant="outline">
              <LogOut aria-hidden="true" /> Ieși ({ownerEmail})
            </Button>
          </form>
        </div>
      </header>

      {!configured && (
        <p
          role="alert"
          className="glass mb-8 rounded-xl border border-amber-600/40 p-4 text-sm text-amber-900"
        >
          Cheia de service (SUPABASE_SERVICE_ROLE_KEY) nu este configurată, așa că nu se pot crea
          conturi sau chei. Adaugă variabila în proiect și redeploy.
        </p>
      )}

      <NewClientForm disabled={!configured} onError={(m) => show(m)} />

      <section className="mt-10 space-y-6">
        {overview.tenants.length === 0 && (
          <p className="glass rounded-xl p-6 text-sm text-ink/70">
            Nu există încă niciun client. Creează primul mai sus.
          </p>
        )}
        {overview.tenants.map((tenant) => (
          <TenantCard
            key={tenant.id}
            tenant={tenant}
            disabled={!configured}
            onError={(m) => show(m)}
            onSuccess={(m) => show(m, "success")}
          />
        ))}
      </section>

      <Toast toast={toast} onDismiss={dismiss} />
    </main>
  );
}

function NewClientForm({ disabled, onError }: { disabled: boolean; onError: (m: string) => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    start(async () => {
      const result = await createTenant({
        slug: String(data.get("slug") ?? "").trim(),
        displayName: String(data.get("displayName") ?? "").trim(),
        partner1: String(data.get("partner1") ?? "").trim(),
        partner2: String(data.get("partner2") ?? "").trim(),
        contactEmail: String(data.get("contactEmail") ?? "").trim(),
      });
      if (!result.ok) {
        onError(result.error);
        return;
      }
      form.reset();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <section className="glass rounded-xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">Client nou</h2>
          <p className="text-sm text-ink/65">
            Creează nunta și adresa publică. Accesul se acordă cu o cheie sau un cont direct.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen((v) => !v)}>
          <Plus aria-hidden="true" /> {open ? "Renunță" : "Adaugă"}
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nume afișat</Label>
            <Input id="displayName" name="displayName" required maxLength={120} placeholder="Ana & Stefan" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Adresă publică (slug)</Label>
            <Input id="slug" name="slug" required pattern="[a-z0-9-]+" placeholder="ana-si-stefan" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner1">Partener 1</Label>
            <Input id="partner1" name="partner1" maxLength={80} placeholder="Ana" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner2">Partener 2</Label>
            <Input id="partner2" name="partner2" maxLength={80} placeholder="Stefan" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="contactEmail">Email de contact (opțional)</Label>
            <Input id="contactEmail" name="contactEmail" type="email" placeholder="nunta@exemplu.ro" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={disabled || pending} className="bg-ink text-sea">
              {pending ? "Se creează…" : "Creează clientul"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function TenantCard({
  tenant,
  disabled,
  onError,
  onSuccess,
}: {
  tenant: PlatformTenant;
  disabled: boolean;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");
  const openKeys = tenant.keys.filter((k) => !k.usedAt && !k.revokedAt).length;
  // Independent of status: a suspended client can also be past its expiry, and
  // then „Reactivează" alone would not bring the site back.
  const isExpired = Boolean(tenant.expiresAt && new Date(tenant.expiresAt).getTime() <= Date.now());

  type RunResult = { ok: boolean; error?: string; code?: string };
  const run = (task: () => Promise<RunResult>, after?: (result: RunResult) => void) =>
    start(async () => {
      const result = await task();
      if (!result.ok) {
        onError(result.error ?? "Eroare.");
        return;
      }
      after?.(result);
      router.refresh();
    });

  const generate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    run(
      () =>
        generateKey({
          tenantId: tenant.id,
          durationDays: Number(data.get("durationDays")) || 365,
          label: String(data.get("label") ?? "").trim() || undefined,
        }),
      (result) => {
        setGeneratedKey(result.code ?? null);
        setCopied(false);
        onSuccess("Cheie generată. Copiaz-o acum — nu se mai poate vedea.");
      }
    );
  };

  const addAdmin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    run(
      () =>
        createAdminAccount({
          tenantId: tenant.id,
          email: String(data.get("email") ?? "").trim(),
          password: String(data.get("password") ?? ""),
          durationDays: Number(data.get("durationDays")) || 365,
        }),
      () => {
        form.reset();
        onSuccess("Cont creat și site activat.");
      }
    );
  };

  const renew = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    run(
      () => renewTenant({ tenantId: tenant.id, days: Number(data.get("days")) || 365 }),
      () => onSuccess("Acces prelungit.")
    );
  };

  const toggleStatus = () =>
    run(
      () => setTenantStatus({ tenantId: tenant.id, status: tenant.status === "suspended" ? "active" : "suspended" }),
      () => onSuccess(tenant.status === "suspended" ? "Client reactivat." : "Client suspendat.")
    );

  const remove = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    run(
      () => deleteTenant({ tenantId: tenant.id, confirmSlug }),
      () => onSuccess("Client șters definitiv.")
    );
  };

  const copyKey = async () => {
    if (!generatedKey) return;
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
    } catch {
      onError("Nu am putut copia. Selectează cheia manual.");
    }
  };

  const copyAdminUrl = async () => {
    const url = `${window.location.origin}/${tenant.slug}/admin`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedAdmin(true);
      onSuccess("Linkul de admin a fost copiat.");
    } catch {
      onError("Nu am putut copia linkul. Selectează-l manual.");
    }
  };

  return (
    <article className="glass rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl">{tenant.displayName}</h3>
            <Badge tenant={tenant} />
          </div>
          <p className="mt-1 text-sm text-ink/65">
            <a href={`/${tenant.slug}`} target="_blank" rel="noreferrer" className="underline decoration-gold underline-offset-4">
              /{tenant.slug}
            </a>
            {" · "}activat {formatDate(tenant.activatedAt)}
            {" · "}expiră {formatDate(tenant.expiresAt)}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/65">
            <span>Admin client:</span>
            <a href={`/${tenant.slug}/admin`} target="_blank" rel="noreferrer" className="underline decoration-gold underline-offset-4">
              /{tenant.slug}/admin
            </a>
            <button
              type="button"
              onClick={copyAdminUrl}
              aria-label="Copiază linkul de admin"
              className="rounded p-1 text-ink/60 transition-colors hover:bg-ink/10 hover:text-ink"
            >
              {copiedAdmin ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
            </button>
          </p>
          <p className="mt-1 text-xs text-ink/55">
            {tenant.admins.length} cont{tenant.admins.length === 1 ? "" : "uri"} · {openKeys} chei
            nefolosite
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={disabled || pending} onClick={toggleStatus}>
          {tenant.status === "suspended" ? "Reactivează" : "Suspendă"}
        </Button>
      </div>

      {isExpired && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-700/40 bg-red-700/10 p-3 text-sm text-red-800"
        >
          <strong>Expirat.</strong> Site-ul public și panoul clientului afișează „Invitația nu este
          disponibilă”. Folosește <strong>„Prelungește”</strong> (mai jos) ca să reactivezi accesul.
          {tenant.status === "suspended" && " „Reactivează” doar schimbă starea, nu prelungește perioada."}
        </p>
      )}

      {tenant.admins.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 text-xs text-ink/70">
          {tenant.admins.map((admin) => (
            <li key={admin.email} className="rounded-full border border-ink/15 bg-ink/5 px-3 py-1">
              <ShieldCheck className="mr-1 inline size-3" aria-hidden="true" />
              {admin.email}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={generate} className="space-y-3 rounded-lg border border-ink/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="size-4" aria-hidden="true" /> Cheie de acces
          </p>
          <DurationPicker idPrefix={`days-${tenant.id}`} name="durationDays" defaultDays={365} />
          <div className="space-y-1">
            <Label htmlFor={`label-${tenant.id}`} className="text-xs">
              Etichetă (opțional)
            </Label>
            <Input id={`label-${tenant.id}`} name="label" maxLength={120} placeholder="Ana & Stefan" />
          </div>
          <Button type="submit" disabled={disabled || pending} size="sm" className="bg-ink text-sea">
            Generează cheia
          </Button>
          {generatedKey && (
            <div className="flex items-center gap-2 rounded-md border border-gold/45 bg-gold/10 px-3 py-2">
              <code className="flex-1 select-all break-all font-mono text-sm">{generatedKey}</code>
              <Button type="button" size="icon" variant="ghost" onClick={copyKey} aria-label="Copiază cheia">
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              </Button>
            </div>
          )}
        </form>

        <form onSubmit={addAdmin} className="space-y-3 rounded-lg border border-ink/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="size-4" aria-hidden="true" /> Cont direct
          </p>
          <div className="space-y-1">
            <Label htmlFor={`email-${tenant.id}`} className="text-xs">
              Email
            </Label>
            <Input id={`email-${tenant.id}`} name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`pass-${tenant.id}`} className="text-xs">
              Parolă
            </Label>
            <Input id={`pass-${tenant.id}`} name="password" type="text" minLength={8} required />
          </div>
          <DurationPicker idPrefix={`adm-days-${tenant.id}`} name="durationDays" label="Durată acces" defaultDays={365} />
          <Button type="submit" disabled={disabled || pending} size="sm" className="bg-ink text-sea">
            Creează contul
          </Button>
        </form>
      </div>

      <form onSubmit={renew} className="mt-4 space-y-3 rounded-lg border border-ink/10 p-4">
        <DurationPicker idPrefix={`renew-${tenant.id}`} name="days" label="Prelungește cu" defaultDays={365} />
        <Button type="submit" variant="outline" size="sm" disabled={disabled || pending}>
          <RefreshCw aria-hidden="true" /> Prelungește
        </Button>
      </form>

      {tenant.keys.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-ink/70">
            Chei ({tenant.keys.length})
          </summary>
          <ul className="mt-3 space-y-1 text-xs text-ink/65">
            {tenant.keys.map((key) => (
              <li key={key.id} className="flex flex-wrap gap-x-3">
                <span>{durationLabel(key.durationDays)}</span>
                <span>{key.label ?? "fără etichetă"}</span>
                <span>
                  {key.revokedAt
                    ? "revocată"
                    : key.usedAt
                      ? `folosită ${formatDate(key.usedAt)}${key.usedByEmail ? ` de ${key.usedByEmail}` : ""}`
                      : "nefolosită"}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <details className="mt-4 rounded-lg border border-red-700/30 bg-red-700/5 p-4 text-sm">
        <summary className="cursor-pointer font-medium text-red-800">Șterge clientul</summary>
        <p className="mt-2 text-ink/70">
          Șterge definitiv nunta „{tenant.displayName}”: confirmările, invitații, mesele, bugetul,
          poza invitației, cheile nefolosite și conturile care aparțin doar acestei nunți.
          Conturile folosite și de altă nuntă sunt păstrate. Acțiunea nu poate fi anulată.
        </p>
        <form onSubmit={remove} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor={`del-${tenant.id}`} className="text-xs">
              Scrie „{tenant.slug}” ca să confirmi
            </Label>
            <Input
              id={`del-${tenant.id}`}
              name="confirmSlug"
              value={confirmSlug}
              onChange={(event) => setConfirmSlug(event.target.value)}
              placeholder={tenant.slug}
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={disabled || pending || confirmSlug.trim().toLowerCase() !== tenant.slug}
            className="border-red-700/50 text-red-800 hover:bg-red-700/10"
          >
            <Trash2 aria-hidden="true" /> Șterge definitiv
          </Button>
        </form>
      </details>
    </article>
  );
}
