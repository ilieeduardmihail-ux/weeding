import { describe, expect, it } from "vitest";
import {
  DEFAULT_EVENT_SETTINGS,
  eventStartIso,
  formatEventDate,
  isRsvpClosed,
  normalizeSettings,
  todayInZone,
  type EventSettings,
} from "../event-settings";

const settings: EventSettings = {
  ...DEFAULT_EVENT_SETTINGS,
  partner_1: "Daria",
  partner_2: "Mihai",
  event_date: "2029-07-07",
  event_time: "16:00",
  city: "București",
  timezone: "Europe/Bucharest",
  contact_email: "contact@example.com",
  rsvp_cutoff_date: "2029-07-01",
};

describe("event settings", () => {
  it("falls back to defaults when the row is missing", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_EVENT_SETTINGS);
    expect(normalizeSettings(null).contact_email).toBe("ilieeduardmihail@gmail.com");
  });

  it("normalizes a Supabase row and repairs empty optional fields", () => {
    const normalized = normalizeSettings({
      partner_1: "Daria",
      partner_2: "Mihai",
      event_date: "2029-07-07",
      event_time: "16:00:00",
      city: "București",
      timezone: "Europe/Bucharest",
      contact_email: "  ",
      rsvp_cutoff_date: null,
      seating_published: true,
      public_url: "",
    });

    expect(normalized.event_time).toBe("16:00");
    expect(normalized.contact_email).toBe("ilieeduardmihail@gmail.com");
    expect(normalized.seating_published).toBe(true);
    expect(normalized.public_url).toBeNull();
    expect(normalized.rsvp_cutoff_date).toBeNull();
  });

  it("formats the date in Romanian", () => {
    expect(formatEventDate(settings)).toBe("7 iulie 2029");
  });

  it("computes the event instant in the event timezone", () => {
    expect(eventStartIso(settings)).toBe("2029-07-07T13:00:00.000Z");
  });

  it("reads today's date in the event timezone", () => {
    expect(todayInZone("Europe/Bucharest", new Date("2029-07-01T21:30:00Z"))).toBe("2029-07-02");
  });

  it("closes the RSVP only after the cutoff day", () => {
    expect(isRsvpClosed(settings, new Date("2029-07-01T12:00:00Z"))).toBe(false);
    expect(isRsvpClosed(settings, new Date("2029-07-02T08:00:00Z"))).toBe(true);
    expect(isRsvpClosed({ ...settings, rsvp_cutoff_date: null }, new Date("2030-01-01T00:00:00Z"))).toBe(false);
  });
});
