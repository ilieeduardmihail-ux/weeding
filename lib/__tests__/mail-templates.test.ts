import { describe, expect, it } from "vitest";
import { REPLY_TEMPLATES, durationLabel, keyMail } from "../mail-templates";

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

describe("keyMail", () => {
  it("carries the code, the duration and the start link", () => {
    const mail = keyMail({ code: "ABC-123", days: 365, startUrl: "https://wedding-ro.vercel.app/start" });
    expect(mail.text).toContain("ABC-123");
    expect(mail.text).toContain("Perioada de 1 an");
    expect(mail.text).toContain("https://wedding-ro.vercel.app/start");
    expect(mail.text).toContain("valabilă o singură dată");
  });

  it("uses the custom duration when it is not a preset", () => {
    const mail = keyMail({ code: "X", days: 90, startUrl: "https://example.test/start" });
    expect(mail.text).toContain("Perioada de 90 zile");
  });
});
