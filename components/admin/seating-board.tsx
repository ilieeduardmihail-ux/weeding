"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor,
  pointerWithin, rectIntersection, useDraggable, useDroppable, useSensor, useSensors,
  type CollisionDetection, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, X } from "lucide-react";
import { addTable, assignTable, deleteGuest, deleteTable, setTableCapacity } from "@/app/admin/seating/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Pointer position first (mouse/touch), element overlap as the keyboard fallback
const detect: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

function PersonChip({ p, onDelete }: { p: Person; onDelete?: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: keyOf(p) });
  return (
    <li className="flex items-center gap-1">
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={cx(
          "flex-1 cursor-grab select-none rounded-md border border-ink/20 bg-sea px-2 py-1.5 text-sm transition-colors duration-200 active:cursor-grabbing",
          isDragging && "opacity-40"
        )}
      >
        {p.name}
        {BADGE[p.kind] && <span className="ml-2 text-xs text-ink/60">{BADGE[p.kind]}</span>}
      </div>
      {onDelete && (
        <button type="button" onClick={onDelete} aria-label={`Scoate-l pe ${p.name} din listă`}
          className="rounded-md p-1.5 text-ink/60 transition-colors hover:bg-ink/10">
          <X className="size-4" />
        </button>
      )}
    </li>
  );
}

function TableCard({
  table,
  members,
  onDelete,
  onCapacityChange,
}: {
  table: SeatingTable;
  members: Person[];
  onDelete: () => void;
  onCapacityChange: (capacity: number) => void;
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
    if (value !== capacity) onCapacityChange(value);
  };

  return (
    <section
      ref={setNodeRef}
      aria-label={`Masa ${n}, ${members.length} din ${capacity} locuri ocupate`}
      className={cx(
        "group relative rounded-2xl border p-3 transition-all duration-200 ease-out",
        isOver
          ? (full ? "border-red-600 bg-red-600/10" : "border-gold bg-gold/10")
          : "border-ink/15 hover:border-gold/40 hover:shadow-lg hover:shadow-black/10"
      )}
    >
      <button
        type="button"
        onClick={onDelete}
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
        {members.map((p) => <PersonChip key={keyOf(p)} p={p} />)}
      </ul>
      <div className="mt-2 flex items-center justify-center gap-1 text-xs text-ink/60">
        <label htmlFor={`capacity-${n}`}>Locuri</label>
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
    </section>
  );
}

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
      className="m-auto w-[min(92vw,26rem)] rounded-xl bg-sea p-6 text-ink backdrop:bg-black/50">
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
      className="m-auto w-[min(92vw,26rem)] rounded-xl bg-sea p-6 text-ink backdrop:bg-black/50">
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
  const [, start] = useTransition();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // a short press-and-hold on touch screens, so normal scrolling still works
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const byTable = useMemo(() => {
    const m = new Map<number, Person[]>();
    people.forEach((p) => { if (p.table) m.set(p.table, [...(m.get(p.table) ?? []), p]); });
    return m;
  }, [people]);

  const { setNodeRef: poolRef, isOver: overPool } = useDroppable({ id: "pool" });
  const pool = people.filter((p) => p.table === null && p.name.toLowerCase().includes(q.toLowerCase()));
  const total = people.length;
  const seated = people.filter((p) => p.table !== null).length;
  const suggestedNumber = nextFreeTableNumber(tables);

  const onDragStart = (e: DragStartEvent) => {
    setMsg(null);
    setActive(people.find((p) => keyOf(p) === e.active.id) ?? null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    if (!e.over) return;
    const p = people.find((x) => keyOf(x) === e.active.id);
    if (!p) return;
    const target = e.over.id === "pool" ? null : Number(String(e.over.id).split(":")[1]);
    if (target === p.table) return;
    const targetTable = target === null ? null : tables.find((t) => t.number === target) ?? null;
    if (target !== null && !targetTable) {
      setMsg(`Masa ${target} nu mai există.`);
      return;
    }
    if (targetTable && (byTable.get(targetTable.number)?.length ?? 0) >= targetTable.capacity) {
      setMsg(`Masa ${target} este plină (${targetTable.capacity} din ${targetTable.capacity}).`);
      return;
    }
    const before = people;
    setPeople((ps) => ps.map((x) => (keyOf(x) === keyOf(p) ? { ...x, table: target } : x)));
    start(async () => {
      const r = await assignTable(p.kind, p.id, target);
      if (!r.ok) { setPeople(before); setMsg(r.error); }
    });
  };

  const removeGuest = (p: Person) => {
    const before = people;
    setPeople((ps) => ps.filter((x) => keyOf(x) !== keyOf(p)));
    start(async () => {
      const r = await deleteGuest(p.id);
      if (!r.ok) { setPeople(before); setMsg(r.error); }
    });
  };

  const handleAdd = (number: number | null, capacity: number) => {
    setMsg(null);
    setAdding(false);
    start(async () => {
      const r = await addTable(number, capacity);
      if (!r.ok) { setMsg(r.error); return; }
      if (typeof r.number === "number") {
        setTables((ts) => [...ts, { number: r.number as number, capacity }].sort((a, b) => a.number - b.number));
      }
    });
  };

  const handleDelete = () => {
    const table = deleting;
    if (!table) return;
    setDeleting(null);
    setMsg(null);
    const beforeTables = tables;
    const beforePeople = people;
    setTables((ts) => ts.filter((t) => t.number !== table.number));
    setPeople((ps) => ps.map((p) => (p.table === table.number ? { ...p, table: null } : p)));
    start(async () => {
      const r = await deleteTable(table.number);
      if (!r.ok) {
        setTables(beforeTables);
        setPeople(beforePeople);
        setMsg(r.error);
      }
    });
  };

  const handleCapacity = (number: number, capacity: number) => {
    setMsg(null);
    const before = tables;
    setTables((ts) => ts.map((t) => (t.number === number ? { ...t, capacity } : t)));
    start(async () => {
      const r = await setTableCapacity(number, capacity);
      if (!r.ok) { setTables(before); setMsg(r.error); }
    });
  };

  const stats = [["Participanți", total], ["Așezați", seated], ["Nealocați", total - seated]] as const;

  return (
    <DndContext sensors={sensors} collisionDetection={detect} onDragStart={onDragStart}
      onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
      <dl className="mt-6 grid grid-cols-3 gap-3">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-lg bg-mist/70 p-4">
            <dd className={cx("font-display text-3xl tabular-nums", l === "Nealocați" && v > 0 && "text-gold")}>{v}</dd>
            <dt className="text-sm text-ink/70">{l}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-3 h-2 rounded bg-ink/15" role="progressbar" aria-label="Invitați repartizați la mese"
        aria-valuenow={seated} aria-valuemin={0} aria-valuemax={total}>
        <div className="h-full rounded bg-gold transition-all duration-500 ease-in-out" style={{ width: `${total ? (seated / total) * 100 : 0}%` }} />
      </div>
      <p role="status" className="mt-3 min-h-6 text-sm text-red-300">{msg}</p>

      <div className="mt-2 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <section ref={poolRef} aria-label="Invitați fără masă"
          className={cx(
            "rounded-2xl border p-3 lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:self-start lg:overflow-y-auto",
            overPool ? "border-gold bg-gold/10" : "border-ink/15"
          )}>
          <h2 className="font-display text-xl">Fără masă <span className="text-base text-ink/60">({total - seated})</span></h2>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută după nume"
            aria-label="Caută în lista fără masă" className="mt-2 w-full rounded-md border border-ink/30 bg-transparent px-3 py-2 text-sm" />
          <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto lg:max-h-none">
            {pool.map((p) => (
              <PersonChip key={keyOf(p)} p={p} onDelete={p.kind === "guest" ? () => removeGuest(p) : undefined} />
            ))}
          </ul>
          {pool.length === 0 && (
            <p className="mt-3 text-sm text-ink/70">{total - seated === 0 ? "Toți au loc." : "Niciun rezultat."}</p>
          )}
          <p className="mt-3 text-xs text-ink/60">Trage un nume la o masă. Lasă-l aici ca să-l retragi.</p>
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
                  members={byTable.get(t.number) ?? []}
                  onDelete={() => setDeleting(t)}
                  onCapacityChange={(capacity) => handleCapacity(t.number, capacity)}
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
    </DndContext>
  );
}
