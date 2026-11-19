import { describe, expect, it } from "vitest";
import { snapshotIsFresh } from "../admin-data";

describe("snapshotIsFresh", () => {
  it("accepts a snapshot requested after the last write finished", () => {
    expect(snapshotIsFresh(1200, 1000, 0)).toBe(true);
  });

  it("drops a snapshot that left before the write finished", () => {
    // It may still carry the table number from before the drop: applying it
    // would send the guest back to „Fără masă" for a frame.
    expect(snapshotIsFresh(900, 1000, 0)).toBe(false);
  });

  it("waits while an optimistic write is still pending", () => {
    expect(snapshotIsFresh(1200, 1000, 1)).toBe(false);
  });

  it("accepts a snapshot requested in the same tick as the write", () => {
    expect(snapshotIsFresh(1000, 1000, 0)).toBe(true);
  });
});
