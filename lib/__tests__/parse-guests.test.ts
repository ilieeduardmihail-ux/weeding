import { describe, expect, it } from "vitest";
import { parseRows, parseText } from "../parse-guests";

describe("guest list parsing", () => {
  it("reads name, child, allergies, group and phone when there is a header", () => {
    const rows = parseRows([
      ["Nume", "Copil", "Alergii / preferințe", "Grup", "Telefon"],
      ["Ana Popescu", "nu", "fără gluten", "Familia Popescu", "0722 000 111"],
      ["Mara Popescu", "da", "", "", ""],
    ]);

    expect(rows).toEqual([
      {
        name: "Ana Popescu",
        group: "Familia Popescu",
        isChild: false,
        allergies: "fără gluten",
        phone: "0722 000 111",
      },
      { name: "Mara Popescu", group: "", isChild: true, allergies: "", phone: "" },
    ]);
  });

  it("matches headers without diacritics or punctuation, in any order", () => {
    const rows = parseRows([
      ["Preferinte alimentare", "NUME SI PRENUME", "Copii"],
      ["fără nuci", "Ion Pop", "1"],
    ]);

    expect(rows).toEqual([
      { name: "Ion Pop", group: "", isChild: true, allergies: "fără nuci", phone: "" },
    ]);
  });

  it("looks past a title row before the real header", () => {
    const rows = parseRows([
      ["Lista invitaților"],
      ["Nume", "Alergii"],
      ["Ana Pop", "fără gluten"],
    ]);

    expect(rows.map((row) => row.name)).toEqual(["Ana Pop"]);
    expect(rows[0]?.allergies).toBe("fără gluten");
  });

  it("falls back to the first filled cell when there is no header", () => {
    const rows = parseRows([["", "Ion Pop"], ["Maria Ionescu"], ["  "]]);
    expect(rows.map((row) => row.name)).toEqual(["Ion Pop", "Maria Ionescu"]);
    expect(rows[0]?.isChild).toBe(false);
  });

  it("skips duplicate and too-short names", () => {
    const rows = parseRows([["Ana Pop"], ["ana pop"], ["A"], ["Ion Pop"]]);
    expect(rows.map((row) => row.name)).toEqual(["Ana Pop", "Ion Pop"]);
  });

  it("keeps the pasted one-name-per-line list working", () => {
    const rows = parseText("Ana Popescu\nMaria Ionescu\n\nIon Pop");
    expect(rows.map((row) => row.name)).toEqual(["Ana Popescu", "Maria Ionescu", "Ion Pop"]);
  });
});
