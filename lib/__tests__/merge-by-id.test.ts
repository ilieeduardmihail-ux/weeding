import { describe, expect, it } from "vitest";
import { mergeById } from "../merge-by-id";

type Row = { id: string; name: string };

const same = (a: Row, b: Row) => a.id === b.id && a.name === b.name;

describe("mergeById", () => {
  it("keeps the previous object when the row did not change", () => {
    const old = [{ id: "1", name: "Ana" }, { id: "2", name: "Vlad" }];
    const incoming = [{ id: "1", name: "Ana" }, { id: "2", name: "Vlad" }];

    const merged = mergeById(old, incoming, same);

    expect(merged[0]).toBe(old[0]);
    expect(merged[1]).toBe(old[1]);
  });

  it("takes the incoming object when the row changed", () => {
    const old = [{ id: "1", name: "Ana" }];
    const incoming = [{ id: "1", name: "Ana Maria" }];

    const merged = mergeById(old, incoming, same);

    expect(merged[0]).toBe(incoming[0]);
    expect(merged[0]).not.toBe(old[0]);
  });

  it("adds new rows and drops removed rows", () => {
    const old = [{ id: "1", name: "Ana" }];
    const incoming = [{ id: "2", name: "Vlad" }];

    expect(mergeById(old, incoming, same)).toEqual([{ id: "2", name: "Vlad" }]);
  });

  it("does not mutate its inputs", () => {
    const old = [{ id: "1", name: "Ana" }];
    const incoming = [{ id: "1", name: "Ana" }];
    const oldCopy = [...old];
    const incomingCopy = [...incoming];

    mergeById(old, incoming, same);

    expect(old).toEqual(oldCopy);
    expect(incoming).toEqual(incomingCopy);
  });
});
