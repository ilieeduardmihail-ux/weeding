"use client";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminRealtime } from "@/components/admin/admin-realtime";
import { Toast, useToast } from "@/components/ui/toast";
import { mergeById } from "@/lib/merge-by-id";
import { notifyAdminDataChanged } from "@/lib/admin-data";
import { deleteRsvp, type DeleteRsvpResult } from "@/app/admin/actions";

export type GuestRow = {
  id: string;
  name: string;
  attending: boolean;
  message: string | null;
  created_at: string;
  table_number: number | null;
  rsvp_guests: { id: string; name: string; is_child: boolean; table_number: number | null }[];
};

const NETWORK_ERROR = "Conexiunea a eșuat. Încearcă din nou.";

const tableLabel = (n: number | null) => (n === null ? "fără masă" : `Masa ${n}`);

// Fixed time zone so the server HTML and the hydrated client agree.
const dateFormat = new Intl.DateTimeFormat("ro-RO", {
  timeZone: "Europe/Bucharest",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});
const dateLabel = (iso: string) => dateFormat.format(new Date(iso));

const sameGuest = (a: GuestRow["rsvp_guests"][number], b: GuestRow["rsvp_guests"][number]) =>
  a.id === b.id &&
  a.name === b.name &&
  a.is_child === b.is_child &&
  a.table_number === b.table_number;

const sameRow = (a: GuestRow, b: GuestRow) =>
  a.id === b.id &&
  a.name === b.name &&
  a.attending === b.attending &&
  a.message === b.message &&
  a.created_at === b.created_at &&
  a.table_number === b.table_number &&
  a.rsvp_guests.length === b.rsvp_guests.length &&
  a.rsvp_guests.every((guest, index) => sameGuest(guest, b.rsvp_guests[index]!));

const RowView = memo(function RowView({
  row,
  onDelete,
}: {
  row: GuestRow;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="border-b border-ink/10 align-top transition-colors duration-200 ease-out last:border-0 hover:bg-ink/5">
      <td className="py-3 pr-4">
        <p>{row.name}</p>
        <p className="text-sm text-ink/60">
          {dateLabel(row.created_at)}
          {row.attending && `, ${tableLabel(row.table_number)}`}
        </p>
      </td>
      <td className="pr-4">{row.attending ? "Participă" : "Nu participă"}</td>
      <td className="pr-4 text-sm">
        {row.rsvp_guests.map((guest) => (
          <p key={guest.id}>
            {guest.name}
            {guest.is_child ? " (copil)" : ""}, {tableLabel(guest.table_number)}
          </p>
        ))}
      </td>
      <td className="pr-4 text-sm text-ink/75">{row.message}</td>
      <td>
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/rsvps/${row.id}/edit`}>Editează</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(row.id)}>
            Șterge
          </Button>
        </div>
      </td>
    </tr>
  );
});

export function GuestList({
  rows,
  edited,
  error,
}: {
  rows: GuestRow[];
  edited?: string;
  error?: string;
}) {
  const [store, setStore] = useState(() => ({ source: rows, items: rows }));
  const { toast, show, dismiss } = useToast();
  const pendingDeletes = useRef(new Set<string>());
  const itemsRef = useRef(store.items);

  useEffect(() => {
    itemsRef.current = store.items;
  }, [store.items]);

  // Background refreshes (realtime / polling) deliver new props. Reuse the
  // objects that did not change so memoized rows do not re-render, and keep
  // rows that are being deleted hidden until the request resolves.
  if (store.source !== rows) {
    setStore((prev) => {
      const incoming = rows.filter((row) => !pendingDeletes.current.has(row.id));
      return { source: rows, items: mergeById(prev.items, incoming, sameRow) };
    });
  }

  const remove = useCallback(
    async (id: string) => {
      const list = itemsRef.current;
      const index = list.findIndex((row) => row.id === id);
      if (index < 0) return;
      const removed = list[index]!;

      const next = list.filter((row) => row.id !== id);
      itemsRef.current = next;
      pendingDeletes.current.add(id);
      // Same-tick visual update, before the network request.
      setStore((prev) => ({ ...prev, items: prev.items.filter((row) => row.id !== id) }));

      let result: DeleteRsvpResult;
      try {
        result = await deleteRsvp(id);
      } catch {
        result = { ok: false, error: NETWORK_ERROR };
      }

      pendingDeletes.current.delete(id);
      if (!result.ok) {
        setStore((prev) => {
          if (prev.items.some((row) => row.id === id)) return prev;
          const restored = [...prev.items];
          restored.splice(Math.min(index, restored.length), 0, removed);
          itemsRef.current = restored;
          return { ...prev, items: restored };
        });
        show(result.error, "error");
      } else {
        // The row is already gone; refresh the shared dataset in the background
        // so the other admin sections see the deletion too.
        notifyAdminDataChanged();
      }
    },
    [show],
  );

  const stats = useMemo(() => {
    const yes = store.items.filter((row) => row.attending);
    const guests = yes.flatMap((row) => row.rsvp_guests);
    return [
      ["Răspunsuri", store.items.length],
      ["Refuzuri", store.items.length - yes.length],
      ["Participanți (total)", yes.length + guests.length],
      ["Copii", guests.filter((guest) => guest.is_child).length],
    ] as const;
  }, [store.items]);

  return (
    <>
      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="glass-soft card-hover rounded-lg p-5">
            <dd className="font-display text-4xl tabular-nums">{value}</dd>
            <dt className="text-sm text-ink/70">{label}</dt>
          </div>
        ))}
      </dl>

      <AdminRealtime />

      {edited && (
        <p role="status" className="mt-6 rounded-lg bg-mist p-4 text-ink">
          Răspunsul a fost actualizat. Pagina publică afișează acum datele noi.
        </p>
      )}
      {error === "missing" && (
        <p role="alert" className="mt-6 rounded-lg bg-red-500/15 p-4 text-red-200">
          Răspunsul nu mai există. Poate a fost șters între timp.
        </p>
      )}

      {store.items.length === 0 ? (
        <p className="mt-12 text-ink/70">
          Nu există încă răspunsuri. Trimite linkul site-ului ca să începi să primești confirmări.
        </p>
      ) : (
        <div className="glass-soft mt-10 overflow-x-auto rounded-xl px-4">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b border-ink/25 text-sm text-ink/70">
              <tr>
                <th className="py-2">Nume</th>
                <th>Status</th>
                <th>Însoțitori</th>
                <th>Mesaj</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {store.items.map((row) => (
                <RowView key={row.id} row={row} onDelete={remove} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </>
  );
}
