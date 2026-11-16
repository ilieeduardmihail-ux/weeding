import { describe, expect, it } from "vitest";
import { normalizeVisitPath } from "../visit-path";

describe("normalizeVisitPath", () => {
  it("maps the root to the presentation page", () => {
    expect(normalizeVisitPath("/")).toEqual({ path: "/", slug: null });
    expect(normalizeVisitPath("")).toEqual({ path: "/", slug: null });
  });

  it("accepts a wedding slug", () => {
    expect(normalizeVisitPath("/cristiana-si-cosmin")).toEqual({
      path: "/cristiana-si-cosmin",
      slug: "cristiana-si-cosmin",
    });
  });

  it("ignores query strings and fragments", () => {
    expect(normalizeVisitPath("/ana-si-stefan?nume=Ion#rsvp")).toEqual({
      path: "/ana-si-stefan",
      slug: "ana-si-stefan",
    });
  });

  it("normalises case and trailing slashes", () => {
    expect(normalizeVisitPath("/Ana-Si-Stefan/")).toEqual({
      path: "/ana-si-stefan",
      slug: "ana-si-stefan",
    });
  });

  it("refuses nested paths", () => {
    expect(normalizeVisitPath("/ana-si-stefan/admin")).toBeNull();
    expect(normalizeVisitPath("/confidentialitate/extra")).toBeNull();
  });

  it("refuses non-strings and empty slugs", () => {
    expect(normalizeVisitPath(null)).toBeNull();
    expect(normalizeVisitPath(42)).toBeNull();
    expect(normalizeVisitPath("/a")).toBeNull();
  });
});
