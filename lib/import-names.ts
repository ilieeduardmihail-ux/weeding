/**
 * The guest list comes from a paste or a spreadsheet, so it always contains a
 * few rows that are not names: a header, an empty cell, an address typed into
 * the wrong column. The database silently skips anything outside 2–120
 * characters, which used to look like "the import did nothing".
 *
 * Splitting here means the panel can say exactly how many rows were ignored and
 * why, and one bad row no longer rejects the whole batch.
 */

export const MAX_IMPORT_NAMES = 500;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 120;

export type ImportNames = {
  /** Names that can be stored, in the order they were given. */
  valid: string[];
  /** Longer than the column allows; probably a sentence, not a name. */
  tooLong: number;
  /** One character or empty after trimming; probably a separator artefact. */
  tooShort: number;
};

export function splitImportNames(names: readonly string[]): ImportNames {
  const valid: string[] = [];
  let tooLong = 0;
  let tooShort = 0;

  for (const raw of names) {
    const name = raw.replace(/\s+/g, " ").trim();
    if (!name) continue;
    if (name.length > NAME_MAX_LENGTH) {
      tooLong += 1;
      continue;
    }
    if (name.length < NAME_MIN_LENGTH) {
      tooShort += 1;
      continue;
    }
    valid.push(name);
  }

  return { valid, tooLong, tooShort };
}

/** Human-readable summary of what was left out, or null when nothing was. */
export function ignoredNamesNote({ tooLong, tooShort }: ImportNames): string | null {
  const parts: string[] = [];
  if (tooLong) parts.push(`${tooLong} prea ${tooLong === 1 ? "lung" : "lungi"} (peste ${NAME_MAX_LENGTH} de caractere)`);
  if (tooShort) parts.push(`${tooShort} prea ${tooShort === 1 ? "scurt" : "scurte"} (un singur caracter)`);
  return parts.length ? `Am ignorat ${parts.join(" și ")}.` : null;
}
