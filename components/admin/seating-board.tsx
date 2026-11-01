"use client";
import { useMemo, useState, useTransition } from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor,
  pointerWithin, rectIntersection, useDraggable, useDroppable, useSensor, useSensors,
  type CollisionDetection, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { X } from "lucide-react";
import { assignTable, deleteGuest } from "@/app/admin/seating/actions";
import { TABLE_CAPACITY, TABLE_COUNT } from "@/lib/admin-config";

export type Kind = "rsvp" | "plus" | "guest";
export type Person = { id: string; kind: Kind; name: string; table: number | null };

const keyOf = (p: Person) => `${p.kind}:${p.id}`;
const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const BADGE: Record<Kind, string> = { rsvp: "", plus: "plus-one", guest: "imported" };

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
          "flex-1 cursor-grab select-none rounded-md border border-ink/20 bg-sea px-2 py-1.5 text-sm active:cursor-grabbing",
          isDragging && "opacity-40"
        )}
      >
        {p.name}
        {BADGE[p.kind] && <span className="ml-2 text-xs text-ink/60">{BADGE[p.kind]}</span>}
      </div>
      {onDelete && (
        <button type="button" onClick={onDelete} aria-label={`Remove ${p.name} from the list`}
          className="rounded-md p-1.5 text-ink/60 hover:bg-ink/10">
          <X className="size-4" />
        </button>
      )}
    </li>
  );
}

function TableCard({ n, members }: { n: number; members: Person[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `table:${n}` });
  const full = members.length >= TABLE_CAPACITY;
  return (
    <section
      ref={setNodeRef}
      aria-label={`Table ${n}, ${members.length} of ${TABLE_CAPACITY} seats taken`}
      className={cx(
        "rounded-2xl border p-3 transition",
        isOver ? (full ? "border-red-600 bg-red-600/10" : "border-gold bg-gold/10") : "border-ink/15"
      )}
    >
      <svg viewBox="0 0 120 120" className="mx-auto size-28" aria-hidden="true">
        <circle cx="60" cy="60" r="30" className="fill-mist stroke-ink/30" />
        {Array.from({ length: TABLE_CAPACITY }, (_, i) => {
          const a = (i / TABLE_CAPACITY) * 2 * Math.PI - Math.PI / 2;
          return (
            <circle key={i} cx={60 + 46 * Math.cos(a)} cy={60 + 46 * Math.sin(a)} r="6"
              className={i < members.length ? "fill-gold" : "fill-ink/15"} />
          );
        })}
        <text x="60" y="58" textAnchor="middle" className="fill-ink font-display text-[20px]">{n}</text>
        <text x="60" y="74" textAnchor="middle" className="fill-ink text-[11px]">
          {full ? "Full" : `${members.length}/${TABLE_CAPACITY}`}
        </text>
      </svg>
      <ul className="mt-2 space-y-1">
        {members.map((p) => <PersonChip key={keyOf(p)} p={p} />)}
      </ul>
    </section>
  );
}

export function SeatingBoard({ initial }: { initial: Person[] }) {
  const [people, setPeople] = useState(initial);
  const [active, setActive] = useState<Person | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
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
    if (target !== null && (byTable.get(target)?.length ?? 0) >= TABLE_CAPACITY) {
      setMsg(`Table ${target} is full (${TABLE_CAPACITY} of ${TABLE_CAPACITY}).`);
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

  const stats = [["Attending", total], ["Seated", seated], ["Unassigned", total - seated]] as const;

  return (
    <DndContext sensors={sensors} collisionDetection={detect} onDragStart={onDragStart}
      onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
      <dl className="mt-6 grid grid-cols-3 gap-3">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-lg bg-mist/70 p-4">
            <dd className={cx("font-display text-3xl tabular-nums", l === "Unassigned" && v > 0 && "text-gold")}>{v}</dd>
            <dt className="text-sm text-ink/70">{l}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-3 h-2 rounded bg-ink/15" role="progressbar" aria-label="Guests assigned to tables"
        aria-valuenow={seated} aria-valuemin={0} aria-valuemax={total}>
        <div className="h-full rounded bg-gold transition-all" style={{ width: `${total ? (seated / total) * 100 : 0}%` }} />
      </div>
      <p role="status" className="mt-3 min-h-6 text-sm text-red-700">{msg}</p>

      <div className="mt-2 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <section ref={poolRef} aria-label="Guests without a table"
          className={cx(
            "rounded-2xl border p-3 lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:self-start lg:overflow-y-auto",
            overPool ? "border-gold bg-gold/10" : "border-ink/15"
          )}>
          <h2 className="font-display text-xl">Guest pool <span className="text-base text-ink/60">({total - seated})</span></h2>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name"
            aria-label="Search the guest pool" className="mt-2 w-full rounded-md border border-ink/30 bg-transparent px-3 py-2 text-sm" />
          <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto lg:max-h-none">
            {pool.map((p) => (
              <PersonChip key={keyOf(p)} p={p} onDelete={p.kind === "guest" ? () => removeGuest(p) : undefined} />
            ))}
          </ul>
          {pool.length === 0 && (
            <p className="mt-3 text-sm text-ink/70">{total - seated === 0 ? "Everyone has a seat." : "No match."}</p>
          )}
          <p className="mt-3 text-xs text-ink/60">Drag a name onto a table. Drop it back here to unseat.</p>
        </section>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((n) => (
            <TableCard key={n} n={n} members={byTable.get(n) ?? []} />
          ))}
        </div>
      </div>

      <DragOverlay>
        {active && <div className="rounded-md bg-ink px-3 py-1.5 text-sm text-sea shadow-lg">{active.name}</div>}
      </DragOverlay>
    </DndContext>
  );
}
