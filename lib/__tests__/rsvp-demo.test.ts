import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

async function freshStore() {
  return import("../demo/store");
}

describe("demo RSVP flow", () => {
  it("saves a new reply and finds it by name", async () => {
    const store = await freshStore();

    store.submitRsvp({
      name: "Ion Test",
      attending: true,
      message: "Salut!",
      guests: [{ name: "Maria Test", isChild: true }],
    });

    const status = store.checkRsvpStatus("ion test");
    expect(status).not.toBeNull();
    expect(status?.name).toBe("Ion Test");
    expect(status?.attending).toBe(true);
    expect(status?.party).toEqual([{ name: "Maria Test", table_number: null }]);
  });

  it("updates an existing reply without losing the assigned seat", async () => {
    const store = await freshStore();
    const before = store.listRsvps().find((row) => row.name === "Ana Ionescu")!;
    const dan = before.rsvp_guests.find((g) => g.name === "Dan Ionescu")!;
    expect(dan.table_number).not.toBeNull();

    const result = store.adminUpdateRsvp({
      id: before.id,
      name: "Ana Ionescu",
      attending: true,
      message: "Actualizat",
      guests: [
        { id: dan.id, name: dan.name, isChild: false },
        { id: null, name: "Guest Nou", isChild: true },
      ],
    });

    expect(result.error).toBeNull();
    const after = store.listRsvps().find((row) => row.id === before.id)!;
    expect(after.message).toBe("Actualizat");
    expect(after.rsvp_guests).toHaveLength(2);
    expect(after.rsvp_guests.find((g) => g.name === dan.name)?.table_number).toBe(dan.table_number);
    expect(after.rsvp_guests.find((g) => g.name === "Guest Nou")?.table_number).toBeNull();
  });

  it("clears the party when the guest declines", async () => {
    const store = await freshStore();
    const before = store.listRsvps().find((row) => row.name === "Ana Ionescu")!;

    store.adminUpdateRsvp({
      id: before.id,
      name: "Ana Ionescu",
      attending: false,
      message: "",
      guests: [{ id: null, name: "Ignored", isChild: false }],
    });

    const after = store.listRsvps().find((row) => row.id === before.id)!;
    expect(after.attending).toBe(false);
    expect(after.message).toBeNull();
    expect(after.rsvp_guests).toEqual([]);
  });

  it("returns an error for an unknown RSVP id", async () => {
    const store = await freshStore();
    const result = store.adminUpdateRsvp({
      id: "00000000-0000-4000-8000-999999999999",
      name: "Nobody",
      attending: true,
      message: "",
      guests: [],
    });
    expect(result.error?.message).toBe("not found");
  });
});
