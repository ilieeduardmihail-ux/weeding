import { describe, expect, it } from "vitest";
import {
  CONTACT_PERIODS,
  contactBody,
  contactPeriod,
  contactSubject,
  type ContactRequest,
} from "@/lib/contact-message";

const request = (overrides: Partial<ContactRequest> = {}): ContactRequest => ({
  name: "Ana și Ștefan",
  email: "ana@exemplu.ro",
  phone: "",
  period: "1 an",
  message: "Am vrea o invitație cu decor floral și programul nunții.",
  ...overrides,
});

const now = new Date("2026-06-15T09:30:00Z");

describe("contact message", () => {
  it("puts the name and the chosen period in the subject", () => {
    expect(contactSubject(request())).toBe("Cerere ofertă — Ana și Ștefan — 1 an");
  });

  it("leaves the period out of the subject when none was chosen", () => {
    expect(contactSubject(request({ period: "" }))).toBe("Cerere ofertă — Ana și Ștefan");
  });

  it("ignores a period the form does not offer", () => {
    expect(contactSubject(request({ period: "pentru totdeauna" }))).toBe(
      "Cerere ofertă — Ana și Ștefan"
    );
    expect(contactPeriod(" 2 ani ")).toBe("2 ani");
  });

  it("keeps the body readable without a phone number", () => {
    const body = contactBody(request(), now);

    expect(body).toContain("Nume: Ana și Ștefan");
    expect(body).toContain("Email: ana@exemplu.ro");
    expect(body).toContain("Perioada dorită: 1 an");
    expect(body).toContain("Am vrea o invitație cu decor floral");
    expect(body).not.toContain("Telefon:");
    expect(body).toContain("15 iunie 2026");
  });

  it("adds the phone number when it was given", () => {
    const body = contactBody(request({ phone: "0721 234 567" }), now);

    expect(body).toContain("Telefon: 0721 234 567");
  });

  it("says so when the period was left open", () => {
    const body = contactBody(request({ period: "" }), now);

    expect(body).toContain("Perioada dorită: nu a fost aleasă");
  });

  it("offers the periods the owner sells", () => {
    expect(CONTACT_PERIODS).toEqual(["6 luni", "1 an", "1 an și 6 luni", "2 ani", "Nu știu încă"]);
  });
});
