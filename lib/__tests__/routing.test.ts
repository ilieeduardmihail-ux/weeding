import { describe, expect, it } from "vitest";
import { DEFAULT_TENANT_SLUG } from "../default-tenant";
import { legacyRootPath } from "../routing";

describe("legacy root links", () => {
  it("sends /?nume=... to the wedding that used to live at the root", () => {
    expect(legacyRootPath("/", true)).toBe(`/${DEFAULT_TENANT_SLUG}`);
  });

  it("leaves the presentation page alone", () => {
    expect(legacyRootPath("/", false)).toBeNull();
  });

  it("does not touch any other path", () => {
    expect(legacyRootPath(`/${DEFAULT_TENANT_SLUG}`, true)).toBeNull();
    expect(legacyRootPath("/demo", true)).toBeNull();
    expect(legacyRootPath("/admin", true)).toBeNull();
  });
});
