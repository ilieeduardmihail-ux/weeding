/**
 * Client-side validation for the guest reply form.
 *
 * It mirrors lib/schemas.ts (which is still the authority on the server) but is
 * deliberately small, so the browser does not have to download a form library
 * and a schema engine just to say "introdu numele". `__tests__` keeps the two
 * from drifting apart.
 */
import { MAX_GUESTS } from "./config";
import type { RsvpInput } from "./schemas";

export type RsvpDraft = {
  name: string;
  attending: "yes" | "no";
  guests: { name: string; isChild: boolean }[];
  message: string;
};

export type RsvpErrors = {
  name?: string;
  message?: string;
  /** Keyed by the guest's position in the draft. */
  guests: Record<number, string>;
};

export function hasErrors(errors: RsvpErrors): boolean {
  return Boolean(errors.name || errors.message || Object.keys(errors.guests).length > 0);
}

export function validateRsvp(draft: RsvpDraft): RsvpErrors {
  const errors: RsvpErrors = { guests: {} };

  const name = draft.name.trim();
  if (name.length < 2 || name.length > 120) errors.name = "Introdu numele complet";

  // Only the people actually coming are checked: a list left over from "da"
  // must not block a "nu pot".
  if (draft.attending === "yes") {
    if (draft.guests.length > MAX_GUESTS) {
      errors.guests[MAX_GUESTS] = "Prea multe persoane";
    }
    draft.guests.forEach((guest, index) => {
      const value = guest.name.trim();
      if (value.length < 1 || value.length > 120) errors.guests[index] = "Introdu numele persoanei";
    });
  }

  if (draft.message.trim().length > 500) errors.message = "Păstrează mesajul sub 500 de caractere";

  return errors;
}

/** Exactly what the server action receives. */
export function toRsvpInput(draft: RsvpDraft): RsvpInput {
  return {
    name: draft.name.trim(),
    attending: draft.attending,
    guests:
      draft.attending === "yes"
        ? draft.guests.map((guest) => ({ name: guest.name.trim(), isChild: guest.isChild }))
        : [],
    message: draft.message.trim(),
  };
}
