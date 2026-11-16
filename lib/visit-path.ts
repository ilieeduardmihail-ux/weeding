/**
 * What a visit beacon is allowed to report. The browser sends the pathname it is
 * on, and this decides whether it is the presentation page or a wedding's
 * invitation. Everything else (admin, legal pages, assets) is refused, so the
 * counter only measures the two public surfaces we care about.
 */

export type VisitTarget = {
  /** Normalised pathname, e.g. "/" or "/cristiana-si-cosmin". */
  path: string;
  /** Slug of the wedding, or null for the presentation page. */
  slug: string | null;
};

const SLUG = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

export function normalizeVisitPath(raw: unknown): VisitTarget | null {
  if (typeof raw !== "string") return null;

  const rawPath = raw.split("?")[0]?.split("#")[0]?.trim().toLowerCase() ?? "";
  const clean = rawPath.replace(/\/+$/, "") || "/";
  if (clean === "/") return { path: "/", slug: null };

  const match = SLUG.exec(clean);
  if (!match) return null;

  const slug = match[1];
  // `/admin`, `/platform`, `/api` and friends have no dash in them but must
  // never be counted as a wedding; the route also checks that the slug exists.
  if (slug.length < 2 || slug.length > 60) return null;

  return { path: `/${slug}`, slug };
}
