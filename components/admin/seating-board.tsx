"use client";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor,
  pointerWithin, rectIntersection, useDraggable, useDroppable, useSensor, useSensors,
  type CollisionDetection, type DragEndEvent, type DragStartEvent,
  type MouseSensorOptions, type TouchSensorOptions,
} from "@dnd-kit/core";
import { Plus, Undo2, X } from "lucide-react";
import { motion } from "framer-motion";
import { addTable, assignTable, deleteGuest, deleteTable, setTableCapacity } from "@/app/admin/seating/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast, useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { notifyAdminDataChanged } from "@/lib/admin-data";
import {
  DEFAULT_TABLE_CAPACITY,
  MAX_TABLE_CAPACITY,
  MIN_TABLE_CAPACITY,
  nextFreeTableNumber,
  type SeatingTable,
} from "@/lib/seating";

export type Kind = "rsvp" | "plus" | "guest";
export type Person = { id: string; kind: Kind; name: string; table: number | null };

const keyOf = (p: Person) => `${p.kind}:${p.id}`;
const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const BADGE: Record<Kind, string> = { rsvp: "", plus: "însoțitor", guest: "importat" };

/** Shown when the server action itself fails (offline, request aborted). */
const NETWORK_ERROR = "Conexiunea a eșuat. Încearcă din nou.";

// Pointer position first (mouse/touch), element overlap as the keyboard fallback
const detect: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

// Module-level options keep the sensor descriptors stable across renders, so
// drag state changes do not rebuild the DndContext sensors.
const MOUSE_SENSOR_OPTIONS: MouseSensorOptions = { activationConstraint: { distance: 6 } };
const TOUCH_SENSOR_OPTIONS: TouchSensorOptions = { activationConstraint: { delay: 200, tolerance: 8 } };

// Shared empty list so tables without members keep a stable `members` prop.
const EMPTY_MEMBERS: Person[] = [];

/**
 * Groups people by table. Tables whose members are the same objects in the
 * same order reuse the previous array from `previous`, so their memoized card
 * does not receive a new prop after an unrelated move.
 */
function buildMembers(list: Person[], previous: Map<number, Person[]>) {
  const next = new Map<number, Person[]>();
  list.forEach((p) => {
    if (p.table === null) return;
    const members = next.get(p.table);
    if (members) members.push(p);
    else next.set(p.table, [p]);
  });

  next.forEach((members, number) => {
    const old = previous.get(number);
    if (old && old.length === members.length && old.every((p, i) => p === members[i])) {
      next.set(number, old);
    }
  });
  return next;
}

const PersonChip = memo(function PersonChip({
  p,
  onDelete,
  onUnassign,
}: {
  p: Person;
  onDelete?: (p: Person) => void;
  onUnassign?: (p: Person) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: keyOf(p) });
  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-center gap-1"
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={cx(
          "flex-1 cursor-grab select-none rounded-md border border-ink/20 bg-sea/80 px-2 py-1.5 text-sm transition-[background-color,border-color,box-shadow] duration-200 ease-out hover:border-gold/40 hover:bg-mist/60 active:cursor-grabbing",
          isDragging && "opacity-40"
        )}
      >
        {p.name}
        {BADGE[p.kind] && <span className="ml-2 text-xs text-ink/60">{BADGE[p.kind]}</span>}
      </div>
      {onUnassign && (
        <button type="button" onClick={() => onUnassign(p)} aria-label={`Mută-l pe ${p.name} în Fără masă`}
          title="Mută în Fără masă"
          className="rounded-md p-1.5 text-ink/50 transition-[background-color,color,transform] duration-200 ease-out hover:-translate-y-px hover:bg-ink/10 hover:text-gold active:translate-y-0">
          <Undo2 className="size-4" />
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={() => onDelete(p)} aria-label={`Scoate-l pe ${p.name} din listă`}
          className="rounded-md p-1.5 text-ink/60 transition-[background-color,color,transform] duration-200 ease-out hover:-translate-y-px hover:bg-ink/10 hover:text-ink active:translate-y-0">
          <X className="size-4" />
        </button>
      )}
    </motion.li>
  );
});

const TableCard = memo(function TableCard({
  table,
  members,
  onDelete,
  onCapacityChange,
  onUnassign,
}: {
  table: SeatingTable;
  members: Person[];
  onDelete: (table: SeatingTable) => void;
  onCapacityChange: (number: number, capacity: number) => void;
  onUnassign: (person: Person) => void;
}) {
  const { number: n, capacity } = table;
  const { setNodeRef, isOver } = useDroppable({ id: `table:${n}` });
  const full = members.length >= capacity;

  const commit = (input: HTMLInputElement) => {
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < MIN_TABLE_CAPACITY || value > MAX_TABLE_CAPACITY) {
      input.value = String(capacity);
      return;
    }
    if (value !== capacity) onCapacityChange(n, value);
  };

  return (
    <motion.section
      ref={setNodeRef}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`Masa ${n}, ${members.length} din ${capacity} locuri ocupate`}
      className={cx(
        "glass-soft card-hover group relative rounded-2xl border p-3",
        isOver
          ? (full ? "border-red-500 bg-red-600/10" : "border-gold bg-gold/10")
          : "border-ink/15"
      )}
    >
      <button
        type="button"
        onClick={() => onDelete(table)}
        aria-label={`Șterge masa ${n}`}
        className="absolute right-2 top-2 rounded-md p-1.5 text-ink/40 opacity-60 transition-opacity duration-200 hover:bg-ink/10 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
      >
        <X className="size-4" />
      </button>
      <svg viewBox="0 0 120 120" className="mx-auto size-28" aria-hidden="true">
        <circle cx="60" cy="60" r="30" className="fill-mist stroke-ink/30" />
        {Array.from({ length: capacity }, (_, i) => {
          const a = (i / capacity) * 2 * Math.PI - Math.PI / 2;
          return (
            <circle key={i} cx={60 + 46 * Math.cos(a)} cy={60 + 46 * Math.sin(a)} r="6"
              className={i < members.length ? "fill-gold" : "fill-ink/15"} />
          );
        })}
        <text x="60" y="58" textAnchor="middle" className="fill-ink font-display text-[20px]">{n}</text>
        <text x="60" y="74" textAnchor="middle" className="fill-ink text-[11px]">
          {full ? "Plină" : `${members.length}/${capacity}`}
        </text>
      </svg>
      <ul className="mt-2 space-y-1">
        {members.map((p) => <PersonChip key={keyOf(p)} p={p} onUnassign={onUnassign} />)}
      </ul>
      <div className="mt-2 flex items-center justify-center gap-1 text-xs text-ink/60">        <label htmlFor={`capacity-${n}`}>Locuri</label>
        <input
          id={`capacity-${n}`}
          key={capacity}
          type="number"
          inputMode="numeric"
          min={MIN_TABLE_CAPACITY}
          max={MAX_TABLE_CAPACITY}
          defaultValue={capacity}
          onBlur={(e) => commit(e.currentTarget)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
          aria-label={`Capacitatea mesei ${n}`}
          className="w-12 rounded border border-ink/20 bg-transparent px-1 py-0.5 text-center text-xs tabular-nums focus:border-gold focus:outline-none"
        />
      </div>
    </motion.section>
  );
});

function AddTableDialog({
  open,
  suggestedNumber,
  onClose,
  onAdd,
}: {
  open: boolean;
  suggestedNumber: number | null;
  onClose: () => void;
  onAdd: (number: number | null, capacity: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState(String(DEFAULT_TABLE_CAPACITY));

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setNumber(suggestedNumber ? String(suggestedNumber) : "");
      setCapacity(String(DEFAULT_TABLE_CAPACITY));
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open, suggestedNumber]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cap = Number(capacity);
    const num = number.trim() === "" ? null : Number(number);
    onAdd(num !== null && Number.isFinite(num) ? num : null, Number.isFinite(cap) ? cap : DEFAULT_TABLE_CAPACITY);
  };

  return (
    <dialog ref={ref} onClose={onClose}
      className="glass-bar m-auto w-[min(92vw,26rem)] rounded-xl p-6 text-ink backdrop:bg-black/50">
      {open && (
        <form onSubmit={submit} className="space-y-4">
          <h2 className="font-display text-2xl">Adaugă o masă</h2>
          <div className="space-y-1">
            <Label htmlFor="new-table-number">Numărul mesei</Label>
            <Input id="new-table-number" inputMode="numeric" value={number}
              onChange={(e) => setNumber(e.target.value)} placeholder="Automat" />
            <p className="text-xs text-ink/60">Lasă gol pentru primul număr liber.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-table-capacity">Locuri</Label>
            <Input id="new-table-capacity" inputMode="numeric" value={capacity}
              onChange={(e) => setCapacity(e.target.value)} />
            <p className="text-xs text-ink/60">Între {MIN_TABLE_CAPACITY} și {MAX_TABLE_CAPACITY}.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Anulează</Button>
            <Button type="submit" className="bg-ink text-sea hover:bg-ink/85">
              <Plus className="size-4" /> Adaugă masa
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}

function DeleteTableDialog({
  table,
  guestCount,
  onClose,
  onConfirm,
}: {
  table: SeatingTable | null;
  guestCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (table && !d.open) d.showModal();
    if (!table && d.open) d.close();
  }, [table]);

  return (
    <dialog ref={ref} onClose={onClose}
      className="glass-bar m-auto w-[min(92vw,26rem)] rounded-xl p-6 text-ink backdrop:bg-black/50">
      {table && (
        <div className="space-y-4">
          <h2 className="font-display text-2xl">Ștergi masa {table.number}?</h2>
          <p className="text-sm text-ink/75">
            {guestCount > 0
              ? `${guestCount} ${guestCount === 1 ? "invitat revine" : "invitați revin"} în lista „Fără masă”. Nimeni nu este șters.`
              : "Masa este goală. Acțiunea nu poate fi anulată."}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Anulează</Button>
            <Button type="button" onClick={onConfirm} className="bg-red-500 text-white hover:bg-red-500/90">
              Șterge masa
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}

export function SeatingBoard({
  initial,
  initialTables,
}: {
  initial: Person[];
  initialTables: SeatingTable[];
}) {
  const [people, setPeople] = useState(initial);
  const [tables, setTables] = useState(initialTables);
  const [active, setActive] = useState<Person | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<SeatingTable | null>(null);
  const { toast, show, dismiss } = useToast();

  // Shared data can arrive from another section (delete, import, another admin).
  // Apply it only when no optimistic write is in flight, so a background
  // refresh never undoes a change the couple just made.
  const appliedPeople = useRef(initial);
  const appliedTables = useRef(initialTables);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (pendingCount !== 0) return;
    if (appliedPeople.current !== initial) {
      appliedPeople.current = initial;
      setPeople(initial);
    }
    if (appliedTables.current !== initialTables) {
      appliedTables.current = initialTables;
      setTables(initialTables);
    }
  }, [initial, initialTables, pendingCount]);

  // The expensive filtering waits for the typing to settle; the input itself
  // still updates on every keystroke.
  const debouncedQ = useDebouncedValue(q, 300);

  // Refs keep the optimistic handlers stable (and therefore keep the memoized
  // table cards from re-rendering on every unrelated state change).
  const peopleRef = useRef(people);
  const tablesRef = useRef(tables);
  useEffect(() => { peopleRef.current = people; }, [people]);
  useEffect(() => { tablesRef.current = tables; }, [tables]);

  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE_SENSOR_OPTIONS),
    // a short press-and-hold on touch screens, so normal scrolling still works
    useSensor(TouchSensor, TOUCH_SENSOR_OPTIONS),
    useSensor(KeyboardSensor)
  );

  // Rebuild the member lists, but keep the array identity for every table whose
  // members did not change, so React.memo skips those cards entirely.
  const [membersIndex, setMembersIndex] = useState(() => ({
    source: people,
    byTable: buildMembers(people, new Map()),
  }));
  if (membersIndex.source !== people) {
    setMembersIndex((prev) => ({ source: people, byTable: buildMembers(people, prev.byTable) }));
  }
  const byTable = membersIndex.byTable;

  const { setNodeRef: poolRef, isOver: overPool } = useDroppable({ id: "pool" });

  const pool = useMemo(() => {
    const needle = debouncedQ.trim().toLowerCase();
    return people.filter(
      (p) => p.table === null && (!needle || p.name.toLowerCase().includes(needle)),
    );
  }, [people, debouncedQ]);

  const total = people.length;
  const seated = useMemo(() => people.filter((p) => p.table !== null).length, [people]);
  const suggestedNumber = useMemo(() => nextFreeTableNumber(tables), [tables]);
  const stats = useMemo(
    () => [["Participanți", total], ["Așezați", seated], ["Nealocați", total - seated]] as const,
    [total, seated],
  );

  // Optimistic writes update the ref and the state in the same tick, before
  // the request leaves the browser. Passing an updater keeps concurrent
  // actions against different rows from overwriting each other.
  const commitPeople = useCallback((updater: (list: Person[]) => Person[]) => {
    const next = updater(peopleRef.current);
    peopleRef.current = next;
    setPeople(next);
  }, []);
  const commitTables = useCallback((updater: (list: SeatingTable[]) => SeatingTable[]) => {
    const next = updater(tablesRef.current);
    tablesRef.current = next;
    setTables(next);
  }, []);

  const movePerson = useCallback((p: Person, target: number | null) => {
    setMsg(null);
    const key = keyOf(p);
    const original = peopleRef.current.find((x) => keyOf(x) === key)?.table ?? p.table;

    commitPeople((list) => list.map((x) => (keyOf(x) === key ? { ...x, table: target } : x)));
    setPendingCount((n) => n + 1);
    void (async () => {
      const r = await assignTable(p.kind, p.id, target).catch(() => ({
        ok: false as const,
        error: NETWORK_ERROR,
      }));
      setPendingCount((n) => n - 1);
      if (!r.ok) {
        // Roll back only this person, so a concurrent move stays intact.
        commitPeople((list) => list.map((x) => (keyOf(x) === key ? { ...x, table: original } : x)));
        show(r.error, "error");
      } else {
        notifyAdminDataChanged();
      }
    })();
  }, [commitPeople, show]);

  const onDragStart = useCallback((e: DragStartEvent) => {
    setMsg(null);
    setActive(peopleRef.current.find((p) => keyOf(p) === e.active.id) ?? null);
  }, []);

  const onDragEnd = useCallback((e: DragEndEvent) => {
    setActive(null);
    if (!e.over) return;
    const p = peopleRef.current.find((x) => keyOf(x) === e.active.id);
    if (!p) return;
    const target = e.over.id === "pool" ? null : Number(String(e.over.id).split(":")[1]);
    if (target === p.table) return;

    if (target !== null) {
      const targetTable = tablesRef.current.find((t) => t.number === target);
      if (!targetTable) {
        setMsg(`Masa ${target} nu mai există.`);
        return;
      }
      const occupied = peopleRef.current.filter((x) => x.table === target).length;
      if (occupied >= targetTable.capacity) {
        setMsg(`Masa ${target} este plină (${targetTable.capacity} din ${targetTable.capacity}).`);
        return;
      }
    }
    movePerson(p, target);
  }, [movePerson]);

  const onDragCancel = useCallback(() => setActive(null), []);

  const unassignPerson = useCallback((p: Person) => {
    if (p.table !== null) movePerson(p, null);
  }, [movePerson]);

  const deletePerson = useCallback((p: Person) => {
    setMsg(null);
    const key = keyOf(p);
    const list = peopleRef.current;
    const index = list.findIndex((x) => keyOf(x) === key);
    if (index < 0) return;
    const removed = list[index]!;

    commitPeople((prev) => prev.filter((x) => keyOf(x) !== key));
    setPendingCount((n) => n + 1);
    void (async () => {
      const r = await deleteGuest(p.id).catch(() => ({ ok: false as const, error: NETWORK_ERROR }));
      setPendingCount((n) => n - 1);
      if (!r.ok) {
        commitPeople((prev) => {
          if (prev.some((x) => keyOf(x) === key)) return prev;
          const next = [...prev];
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        });
        show(r.error, "error");
      } else {
        notifyAdminDataChanged();
      }
    })();
  }, [commitPeople, show]);

  const handleAdd = useCallback((number: number | null, capacity: number) => {
    setMsg(null);
    setAdding(false);
    setPendingCount((n) => n + 1);
    void (async () => {
      const r = await addTable(number, capacity).catch(() => ({ ok: false as const, error: NETWORK_ERROR }));
      setPendingCount((n) => n - 1);
      if (!r.ok) { show(r.error, "error"); return; }
      if (typeof r.number === "number") {
        const added = { number: r.number, capacity };
        commitTables((prev) => [...prev, added].sort((a, b) => a.number - b.number));
      }
      notifyAdminDataChanged();
    })();
  }, [commitTables, show]);

  const handleDelete = useCallback(() => {
    const table = deleting;
    if (!table) return;
    setDeleting(null);
    setMsg(null);

    // Remember exactly who this delete unseats, so the rollback does not move
    // people who were dragged elsewhere while the request was in flight.
    const movedKeys = new Set(
      peopleRef.current.filter((p) => p.table === table.number).map(keyOf),
    );
    commitTables((prev) => prev.filter((t) => t.number !== table.number));
    commitPeople((prev) => prev.map((p) => (p.table === table.number ? { ...p, table: null } : p)));

    setPendingCount((n) => n + 1);
    void (async () => {
      const r = await deleteTable(table.number).catch(() => ({ ok: false as const, error: NETWORK_ERROR }));
      setPendingCount((n) => n - 1);
      if (!r.ok) {
        commitTables((prev) =>
          prev.some((t) => t.number === table.number)
            ? prev
            : [...prev, table].sort((a, b) => a.number - b.number),
        );
        commitPeople((prev) =>
          prev.map((p) => (p.table === null && movedKeys.has(keyOf(p)) ? { ...p, table: table.number } : p)),
        );
        show(r.error, "error");
      } else {
        notifyAdminDataChanged();
      }
    })();
  }, [deleting, commitPeople, commitTables, show]);

  const handleCapacity = useCallback((number: number, capacity: number) => {
    setMsg(null);
    const previous = tablesRef.current.find((t) => t.number === number)?.capacity ?? capacity;
    commitTables((prev) => prev.map((t) => (t.number === number ? { ...t, capacity } : t)));
    setPendingCount((n) => n + 1);
    void (async () => {
      const r = await setTableCapacity(number, capacity).catch(() => ({ ok: false as const, error: NETWORK_ERROR }));
      setPendingCount((n) => n - 1);
      if (!r.ok) {
        commitTables((prev) =>
          prev.map((t) =>
            t.number === number && t.capacity === capacity ? { ...t, capacity: previous } : t,
          ),
        );
        show(r.error, "error");
      } else {
        notifyAdminDataChanged();
      }
    })();
  }, [commitTables, show]);

  return (
    // A fixed id keeps @dnd-kit's generated aria-describedby stable between the
    // server HTML and the client hydration (otherwise it uses a module counter).
    <DndContext id="seating-board" sensors={sensors} collisionDetection={detect} onDragStart={onDragStart}
      onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
      <dl className="mt-6 grid grid-cols-3 gap-3">
        {stats.map(([l, v]) => (
          <div key={l} className="glass-soft card-hover rounded-lg p-4">
            <dd className={cx("font-display text-3xl tabular-nums", l === "Nealocați" && v > 0 && "text-gold")}>{v}</dd>
            <dt className="text-sm text-ink/70">{l}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-3 h-2 overflow-hidden rounded bg-ink/15" role="progressbar" aria-label="Invitați repartizați la mese"
        aria-valuenow={seated} aria-valuemin={0} aria-valuemax={total}>
        <div
          className="h-full w-full origin-left rounded bg-gold transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${total ? seated / total : 0})` }}
        />
      </div>
      <p role="status" className="mt-3 min-h-6 text-sm text-red-700">{msg}</p>

      <div className="mt-2 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <section ref={poolRef} aria-label="Invitați fără masă"
          className={cx(
            "glass-soft rounded-2xl border p-3 lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:self-start lg:overflow-y-auto",
            overPool ? "border-gold bg-gold/10" : "border-ink/15"
          )}>
          <h2 className="font-display text-xl">Fără masă <span className="text-base text-ink/60">({total - seated})</span></h2>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută după nume"
            aria-label="Caută în lista fără masă" className="mt-2 w-full rounded-md border border-ink/30 bg-transparent px-3 py-2 text-sm transition-[border-color,box-shadow] duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25" />
          <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto lg:max-h-none">
            {pool.map((p) => (
              <PersonChip
                key={keyOf(p)}
                p={p}
                onDelete={p.kind === "guest" ? deletePerson : undefined}
                onUnassign={unassignPerson}
              />
            ))}
          </ul>
          {pool.length === 0 && (
            <p className="mt-3 text-sm text-ink/70">{total - seated === 0 ? "Toți au loc." : "Niciun rezultat."}</p>
          )}
          <p className="mt-3 text-xs text-ink/60">Trage un nume la o masă sau apasă ↩ ca să-l retragi în „Fără masă”.</p>
        </section>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-ink/60">{tables.length} {tables.length === 1 ? "masă" : "mese"}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Adaugă masă
            </Button>
          </div>
          {tables.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink/20 p-6 text-center text-ink/60">
              Nu există mese. Adaugă prima masă.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {tables.map((t) => (
                <TableCard
                  key={t.number}
                  table={t}
                  members={byTable.get(t.number) ?? EMPTY_MEMBERS}
                  onDelete={setDeleting}
                  onCapacityChange={handleCapacity}
                  onUnassign={unassignPerson}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddTableDialog open={adding} suggestedNumber={suggestedNumber} onClose={() => setAdding(false)} onAdd={handleAdd} />
      <DeleteTableDialog
        table={deleting}
        guestCount={deleting ? byTable.get(deleting.number)?.length ?? 0 : 0}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />

      <DragOverlay>
        {active && <div className="rounded-md bg-ink px-3 py-1.5 text-sm text-sea shadow-lg">{active.name}</div>}
      </DragOverlay>

      <Toast toast={toast} onDismiss={dismiss} />
    </DndContext>
  );
}
