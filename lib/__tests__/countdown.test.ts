import { describe, expect, it } from "vitest";
import { remainingParts } from "../countdown";

const now = Date.UTC(2029, 6, 1, 0, 0, 0);
const at = (ms: number) => new Date(now + ms).toISOString();

describe("remainingParts", () => {
  it("splits the time left into days, hours, minutes and seconds", () => {
    const difference = ((1 * 24 + 2) * 60 * 60 + 3 * 60 + 4) * 1000;
    expect(remainingParts(at(difference), now)).toEqual({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
      totalMs: difference,
    });
  });

  it("floors partial seconds", () => {
    const parts = remainingParts(at(999), now);
    expect(parts.seconds).toBe(0);
    expect(parts.totalMs).toBe(999);
  });

  it("returns zero after the event has started", () => {
    expect(remainingParts(at(-5_000), now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
    });
  });

  it("returns zero for an invalid date", () => {
    expect(remainingParts("not-a-date", now).totalMs).toBe(0);
  });
});
