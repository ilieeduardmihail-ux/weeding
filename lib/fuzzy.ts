import { distance } from "fastest-levenshtein";
import { FIRST_NAMES, SURNAMES } from "./ro-names";

/** Strip diacritics (ă â î ș ț, including the old cedilla forms ş ţ). */
export const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
/** Comparison key: no diacritics, lower case, single spaces. */
export const nameKey = (s: string) => fold(s).toLowerCase().replace(/\s+/g, " ").trim();

const DICT = new Map<string, string>();
for (const w of [...FIRST_NAMES, ...SURNAMES]) {
  const k = nameKey(w);
  if (!DICT.has(k)) DICT.set(k, w);
}
const ENTRIES = [...DICT];
const PARTICLES = new Set(["de", "la", "di", "von", "van", "el"]);

export type Status = "ok" | "diacritics" | "auto" | "suggest";
const RANK: Record<Status, number> = { ok: 0, diacritics: 1, auto: 2, suggest: 3 };

const tidy = (w: string) =>
  w.length > 1 && w === w.toUpperCase() && w !== w.toLowerCase() ? w[0] + w.slice(1).toLowerCase() : w;

type WordFix = { applied: string; suggested: string; status: Status };

function fixWord(word: string): WordFix {
  const k = nameKey(word);
  const same: WordFix = { applied: tidy(word), suggested: tidy(word), status: "ok" };
  if (k.length < 2 || PARTICLES.has(k)) return same;

  // Known name: fix case and diacritics ("Stefan" -> "Ștefan", "ANDREI" -> "Andrei")
  const exact = DICT.get(k);
  if (exact) {
    const status: Status = word.toLowerCase() === exact.toLowerCase() ? "ok" : "diacritics";
    return { applied: exact, suggested: exact, status };
  }

  // Unknown word: allow 0 edits up to 3 letters, 1 up to 6 letters, 2 beyond that
  const maxD = k.length <= 3 ? 0 : k.length <= 6 ? 1 : 2;
  if (maxD === 0) return same;

  let best = Infinity;
  let pick = "";
  for (const [dk, canon] of ENTRIES) {
    if (Math.abs(dk.length - k.length) > maxD) continue;
    const d = distance(k, dk);
    // strict "<" keeps the more common name when two are equally close
    if (d <= maxD && d < best) { best = d; pick = canon; }
  }
  if (!pick) return same;
  // 1 edit away: apply it. 2 edits away: only suggest, never apply on its own.
  return best === 1
    ? { applied: pick, suggested: pick, status: "auto" }
    : { applied: tidy(word), suggested: pick, status: "suggest" };
}

export type NameFix = { original: string; corrected: string; suggestion: string | null; status: Status };

export function correctName(raw: string): NameFix {
  const original = raw.replace(/\s+/g, " ").trim();
  let status: Status = "ok";
  const applied: string[] = [];
  const suggested: string[] = [];
  for (const part of original.split(/(\s+|-)/)) {
    if (!part || /^[\s-]+$/.test(part)) { applied.push(part); suggested.push(part); continue; }
    const r = fixWord(part);
    applied.push(r.applied);
    suggested.push(r.suggested);
    if (RANK[r.status] > RANK[status]) status = r.status;
  }
  return {
    original,
    corrected: applied.join(""),
    suggestion: status === "suggest" ? suggested.join("") : null,
    status,
  };
}
