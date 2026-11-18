import { fold } from "./fuzzy";

/**
 * Reading a guest list from a paste or a spreadsheet.
 *
 * The list used to be names only. A wedding list usually also says who is a
 * child and what someone cannot eat, so a file can now carry `Copil`, `Alergii`
 * and `Grup`/`Telefon` columns. Header names are matched without diacritics and
 * without punctuation, because people write "Alergii / preferințe", "alergii"
 * or "Preferinte alimentare" in the same file.
 *
 * A paste still means one name per line. A file without a recognisable header
 * keeps the old behaviour: the name is the first filled cell of the row.
 */

const MAX_NAMES = 500;
const MAX_BYTES = 2 * 1024 * 1024;
const NAME_MAX = 120;

export type ParsedGuest = {
  name: string;
  /** Free-form group from the file (family, friends, godparents...). */
  group: string;
  isChild: boolean;
  /** Allergies / food preferences, cut to the 500 characters the column allows. */
  allergies: string;
  /** Phone as written in the file, if there was a column for it. */
  phone: string;
};

type Field = "name" | "group" | "isChild" | "allergies" | "phone";

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const headerKey = (value: unknown) =>
  fold(clean(value))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const ALIASES: Record<Field, readonly string[]> = {
  name: ["nume", "nume si prenume", "numele", "name", "full name", "invitat", "invitati", "guest", "guests"],
  group: ["grup", "grupul", "group", "familie", "family"],
  isChild: [
    "copil",
    "copii",
    "child",
    "children",
    "kid",
    "kids",
    "minor",
    "minori",
    "is child",
    "este copil",
    "meniu copii",
  ],
  allergies: [
    "alergii",
    "alergie",
    "alergii preferinte",
    "preferinte",
    "preferinte alimentare",
    "preferinta",
    "allergies",
    "allergy",
    "food preferences",
    "dieta",
    "dieta speciala",
    "observatii",
  ],
  phone: ["telefon", "phone", "tel", "mobil", "numar telefon", "numar de telefon"],
};

const FIELD_BY_HEADER = new Map<string, Field>();
for (const [field, aliases] of Object.entries(ALIASES) as [Field, readonly string[]][]) {
  for (const alias of aliases) FIELD_BY_HEADER.set(alias, field);
}

const TRUE_VALUES = new Set(["da", "yes", "true", "1", "x", "✓", "✔", "copil", "copii", "child", "kid", "kids"]);
const FALSE_VALUES = new Set(["nu", "no", "false", "0", "adult", "adulti", "-", ""]);

function isChildValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  const key = headerKey(value);
  if (TRUE_VALUES.has(key)) return true;
  if (FALSE_VALUES.has(key)) return false;
  const number = Number(key);
  return Number.isFinite(number) && number > 0;
}

/** Finds the header row and which column holds which field. */
function readHeader(rows: readonly unknown[][]): { index: number; columns: Map<Field, number> } | null {
  for (let index = 0; index < Math.min(rows.length, 5); index += 1) {
    const columns = new Map<Field, number>();
    const cells = rows[index] ?? [];
    cells.forEach((cell, column) => {
      const field = FIELD_BY_HEADER.get(headerKey(cell));
      if (field && !columns.has(field)) columns.set(field, column);
    });
    // A lone "Nume" column is enough; two other known headers also make a header.
    if (columns.has("name") || columns.size >= 2) {
      if (!columns.has("name")) {
        const used = new Set(columns.values());
        const fallback = cells.findIndex((_, column) => !used.has(column));
        if (fallback >= 0) columns.set("name", fallback);
      }
      return { index, columns };
    }
  }
  return null;
}

function guestFrom(row: readonly unknown[], columns: Map<Field, number> | null): ParsedGuest | null {
  const at = (field: Field) => {
    const column = columns?.get(field);
    return column === undefined ? "" : clean(row[column]);
  };

  // Without a header the first filled cell is the name, exactly as before.
  const name = columns ? at("name") : row.map(clean).find((cell) => cell !== "") ?? "";
  if (name.length < 2 || name.length > NAME_MAX) return null;

  return {
    name,
    group: at("group").slice(0, 120),
    isChild: columns?.has("isChild") ? isChildValue(row[columns.get("isChild")!]) : false,
    allergies: at("allergies").slice(0, 500),
    phone: at("phone").slice(0, 40),
  };
}

/** Spreadsheet / CSV rows, with or without a header. Exported for tests. */
export function parseRows(rows: readonly unknown[][]): ParsedGuest[] {
  const header = readHeader(rows);
  const body = header ? rows.slice(header.index + 1) : rows;
  const guests: ParsedGuest[] = [];
  const seen = new Set<string>();

  for (const row of body) {
    const guest = guestFrom(row, header?.columns ?? null);
    if (!guest) continue;
    // The same person twice in one file is almost always a copy-paste slip.
    const key = fold(guest.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    guests.push(guest);
    if (guests.length >= MAX_NAMES) break;
  }

  return guests;
}

/** Pasted text: one name per line, or separated by commas, semicolons or tabs. */
export function parseText(text: string): ParsedGuest[] {
  return parseRows(
    text
      .split(/\r?\n/)
      .map((line) => line.split(/[;,\t]+/))
  );
}

/** .xlsx, .xls, .csv or .txt — the first sheet of a workbook. */
export async function parseFile(file: File): Promise<ParsedGuest[]> {
  if (file.size > MAX_BYTES) throw new Error("Fișierul este prea mare (maximum 2 MB).");
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt") {
    return parseText(await file.text());
  }

  let rows: unknown[][];
  if (ext === "csv") {
    const Papa = (await import("papaparse")).default; // loaded only for CSV
    rows = Papa.parse<string[]>(await file.text(), { skipEmptyLines: true }).data;
  } else if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx"); // loaded only when needed
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false });
  } else {
    throw new Error("Folosește un fișier .xlsx, .xls, .csv sau .txt.");
  }

  return parseRows(rows);
}
