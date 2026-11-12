import { describe, expect, it } from "vitest";
import { MAX_GUESTS } from "../config";
import { rsvpSchema } from "../schemas";
import { hasErrors, toRsvpInput, validateRsvp, type RsvpDraft } from "../rsvp-validation";

const draft = (patch: Partial<RsvpDraft> = {}): RsvpDraft => ({
  name: "Ana Ionescu",
  attending: "yes",
  guests: [],
  message: "",
  ...patch,
});

/**
 * The browser checks the form itself (no form library, no schema engine on the
 * guest's phone) while the server still validates with `rsvpSchema`. These cases
 * run both so the two can never disagree about what is a valid reply.
 */
const CASES: { label: string; value: RsvpDraft }[] = [
  { label: "a plain yes", value: draft() },
  { label: "a no", value: draft({ attending: "no" }) },
  { label: "a guest", value: draft({ guests: [{ name: "Dan Popescu", isChild: false }] }) },
  { label: "a child", value: draft({ guests: [{ name: "Maria", isChild: true }] }) },
  { label: "a padded name", value: draft({ name: "   Ana Ionescu   " }) },
  { label: "a name of two characters", value: draft({ name: "An" }) },
  { label: "a one-letter name", value: draft({ name: "A" }) },
  { label: "a blank name", value: draft({ name: "   " }) },
  { label: "a 120-character name", value: draft({ name: "a".repeat(120) }) },
  { label: "a 121-character name", value: draft({ name: "a".repeat(121) }) },
  { label: "an empty guest list row", value: draft({ guests: [{ name: " ", isChild: false }] }) },
  { label: "a 500-character message", value: draft({ message: "x".repeat(500) }) },
  { label: "a 501-character message", value: draft({ message: "x".repeat(501) }) },
  {
    label: "too many guests",
    value: draft({
      guests: Array.from({ length: MAX_GUESTS + 1 }, (_, i) => ({ name: `Guest ${i}`, isChild: false })),
    }),
  },
  {
    label: "a stale empty guest list on a no",
    value: draft({ attending: "no", guests: [{ name: "", isChild: false }] }),
  },
];

describe("validateRsvp agrees with rsvpSchema", () => {
  it.each(CASES)("$label", ({ value }) => {
    const clientRejects = hasErrors(validateRsvp(value));
    const serverRejects = !rsvpSchema.safeParse({
      ...toRsvpInput(value),
      website: "",
      elapsedMs: 5000,
      consent: true,
    }).success;
    expect(clientRejects).toBe(serverRejects);
  });
});

describe("validateRsvp messages", () => {
  it("names the field that is wrong", () => {
    const errors = validateRsvp(draft({ name: "A", guests: [{ name: "", isChild: false }], message: "x".repeat(501) }));
    expect(errors.name).toBe("Introdu numele complet");
    expect(errors.guests[0]).toBe("Introdu numele persoanei");
    expect(errors.message).toBe("Păstrează mesajul sub 500 de caractere");
  });

  it("stays quiet for a valid reply", () => {
    expect(hasErrors(validateRsvp(draft({ guests: [{ name: "Dan", isChild: false }] })))).toBe(false);
  });

  it("ignores guests when the answer is no", () => {
    const errors = validateRsvp(draft({ attending: "no", guests: [{ name: "", isChild: false }] }));
    expect(hasErrors(errors)).toBe(false);
  });
});

describe("toRsvpInput", () => {
  it("trims everything and drops the party on a no", () => {
    expect(toRsvpInput(draft({ name: " Ana ", guests: [{ name: " Dan ", isChild: true }] }))).toEqual({
      name: "Ana",
      attending: "yes",
      guests: [{ name: "Dan", isChild: true }],
      message: "",
    });
    expect(toRsvpInput(draft({ attending: "no", guests: [{ name: "Dan", isChild: false }] })).guests).toEqual([]);
  });
});
