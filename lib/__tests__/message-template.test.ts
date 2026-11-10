import { describe, expect, it } from "vitest";
import {
  firstName,
  isPhoneLike,
  renderInviteMessage,
  rsvpLink,
  whatsappHref,
} from "@/lib/message-template";

const settings = { event_date: "2027-07-17" };

describe("invitation message", () => {
  it("fills the guest name, the date and a personal RSVP link", () => {
    const text = renderInviteMessage(
      "Bună, {nume}! Ne vedem pe {data}. Confirmă aici: {link}",
      { fullName: "  Ana   Popescu ", settings, siteUrl: "https://exemplu.ro/" },
    );

    expect(text).toContain("Bună, Ana!");
    expect(text).toContain("17 iulie 2027");
    expect(text).toContain("https://exemplu.ro/?nume=Ana%20Popescu#rsvp");
  });

  it("supports the full name and leaves unknown tokens untouched", () => {
    const text = renderInviteMessage("{nume_complet} / {nume} / {altceva}", {
      fullName: "Ana Popescu",
      settings,
      siteUrl: "https://exemplu.ro",
    });

    expect(text).toBe("Ana Popescu / Ana / {altceva}");
  });

  it("uses an invitee fallback when the name is empty", () => {
    expect(
      renderInviteMessage("Bună, {nume}!", { fullName: "", settings, siteUrl: "https://exemplu.ro" }),
    ).toBe("Bună, Invitat!");
  });

  it("builds the link without a double slash", () => {
    expect(rsvpLink("https://exemplu.ro/", "Ana Popescu")).toBe(
      "https://exemplu.ro/?nume=Ana%20Popescu#rsvp",
    );
  });

  it("keeps only the first name", () => {
    expect(firstName("  Ana-Maria   Pop ")).toBe("Ana-Maria");
    expect(firstName("")).toBe("");
  });
});

describe("whatsapp links", () => {
  it("turns a formatted number into a wa.me link", () => {
    expect(whatsappHref("+40 721 234 567", "Salut & bine")).toBe(
      "https://wa.me/40721234567?text=Salut%20%26%20bine",
    );
  });

  it("returns null without a usable number", () => {
    expect(whatsappHref("", "Salut")).toBeNull();
    expect(whatsappHref("123", "Salut")).toBeNull();
    expect(whatsappHref(null, "Salut")).toBeNull();
  });
});

describe("phone validation", () => {
  it("accepts common formats and an empty value", () => {
    expect(isPhoneLike("")).toBe(true);
    expect(isPhoneLike("+40 721 234 567")).toBe(true);
    expect(isPhoneLike("0721-234-567")).toBe(true);
  });

  it("rejects letters and too-short numbers", () => {
    expect(isPhoneLike("telefon")).toBe(false);
    expect(isPhoneLike("123")).toBe(false);
  });
});
