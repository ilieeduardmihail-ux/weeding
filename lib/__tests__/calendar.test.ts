import { describe, expect, it } from "vitest";
import { buildCalendarEvent, escapeIcs, icsDate, icsNextDate } from "../calendar";
import { DEFAULT_EVENT_SETTINGS, type EventSettings } from "../event-settings";

const settings: EventSettings = {
  ...DEFAULT_EVENT_SETTINGS,
  partner_1: "Daria",
  partner_2: "Mihai",
  event_date: "2029-07-07",
  city: "București",
  public_url: "https://wedding-ro.vercel.app",
};

describe("calendar", () => {
  it("converts dates and handles month/year boundaries", () => {
    expect(icsDate("2029-07-07")).toBe("20290707");
    expect(icsNextDate("2029-07-07")).toBe("2029-07-08");
    expect(icsNextDate("2029-12-31")).toBe("2030-01-01");
    expect(icsNextDate("2028-02-28")).toBe("2028-02-29");
    expect(() => icsDate("07.07.2029")).toThrow();
  });

  it("escapes iCalendar special characters", () => {
    expect(escapeIcs("da, nu; poate\nsigur")).toBe("da\\, nu\\; poate\\nsigur");
  });

  it("builds an all-day event on the wedding date", () => {
    const ics = buildCalendarEvent(settings, new Date("2029-01-01T10:00:00Z"));

    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20290707");
    expect(ics).toContain("DTEND;VALUE=DATE:20290708");
    expect(ics).toContain("DTSTAMP:20290101T100000Z");
    expect(ics).toContain("SUMMARY:Nunta Daria & Mihai");
    expect(ics).toContain("LOCATION:București");
    expect(ics).not.toContain("DTSTART:");
  });
});
