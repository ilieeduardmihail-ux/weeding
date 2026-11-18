import { describe, expect, it } from "vitest";
import { DEFAULT_EVENT_SETTINGS, type EventSettings } from "@/lib/event-settings";
import { CONTACT_EMAIL, CONTACT_MAILTO, contactLinks } from "@/lib/marketing";
import {
  premiumBody,
  premiumDate,
  premiumInvitationUrl,
  premiumRequest,
  premiumSubject,
} from "@/lib/premium-message";

const settings: EventSettings = {
  ...DEFAULT_EVENT_SETTINGS,
  partner_1: "Ana",
  partner_2: "Ștefan",
  event_date: "2027-06-12",
  city: "Brașov",
  public_url: null,
};

const request = (over: Partial<EventSettings> = {}, slug = "ana-si-stefan") =>
  premiumRequest({ ...settings, ...over }, slug, "https://wedding-ro.vercel.app");

describe("premium upgrade message", () => {
  it("names the couple in the subject", () => {
    expect(premiumSubject(request())).toBe("Trecere la Premium — Ana & Ștefan");
  });

  it("writes the names, the date, the city and the invitation link", () => {
    const body = premiumBody(request());

    expect(body).toContain("Suntem Ana & Ștefan și avem nunta pe 12 iunie 2027, în Brașov.");
    expect(body).toContain("Vrem să trecem la pachetul Premium");
    expect(body).toContain("Invitația noastră: https://wedding-ro.vercel.app/ana-si-stefan");
    expect(body).toContain("Mulțumim!");
  });

  it("leaves the city out when the wedding has none", () => {
    const body = premiumBody(request({ city: "" }));

    expect(body).toContain("Suntem Ana & Ștefan și avem nunta pe 12 iunie 2027.");
    expect(body).not.toContain(", în");
  });

  it("uses the slug when the wedding never filled the names in", () => {
    const empty = request({ partner_1: "", partner_2: "" });

    expect(premiumSubject(empty)).toBe("Trecere la Premium — ana-si-stefan");
    expect(premiumBody(empty)).toContain("Suntem mirii nunții ana-si-stefan.");
    expect(premiumBody(empty)).toContain("Nunta noastră este pe 12 iunie 2027, în Brașov.");
  });

  it("drops a date that does not exist instead of shifting it", () => {
    const broken = request({ event_date: "2027-02-31" });

    expect(premiumDate(broken)).toBe("");
    expect(premiumBody(broken)).not.toContain("31");
    expect(premiumBody(broken)).toContain("Suntem Ana & Ștefan și avem nunta.");
  });

  it("prefers the wedding's own public address and ignores a trailing slash", () => {
    const custom = request({ public_url: "https://ana-si-stefan.ro/" });

    expect(premiumInvitationUrl(custom)).toBe("https://ana-si-stefan.ro/ana-si-stefan");
    expect(premiumBody(custom)).toContain("Invitația noastră: https://ana-si-stefan.ro/ana-si-stefan");
  });

  it("keeps the generic offer draft unchanged for the other pages", () => {
    const decoded = decodeURIComponent(CONTACT_MAILTO);

    expect(decoded).toContain(CONTACT_EMAIL);
    expect(decoded).toContain("Ofertă invitație digitală");
  });

  it("builds both targets from one draft, with the text encoded", () => {
    const subject = "Trecere la Premium — Ana & Ștefan";
    const body = "Bună ziua!\nMulțumim!";
    const links = contactLinks(subject, body);
    const compose = new URL(links.compose);

    expect(links.mailto.startsWith(`mailto:${CONTACT_EMAIL}?subject=`)).toBe(true);
    expect(decodeURIComponent(links.mailto)).toContain(body);
    expect(compose.searchParams.get("to")).toBe(CONTACT_EMAIL);
    expect(compose.searchParams.get("su")).toBe(subject);
    expect(compose.searchParams.get("body")).toBe(body);
    expect(compose.searchParams.get("view")).toBe("cm");
  });
});
