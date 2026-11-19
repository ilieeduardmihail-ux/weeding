import { describe, expect, it } from "vitest";
import {
  CODE_MAX_ATTEMPTS,
  CODE_RESEND_SECONDS,
  CODE_TTL_MINUTES,
  SANDBOX_DAYS,
  codeMatches,
  generateLeadCode,
  hashLeadCode,
  normalizeEmail,
  resendWaitSeconds,
  sandboxDaysLeft,
} from "../leads-code";

const HOUR = 3_600_000;
const DAY = 86_400_000;

describe("generateLeadCode", () => {
  it("always produces six digits, leading zeros included", () => {
    for (let i = 0; i < 500; i++) {
      expect(generateLeadCode()).toMatch(/^\d{6}$/);
    }
  });

  it("does not obviously repeat", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateLeadCode()));
    expect(codes.size).toBeGreaterThan(150);
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases, so the same address is one lead", () => {
    expect(normalizeEmail("  Ana.Popescu@Example.RO ")).toBe("ana.popescu@example.ro");
  });
});

describe("hashLeadCode", () => {
  const email = "ana@exemplu.ro";

  it("is deterministic and case-insensitive for the address", () => {
    expect(hashLeadCode("123456", email)).toBe(hashLeadCode("123456", " ANA@Exemplu.RO "));
  });

  it("changes with the code and with the address", () => {
    const base = hashLeadCode("123456", email);
    expect(hashLeadCode("123457", email)).not.toBe(base);
    expect(hashLeadCode("123456", "altcineva@exemplu.ro")).not.toBe(base);
  });

  it("stores nothing that looks like the code", () => {
    const hash = hashLeadCode("123456", email);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("123456");
  });
});

describe("codeMatches", () => {
  const email = "ana@exemplu.ro";
  const stored = hashLeadCode("123456", email);

  it("accepts the code that was hashed, with surrounding spaces", () => {
    expect(codeMatches("123456", email, stored)).toBe(true);
    expect(codeMatches(" 123456 ", email, stored)).toBe(true);
  });

  it("rejects a wrong code, an empty hash and a malformed hash", () => {
    expect(codeMatches("654321", email, stored)).toBe(false);
    expect(codeMatches("123456", email, null)).toBe(false);
    expect(codeMatches("123456", email, "not-a-hash")).toBe(false);
    expect(codeMatches("123456", email, "")).toBe(false);
  });

  it("binds the code to the address it was sent to", () => {
    expect(codeMatches("123456", "altcineva@exemplu.ro", stored)).toBe(false);
  });
});

describe("resendWaitSeconds", () => {
  const now = Date.UTC(2026, 10, 19, 12, 0, 0);

  it("allows a first send", () => {
    expect(resendWaitSeconds(null, now)).toBe(0);
  });

  it("counts down the minute and then allows another send", () => {
    expect(resendWaitSeconds(new Date(now).toISOString(), now)).toBe(CODE_RESEND_SECONDS);
    expect(resendWaitSeconds(new Date(now - 50_000).toISOString(), now)).toBe(10);
    expect(resendWaitSeconds(new Date(now - CODE_RESEND_SECONDS * 1000).toISOString(), now)).toBe(0);
    expect(resendWaitSeconds(new Date(now - 10 * 60_000).toISOString(), now)).toBe(0);
  });
});

describe("sandboxDaysLeft", () => {
  const now = Date.UTC(2026, 10, 19, 12, 0, 0);

  it("defaults to the full week", () => {
    expect(sandboxDaysLeft(null, now)).toBe(SANDBOX_DAYS);
  });

  it("rounds up partial days and stops at zero", () => {
    expect(sandboxDaysLeft(new Date(now + 7 * DAY).toISOString(), now)).toBe(7);
    expect(sandboxDaysLeft(new Date(now + 1 * HOUR).toISOString(), now)).toBe(1);
    expect(sandboxDaysLeft(new Date(now - 1).toISOString(), now)).toBe(0);
  });
});

describe("constants", () => {
  it("matches what the panel promises", () => {
    expect(CODE_TTL_MINUTES).toBe(15);
    expect(CODE_MAX_ATTEMPTS).toBe(5);
    expect(CODE_RESEND_SECONDS).toBe(60);
    expect(SANDBOX_DAYS).toBe(7);
  });
});
