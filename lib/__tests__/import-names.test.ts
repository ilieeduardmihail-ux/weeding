import { describe, expect, it } from "vitest";
import { ignoredNamesNote, splitImportNames } from "../import-names";

describe("splitImportNames", () => {
  it("keeps normal names and tidies the spacing", () => {
    const result = splitImportNames(["  Andrei   Popescu ", "Maria Ionescu"]);
    expect(result.valid).toEqual(["Andrei Popescu", "Maria Ionescu"]);
    expect(result.tooLong).toBe(0);
    expect(result.tooShort).toBe(0);
  });

  it("drops empty rows instead of failing the batch", () => {
    const result = splitImportNames(["", "   ", "Ion Marin"]);
    expect(result.valid).toEqual(["Ion Marin"]);
    expect(result.tooShort).toBe(0);
  });

  it("counts a too-long row but keeps the rest", () => {
    const long = "x".repeat(121);
    const result = splitImportNames(["Ion Marin", long]);
    expect(result.valid).toEqual(["Ion Marin"]);
    expect(result.tooLong).toBe(1);
  });

  it("counts single-character rows", () => {
    const result = splitImportNames(["A", "B", "Ion Marin"]);
    expect(result.valid).toEqual(["Ion Marin"]);
    expect(result.tooShort).toBe(2);
  });

  it("accepts exactly 120 characters", () => {
    const name = "x".repeat(120);
    expect(splitImportNames([name]).valid).toHaveLength(1);
  });

  it("keeps the order the names were given in", () => {
    const result = splitImportNames(["Zoe Pop", "Ana Pop"]);
    expect(result.valid).toEqual(["Zoe Pop", "Ana Pop"]);
  });
});

describe("ignoredNamesNote", () => {
  it("says nothing when every row was usable", () => {
    expect(ignoredNamesNote({ valid: [], tooLong: 0, tooShort: 0 })).toBeNull();
  });

  it("uses the singular for one row", () => {
    expect(ignoredNamesNote({ valid: [], tooLong: 1, tooShort: 0 })).toContain("1 prea lung");
  });

  it("mentions both reasons", () => {
    const note = ignoredNamesNote({ valid: [], tooLong: 2, tooShort: 3 });
    expect(note).toContain("2 prea lungi");
    expect(note).toContain("3 prea scurte");
  });
});
