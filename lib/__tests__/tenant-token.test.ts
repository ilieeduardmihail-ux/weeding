import { describe, expect, it, vi } from "vitest";

// `server-only` throws by design outside a server bundle; the module under test
// is server code, so the guard is stubbed here.
vi.mock("server-only", () => ({}));

const { signTenantToken, readTenantToken } = await import("../tenant-token");

const TENANT = "00000000-0000-4000-8000-000000000001";

describe("tenant token", () => {
  it("round-trips the wedding it was signed for", () => {
    expect(readTenantToken(signTenantToken(TENANT))).toBe(TENANT);
  });

  it("rejects a token whose wedding was swapped", () => {
    const [, day, mac] = signTenantToken(TENANT).split(".");
    const other = "11111111-1111-4111-8111-111111111111";
    expect(readTenantToken(`${other}.${day}.${mac}`)).toBeNull();
  });

  it("rejects a changed signature or day", () => {
    const [tenantId, day, mac] = signTenantToken(TENANT).split(".");
    expect(readTenantToken(`${tenantId}.${day}.${mac!.slice(0, -2)}AA`)).toBeNull();
    expect(readTenantToken(`${tenantId}.1999-01-01.${mac}`)).toBeNull();
  });

  it("rejects anything that is not a token", () => {
    expect(readTenantToken("")).toBeNull();
    expect(readTenantToken(TENANT)).toBeNull();
    expect(readTenantToken(null)).toBeNull();
    expect(readTenantToken(undefined)).toBeNull();
    expect(readTenantToken({})).toBeNull();
  });
});
