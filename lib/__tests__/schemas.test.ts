import { describe, expect, it } from "vitest";
import { MAX_GUESTS } from "../config";
import { adminRsvpSchema } from "../admin-rsvp-schema";
import { rsvpSchema } from "../schemas";

const ID = "00000000-0000-4000-8000-000000000001";
const guest = { name: "Dan Popescu", isChild: false };

describe("rsvpSchema", () => {
  it("accepts a normal reply", () => {
    const parsed = rsvpSchema.safeParse({
      name: "  Ana Ionescu ",
      attending: "yes",
      guests: [guest],
      message: "Ne vedem acolo!",
      website: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.name).toBe("Ana Ionescu");
  });

  it("rejects a name that is too short", () => {
    expect(rsvpSchema.safeParse({ name: "A", attending: "yes", guests: [] }).success).toBe(false);
  });

  it("rejects a message over 500 characters", () => {
    expect(
      rsvpSchema.safeParse({ name: "Ana Ionescu", attending: "no", guests: [], message: "x".repeat(501) })
        .success
    ).toBe(false);
  });

  it("rejects more guests than the limit", () => {
    const guests = Array.from({ length: MAX_GUESTS + 1 }, (_, i) => ({ name: `Guest ${i}`, isChild: false }));
    expect(rsvpSchema.safeParse({ name: "Ana Ionescu", attending: "yes", guests }).success).toBe(false);
  });

  it("requires every guest to have a name", () => {
    expect(
      rsvpSchema.safeParse({ name: "Ana Ionescu", attending: "yes", guests: [{ name: " ", isChild: false }] })
        .success
    ).toBe(false);
  });
});

describe("adminRsvpSchema", () => {
  it("accepts existing and new guests", () => {
    const parsed = adminRsvpSchema.safeParse({
      id: ID,
      name: " Ana Ionescu ",
      attending: "yes",
      message: "Actualizat",
      guests: [
        { guestId: ID, name: "Dan Popescu", isChild: false },
        { guestId: "", name: "Maria Popescu", isChild: true },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Ana Ionescu");
      expect(parsed.data.guests[0]!.guestId).toBe(ID);
      expect(parsed.data.guests[1]!.guestId).toBe("");
    }
  });

  it("rejects an invalid RSVP id", () => {
    expect(
      adminRsvpSchema.safeParse({ id: "nope", name: "Ana Ionescu", attending: "no", guests: [] }).success
    ).toBe(false);
  });

  it("rejects an invalid existing guest id", () => {
    expect(
      adminRsvpSchema.safeParse({
        id: ID,
        name: "Ana Ionescu",
        attending: "yes",
        guests: [{ guestId: "nope", name: "Dan", isChild: false }],
      }).success
    ).toBe(false);
  });

  it("rejects too many guests", () => {
    const guests = Array.from({ length: MAX_GUESTS + 1 }, () => ({
      guestId: null,
      name: "Guest",
      isChild: false,
    }));
    expect(
      adminRsvpSchema.safeParse({ id: ID, name: "Ana Ionescu", attending: "yes", guests }).success
    ).toBe(false);
  });
});
