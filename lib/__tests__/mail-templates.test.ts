import { describe, expect, it } from "vitest";
import {
  ACCESS_DURATIONS,
  REPLY_TEMPLATES,
  accessBlock,
  durationDaysFromPeriod,
  durationLabel,
  keyMail,
} from "../mail-templates";

const ctx = {
  name: "Ana Popescu",
  period: "1 an",
  price: "1.200",
  startUrl: "https://wedding-ro.vercel.app/start",
};

describe("durationLabel", () => {
  it("names the periods the platform sells", () => {
    expect(durationLabel(180)).toBe("6 luni");
    expect(durationLabel(365)).toBe("1 an");
    expect(durationLabel(540)).toBe("1 an și 6 luni");
    expect(durationLabel(730)).toBe("2 ani");
  });

  it("falls back to the day count", () => {
    expect(durationLabel(90)).toBe("90 zile");
  });

  it("keeps the panel presets and the labels in step", () => {
    expect(ACCESS_DURATIONS.map((row) => row.label)).toEqual(
      ACCESS_DURATIONS.map((row) => durationLabel(row.days))
    );
  });
});

describe("durationDaysFromPeriod", () => {
  it("reads the periods the request form offers", () => {
    expect(durationDaysFromPeriod("6 luni")).toBe(180);
    expect(durationDaysFromPeriod("1 an")).toBe(365);
    expect(durationDaysFromPeriod("1 an și 6 luni")).toBe(540);
    expect(durationDaysFromPeriod("2 ani")).toBe(730);
  });

  it("falls back to one year for a missing or open answer", () => {
    expect(durationDaysFromPeriod("Nu știu încă")).toBe(365);
    expect(durationDaysFromPeriod("")).toBe(365);
    expect(durationDaysFromPeriod(null)).toBe(365);
  });

  it("multiplies a plain month count", () => {
    expect(durationDaysFromPeriod("3 luni")).toBe(90);
  });

  it("ignores case and extra spaces", () => {
    expect(durationDaysFromPeriod("  2   ANI ")).toBe(730);
  });
});

describe("REPLY_TEMPLATES", () => {
  it("has four templates with unique ids", () => {
    expect(REPLY_TEMPLATES).toHaveLength(4);
    expect(new Set(REPLY_TEMPLATES.map((row) => row.id)).size).toBe(4);
  });

  it.each(REPLY_TEMPLATES.map((row) => [row.id, row] as const))(
    "%s keeps the name and leaves no placeholder behind",
    (_id, row) => {
      const subject = row.subject(ctx);
      const body = row.body(ctx);
      expect(subject.length).toBeGreaterThan(0);
      expect(body).toContain("Ana Popescu");
      expect(body).not.toContain("{");
      expect(body).toContain("Ne căsătorim");
    }
  );

  it("shows a visible placeholder when the price is missing", () => {
    const oferta = REPLY_TEMPLATES.find((row) => row.id === "oferta")!;
    expect(oferta.body({ ...ctx, price: "" })).toContain("[preț] lei");
  });

  it("writes the price as typed", () => {
    const oferta = REPLY_TEMPLATES.find((row) => row.id === "oferta")!;
    expect(oferta.body(ctx)).toContain("1.200 lei");
  });

  it("mentions the chosen period only when there is one", () => {
    const oferta = REPLY_TEMPLATES.find((row) => row.id === "oferta")!;
    expect(oferta.body(ctx)).toContain("Perioada pe care ați ales-o este 1 an.");
    expect(oferta.body({ ...ctx, period: "" })).not.toContain("Perioada pe care ați ales-o");
  });

  it("puts the activation link in the offer", () => {
    const oferta = REPLY_TEMPLATES.find((row) => row.id === "oferta")!;
    expect(oferta.body(ctx)).toContain("https://wedding-ro.vercel.app/start");
  });

  it("still greets politely without a name", () => {
    const oferta = REPLY_TEMPLATES.find((row) => row.id === "oferta")!;
    expect(oferta.body({ ...ctx, name: "" }).startsWith("Bună ziua,")).toBe(true);
  });
});

describe("accessBlock", () => {
  const siteUrl = "https://wedding-ro.vercel.app";
  const ctx = { code: "WED-TEST", days: 365, siteUrl };

  it("has the code and the four activation steps", () => {
    const block = accessBlock(ctx);
    expect(block).toContain("WED-TEST");
    expect(block).toContain(`${siteUrl}/start`);
    expect(block).toContain("4. Apăsați „Activez contul”.");
    expect(block).toContain("din momentul activării");
  });

  it("lists only the links worth keeping", () => {
    const block = accessBlock(ctx);
    expect(block).toContain(`${siteUrl}/termeni`);
    expect(block).toContain(`${siteUrl}/confidentialitate`);
    expect(block).toContain("contact.necasatorim@gmail.com");
  });

  it("stays short: no tour of the panel and no public address", () => {
    const block = accessBlock(ctx);
    expect(block).not.toContain("În panou puteți schimba");
    expect(block).not.toContain("Invitația publică");
    expect(block).not.toContain("ana-marin");
  });

  it("tolerates a trailing slash in the address", () => {
    expect(accessBlock({ ...ctx, siteUrl: "https://example.test/" })).toContain(
      "https://example.test/start"
    );
  });
});

describe("keyMail", () => {
  const siteUrl = "https://wedding-ro.vercel.app";

  it("carries the code, the duration and the start link", () => {
    const mail = keyMail({ code: "ABC-123", days: 365, siteUrl });
    expect(mail.text).toContain("ABC-123");
    expect(mail.text).toContain("Perioada de 1 an");
    expect(mail.text).toContain(`${siteUrl}/start`);
    expect(mail.text).toContain("o singură dată");
  });

  it("drops the panel paragraph and the public-link line", () => {
    const mail = keyMail({ code: "ABC-123", days: 365, siteUrl });
    expect(mail.text).not.toContain("În panou puteți schimba");
    expect(mail.text).not.toContain("Invitația publică");
  });

  it("uses the custom duration when it is not a preset", () => {
    const mail = keyMail({ code: "X", days: 90, siteUrl: "https://example.test" });
    expect(mail.text).toContain("Perioada de 90 zile");
  });

  it("still reads as a letter, not a dump of instructions", () => {
    const mail = keyMail({ code: "X", days: 180, siteUrl });
    expect(mail.text.startsWith("Bună ziua,")).toBe(true);
    expect(mail.text.trimEnd().endsWith("Ne căsătorim")).toBe(true);
  });
});
