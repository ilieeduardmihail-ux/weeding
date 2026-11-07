"use client";
import { memo, useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { correctName, nameKey, type NameFix, type Status } from "@/lib/fuzzy";
import { parseFile, parseText } from "@/lib/parse-guests";
import { importGuests } from "@/app/admin/import/actions";
import { notifyAdminDataChanged } from "@/lib/admin-data";

type Row = NameFix & { id: number; value: string; include: boolean; dup: boolean };

const LABEL: Record<Status, string> = {
  ok: "Fără modificări", diacritics: "Diacritice corectate", auto: "Corectat automat", suggest: "Verifică",
};

const ImportRow = memo(function ImportRow({
  row: r,
  onPatch,
}: {
  row: Row;
  onPatch: (id: number, p: Partial<Row>) => void;
}) {
  return (
    <tr className="border-b border-ink/10 align-top">
      <td className="py-2 pr-3">
        <input type="checkbox" checked={r.include} aria-label={`Importă ${r.value}`}
          onChange={(e) => onPatch(r.id, { include: e.target.checked })} />
      </td>
      <td className="py-2 pr-3">
        <Input value={r.value} onChange={(e) => onPatch(r.id, { value: e.target.value })} aria-label="Nume" />
        {r.suggestion && r.value !== r.suggestion && (
          <button type="button" onClick={() => onPatch(r.id, { value: r.suggestion! })}
            className="mt-1 text-sm underline decoration-gold underline-offset-4">
            Folosește „{r.suggestion}”
          </button>
        )}
      </td>
      <td className="py-2 pr-3 text-sm">
        {r.dup ? "Deja în listă" : LABEL[r.status]}
      </td>
      <td className="py-2 text-sm text-ink/70">
        {r.original !== r.value ? (
          <>
            {r.original}{" "}
            <button type="button" onClick={() => onPatch(r.id, { value: r.original })}
              className="underline decoration-gold underline-offset-4">Folosește originalul</button>
          </>
        ) : "La fel"}
      </td>
    </tr>
  );
});

export function GuestImport({ existing }: { existing: string[] }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [pending, start] = useTransition();

  const known = useMemo(() => new Set(existing.map(nameKey)), [existing]);

  const build = useCallback((names: string[]) => {
    if (!names.length) { setError("Nu am găsit niciun nume."); setRows(null); return; }
    const seen = new Set<string>();
    setError(null); setDone(null);
    setRows(names.map((n, i) => {
      const fix = correctName(n);
      const k = nameKey(fix.corrected);
      const dup = known.has(k) || seen.has(k);
      seen.add(k);
      return { ...fix, id: i, value: fix.corrected, include: !dup, dup };
    }));
  }, [known]);

  const onFile = useCallback(async (file?: File) => {
    if (!file) return;
    try { build(await parseFile(file)); } catch (e) { setError(e instanceof Error ? e.message : "Nu am putut citi fișierul."); }
  }, [build]);

  const patch = useCallback(
    (id: number, p: Partial<Row>) =>
      setRows((rs) => rs && rs.map((r) => (r.id === id ? { ...r, ...p } : r))),
    [],
  );

  const stats = useMemo(() => {
    if (!rows) return null;
    let auto = 0, diacritics = 0, suggest = 0, dup = 0;
    for (const r of rows) {
      if (r.status === "auto") auto += 1;
      else if (r.status === "diacritics") diacritics += 1;
      else if (r.status === "suggest") suggest += 1;
      if (r.dup) dup += 1;
    }
    const chosen = rows.filter((r) => r.include && r.value.trim().length >= 2);
    return {
      auto,
      diacritics,
      suggest,
      dup,
      chosen,
      shown: rows.filter((r) => !onlyChanges || r.status !== "ok" || r.dup),
    };
  }, [rows, onlyChanges]);

  const submit = useCallback(() => {
    if (!stats || stats.chosen.length === 0) return;
    start(async () => {
      const r = await importGuests({ names: stats.chosen.map((x) => x.value.trim()) });
      if (r.ok) {
        setDone(`Am importat ${r.inserted} invitați${r.skipped ? `, am sărit ${r.skipped} deja aflați în listă` : ""}.`);
        setRows(null); setText("");
        notifyAdminDataChanged();
      } else setError(r.error);
    });
  }, [stats, start]);

  return (
    <div className="mt-6 space-y-6">
      {done && (
        <p role="status" className="rounded-lg bg-mist p-4">
          {done} <Link href="/admin/seating" className="underline decoration-gold underline-offset-4">Mergi la mese</Link>
        </p>
      )}

      <section className="grid gap-4 rounded-lg border border-ink/15 p-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="paste" className="text-sm font-medium">Lipește numele</label>
          <textarea id="paste" rows={6} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"Câte unul pe linie sau separate prin virgulă\nAndrei Popescu\nMaria Ionescu"}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
          <Button type="button" onClick={() => build(parseText(text))} disabled={!text.trim()}
            className="bg-ink text-sea hover:bg-ink/85">Verifică numele</Button>
        </div>
        <div className="space-y-2">
          <label htmlFor="file" className="text-sm font-medium">Sau încarcă un fișier</label>
          <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-ink/40 p-4 text-center text-sm">
            <Upload className="size-5" aria-hidden="true" />
            <Input id="file" type="file" accept=".xlsx,.xls,.csv,.txt" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          <p className="text-xs text-ink/60">Excel, CSV sau text. Un nume pe rând, luat din prima coloană completată. Până la 500 de nume.</p>
        </div>
      </section>

      {error && <p role="alert" className="text-red-300">{error}</p>}

      {rows && stats && (
        <section aria-label="Verifică numele importate">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Verifică {rows.length} nume</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyChanges} onChange={(e) => setOnlyChanges(e.target.checked)} /> Arată doar numele care au nevoie de atenție
            </label>
          </div>
          <p className="mt-1 text-sm text-ink/70">
            {stats.auto} corectate automat, {stats.diacritics} cu diacritice corectate, {stats.suggest} de verificat,{" "}
            {stats.dup} deja în listă. Poți modifica orice nume înainte de import.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="border-b border-ink/25 text-sm text-ink/70">
                <tr><th className="py-2">Adaugă</th><th>Nume</th><th>Stare</th><th>Original</th></tr>
              </thead>
              <tbody>
                {stats.shown.map((r) => (
                  <ImportRow key={r.id} row={r} onPatch={patch} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={submit} disabled={pending || stats.chosen.length === 0}
              className="bg-ink text-sea hover:bg-ink/85">
              {pending ? "Se importă…" : `Importă ${stats.chosen.length} invitați`}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setRows(null)}>Începe din nou</Button>
          </div>
        </section>
      )}
    </div>
  );
}
