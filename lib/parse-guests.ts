import Papa from "papaparse";

const MAX_NAMES = 500;
const MAX_BYTES = 2 * 1024 * 1024;
const HEADER = /^(nume|name|invitat|invita[tț]i|guest|guests|nume [sș]i prenume|full name)$/i;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Pasted text: one name per line, or separated by commas, semicolons or tabs. */
export function parseText(text: string): string[] {
  return text.split(/[\n\r;,\t]+/).map(clean).filter((s) => s.length >= 2).slice(0, MAX_NAMES);
}

/** .xlsx, .xls, .csv or .txt: reads the first filled cell of every row. */
export async function parseFile(file: File): Promise<string[]> {
  if (file.size > MAX_BYTES) throw new Error("That file is too large (2 MB max).");
  const ext = file.name.split(".").pop()?.toLowerCase();
  let rows: unknown[][];

  if (ext === "txt") {
    return parseText(await file.text());
  } else if (ext === "csv") {
    rows = Papa.parse<string[]>(await file.text(), { skipEmptyLines: true }).data;
  } else if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx"); // loaded only when needed
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false });
  } else {
    throw new Error("Use a .xlsx, .xls, .csv or .txt file.");
  }

  const names = rows
    .map((r) => clean(String((r as unknown[]).find((c) => String(c ?? "").trim() !== "") ?? "")))
    .filter((s) => s.length >= 2);
  if (names.length && HEADER.test(names[0])) names.shift();
  return names.slice(0, MAX_NAMES);
}
