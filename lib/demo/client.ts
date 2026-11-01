/**
 * DEMO MODE — a tiny stand-in for the Supabase client, backed by lib/demo/store.ts.
 * Supports only the calls this app makes (from/rpc/auth).
 */
import { cookies } from "next/headers";
import { TABLE_CAPACITY } from "@/lib/admin-config";
import { DEMO_COOKIE, DEMO_EMAIL, DEMO_PASSWORD } from "./mode";
import type { EventSettings } from "@/lib/event-settings";
import * as store from "./store";

type Result<T = unknown> = { data: T; error: { message: string } | null };

const ok = <T,>(data: T): Result<T> => ({ data, error: null });
const fail = (message: string): Result<null> => ({ data: null, error: { message } });

class DemoQuery implements PromiseLike<Result<unknown>> {
  private op: "select" | "insert" | "delete" | "update" = "select";
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private filters: [string, unknown][] = [];
  private orderBy: { column: string; ascending: boolean } = { column: "", ascending: true };

  constructor(private readonly table: string) {}

  select(_columns?: string) {
    this.op = "select";
    return this;
  }

  insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.op = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(_n: number) {
    return this;
  }

  /** Supabase's "zero or one row" helper — used by /admin/settings. */
  maybeSingle() {
    const result = this.run();
    if (result.error) return Promise.resolve(result);
    const data = Array.isArray(result.data) ? (result.data[0] ?? null) : (result.data ?? null);
    return Promise.resolve({ data, error: null } as Result<unknown>);
  }

  private run(): Result<unknown> {
    const idFilter = this.filters.find(([c]) => c === "id")?.[1];

    switch (this.table) {
      case "rsvps": {
        if (this.op === "delete") {
          if (typeof idFilter === "string") store.deleteRsvp(idFilter);
          return ok(null);
        }
        return ok(store.listRsvps(this.orderBy.column ? this.orderBy : undefined));
      }

      case "expenses": {
        if (this.op === "insert") {
          const row = (Array.isArray(this.payload) ? this.payload[0] : this.payload) as {
            item_name: string;
            category: string;
            total_cost: number;
            amount_paid: number;
            notes: string | null;
          };
          return ok(store.insertExpense(row));
        }
        if (this.op === "delete") {
          if (typeof idFilter === "string") store.deleteExpense(idFilter);
          return ok(null);
        }
        return ok(store.listExpenses());
      }

      case "seating_people":
        return ok(store.listSeating());

      case "guests": {
        if (this.op === "delete") {
          if (typeof idFilter === "string") store.deleteImportedGuest(idFilter);
          return ok(null);
        }
        return ok(store.listGuestNames());
      }

      case "event_settings": {
        if (this.op === "update") {
          const patch = (Array.isArray(this.payload) ? this.payload[0] : this.payload) ?? {};
          return ok([store.updateEventSettings(patch as Partial<EventSettings>)]);
        }
        return ok([store.getEventSettings()]);
      }

      case "venue_report":
        return ok(store.venueReport());

      case "locations":
        return ok([]);

      default:
        return ok([]);
    }
  }

  then<TResult1 = Result<unknown>, TResult2 = never>(
    onfulfilled?: ((value: Result<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

type DemoSession = { user: { id: string; email: string } } | null;

async function readSession(): Promise<DemoSession> {
  try {
    const jar = await cookies();
    const signedIn = jar.get(DEMO_COOKIE)?.value === "1";
    return signedIn ? { user: { id: "demo-admin", email: DEMO_EMAIL } } : null;
  } catch {
    return null;
  }
}

export function createDemoClient() {
  return {
    from(table: string) {
      return new DemoQuery(table);
    },

    async rpc(name: string, args: Record<string, unknown> = {}): Promise<Result<unknown>> {
      switch (name) {
        case "is_admin":
          return ok(true);

        case "submit_rsvp":
          return ok(
            store.submitRsvp({
              name: String(args.p_name ?? ""),
              attending: Boolean(args.p_attending),
              message: String(args.p_message ?? ""),
              guests: (args.p_guests as { name: string; isChild?: boolean }[]) ?? [],
            })
          );

        case "check_rsvp_status":
          return ok(store.checkRsvpStatus(String(args.p_name ?? "")));

        case "add_payment": {
          const payment = store.addPayment(String(args.p_id ?? ""), Number(args.p_amount ?? 0));
          return payment.error ? fail(payment.error.message) : ok(null);
        }

        case "import_guests": {
          const names = ((args.p_guests as { full_name: string }[]) ?? []).map((g) => g.full_name);
          return ok(store.importGuests(names));
        }

        case "assign_table": {
          const res = store.assignTable(
            String(args.p_kind ?? ""),
            String(args.p_id ?? ""),
            (args.p_table as number | null) ?? null,
            Number(args.p_cap ?? TABLE_CAPACITY)
          );
          return res.error ? fail(res.error.message) : ok(null);
        }

        case "public_seating":
          return ok(store.publicSeating());

        default:
          return ok(null);
      }
    },

    auth: {
      async getUser() {
        return { data: { user: await readSession() }, error: null };
      },

      async signInWithPassword({ email, password }: { email: string; password: string }) {
        if (!email.trim() || password !== DEMO_PASSWORD) {
          return { data: null, error: { message: "Invalid login credentials" } };
        }
        try {
          const jar = await cookies();
          jar.set(DEMO_COOKIE, "1", { path: "/", httpOnly: true, sameSite: "lax" });
        } catch {
          // read-only context
        }
        return { data: { user: { id: "demo-admin", email } }, error: null };
      },

      async signOut() {
        try {
          const jar = await cookies();
          jar.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
        } catch {
          // read-only context
        }
        return { error: null };
      },
    },
  };
}
