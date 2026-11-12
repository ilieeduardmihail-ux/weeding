import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, demoMode } from "@/lib/demo/mode";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const PLATFORM_LOGIN = "/platform/login"; // platform owner
const HOME = "/";                          // where everyone else is sent

type JsonWebKeySet = {
  keys: { kty: string; key_ops: string[]; kid?: string; alg?: string }[];
};

// The project signs sessions with asymmetric keys (ES256), so the JWT can be
// verified locally with WebCrypto. The public key set is cached per warm
// serverless instance: no Auth round trip on every panel navigation.
let jwksCache: { value: JsonWebKeySet; at: number } | null = null;
const JWKS_TTL = 10 * 60_000;

async function getJwks(): Promise<JsonWebKeySet | undefined> {
  if (jwksCache && Date.now() - jwksCache.at < JWKS_TTL) return jwksCache.value;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`, { cache: "no-store" });
    if (!res.ok) return jwksCache?.value;
    const value = (await res.json()) as JsonWebKeySet;
    if (!Array.isArray(value?.keys) || value.keys.length === 0) return jwksCache?.value;
    jwksCache = { value, at: Date.now() };
    return value;
  } catch {
    return jwksCache?.value;
  }
}

/** The wedding slug in /<slug>/admin, or null for the legacy bare /admin. */
function adminSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)\/admin(?:\/|$)/);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]);
  // /admin/... and /platform/... are never a wedding slug.
  if (slug === "admin" || slug === "platform") return null;
  return slug;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const slug = adminSlugFromPath(pathname);
  const isPlatform = pathname === "/platform" || pathname.startsWith("/platform/");
  const onLogin = pathname === PLATFORM_LOGIN || pathname.endsWith("/admin/login");

  // The panel URLs depend on the client. Used both for redirects and to stamp
  // the request so server actions resolve the same wedding as the page.
  const adminHome = slug ? `/${slug}/admin` : "/admin";
  const adminLogin = slug ? `/${slug}/admin/login` : "/admin/login";
  const panelHome = isPlatform ? "/platform" : adminHome;

  // DEMO MODE: no Supabase session. The platform panel needs the real backend,
  // so previews are sent to the admin demo instead.
  if (demoMode) {
    if (isPlatform) return NextResponse.next();
    const signedIn = request.cookies.get(DEMO_COOKIE)?.value === "1";
    if (!signedIn && !onLogin) return NextResponse.redirect(new URL(adminLogin, request.url));
    if (signedIn && onLogin) return NextResponse.redirect(new URL(adminHome, request.url));
    return NextResponse.next();
  }

  // Every admin request carries its wedding slug, so server actions (which have
  // no URL of their own) can resolve the tenant from the same request.
  const forwardHeaders = () => {
    const headers = new Headers(request.headers);
    if (slug) headers.set("x-wedding-slug", slug);
    return headers;
  };

  let response = NextResponse.next({ request: { headers: forwardHeaders() } });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: forwardHeaders() } });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims verifies the JWT signature locally when the cached JWKS is
  // available; it never trusts the cookie blindly and refreshes it if needed.
  const { data: auth } = await supabase.auth.getClaims(undefined, { jwks: await getJwks() });
  let signedIn = Boolean(auth?.claims);

  // Safety net: if local verification could not run (key rotation, symmetric
  // keys), fall back to the Auth server once instead of logging the person out.
  if (!signedIn) {
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }

  // A signed-in account is not enough: it must hold the role for this panel.
  let allowed = false;
  if (signedIn) {
    const { data } = await supabase.rpc(isPlatform ? "is_platform_owner" : "is_admin");
    allowed = data === true;
  }

  if (allowed) {
    if (onLogin) return NextResponse.redirect(new URL(panelHome, request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  if (onLogin) return response; // let the person sign in

  // Signed out, or signed in without the right role
  const redirect = NextResponse.redirect(new URL(HOME, request.url));
  response.cookies.getAll().forEach((c) => redirect.cookies.set(c)); // keep refreshed auth cookies
  return redirect;
}

export const config = { matcher: ["/admin/:path*", "/platform/:path*", "/:slug/admin/:path*"] };
