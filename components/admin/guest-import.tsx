"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { correctName, nameKey, type NameFix, type Status } from "@/lib/fuzzy";
import { parseFile, parseText } from "@/lib/parse-guests";
import { importGuests } from "@/app/admin/import/actions";

type Row = NameFix & { id: number; value: string; include: boolean; dup: boolean };

const LABEL: Record<Status, string> = {
  ok: "No change", diacritics: "Diacritics fixed", auto: "Auto-corrected", suggest: "Please check",
};

export function GuestImport({ existing }: { existing: string[] }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [pending, start] = useTransition();

  const build = (names: string[]) => {
    if (!names.length) { setError("No names found."); setRows(null); return; }
    const known = new Set(existing.map(nameKey));
    const seen = new Set<string>();
    setError(null); setDone(null);
    setRows(names.map((n, i) => {
      const fix = correctName(n);
      const k = nameKey(fix.corrected);
      const dup = known.has(k) || seen.has(k);
      seen.add(k);
      return { ...fix, id: i, value: fix.corrected, include: !dup, dup };
    }));
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try { build(await parseFile(file)); } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t read that file."); }
  };

  const patch = (id: number, p: Partial<Row>) => setRows((rs) => rs && rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const chosen = rows?.filter((r) => r.include && r.value.trim().length >= 2) ?? [];
  const count = (s: Status) => rows?.filter((r) => r.status === s).length ?? 0;
  const shown = rows?.filter((r) => !onlyChanges || r.status !== "ok" || r.dup) ?? [];

  const submit = () =>
    start(async () => {
      const r = await importGuests({ names: chosen.map((x) => x.value.trim()) });
      if (r.ok) {
        setDone(`Imported ${r.inserted} guests${r.skipped ? `, skipped ${r.skipped} already in the list` : ""}.`);
        setRows(null); setText("");
      } else setError(r.error);
    });

  return (
    <div className="mt-6 space-y-6">
      {done && (
        <p role="status" className="rounded-lg bg-mist p-4">
          {done} <Link href="/admin/seating" className="underline decoration-gold underline-offset-4">Go to seating</Link>
        </p>
      )}

      <section className="grid gap-4 rounded-lg border border-ink/15 p-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="paste" className="text-sm font-medium">Paste names</label>
          <textarea id="paste" rows={6} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"One per line, or separated by commas\nAndei Popescu\nMaria Ionesco"}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
          <Button type="button" onClick={() => build(parseText(text))} disabled={!text.trim()}
            className="bg-ink text-sea hover:bg-ink/85">Check names</Button>
        </div>
        <div className="space-y-2">
          <label htmlFor="file" className="text-sm font-medium">Or upload a file</label>
          <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-ink/40 p-4 text-center text-sm">
            <Upload className="size-5" aria-hidden="true" />
            <Input id="file" type="file" accept=".xlsx,.xls,.csv,.txt" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          <p className="text-xs text-ink/60">Excel, CSV or text. One name per row, taken from the first filled column. Up to 500 names.</p>
        </div>
      </section>

      {error && <p role="alert" className="text-red-700">{error}</p>}

      {rows && (
        <section aria-label="Review imported names">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Review {rows.length} names</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyChanges} onChange={(e) => setOnlyChanges(e.target.checked)} /> Show only names that need a look
            </label>
          </div>
          <p className="mt-1 text-sm text-ink/70">
            {count("auto")} auto-corrected, {count("diacritics")} with diacritics fixed, {count("suggest")} to check,{" "}
            {rows.filter((r) => r.dup).length} already in the list. Edit any name before importing.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="border-b border-ink/25 text-sm text-ink/70">
                <tr><th className="py-2">Add</th><th>Name</th><th>Status</th><th>Original</th></tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-b border-ink/10 align-top">
                    <td className="py-2 pr-3">
                      <input type="checkbox" checked={r.include} aria-label={`Import ${r.value}`}
                        onChange={(e) => patch(r.id, { include: e.target.checked })} />
                    </td>
                    <td className="py-2 pr-3">
                      <Input value={r.value} onChange={(e) => patch(r.id, { value: e.target.value })} aria-label="Name" />
                      {r.suggestion && r.value !== r.suggestion && (
                        <button type="button" onClick={() => patch(r.id, { value: r.suggestion! })}
                          className="mt-1 text-sm underline decoration-gold underline-offset-4">
                          Use “{r.suggestion}”
                        </button>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-sm">
                      {r.dup ? "Already in the list" : LABEL[r.status]}
                    </td>
                    <td className="py-2 text-sm text-ink/70">
                      {r.original !== r.value ? (
                        <>
                          {r.original}{" "}
                          <button type="button" onClick={() => patch(r.id, { value: r.original })}
                            className="underline decoration-gold underline-offset-4">Use original</button>
                        </>
                      ) : "Same"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={submit} disabled={pending || chosen.length === 0}
              className="bg-ink text-sea hover:bg-ink/85">
              {pending ? "Importing…" : `Import ${chosen.length} guests`}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setRows(null)}>Start over</Button>
          </div>
        </section>
      )}
    </div>
  );
}
