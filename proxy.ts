import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, demoMode } from "@/lib/demo/mode";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const PLATFORM_LOGIN = "/platform/login"; // platform owner
// The bare /admin is a resolver, not a panel: it reads the signed-in account's
// own panels and forwards to the one it can actually use (a wedding's admin or
// the platform). Sending a signed-in visitor there — instead of to the public
// invitation — is what turns "wrong link" into "the panel you meant".
const RESOLVER = "/admin";

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
  const { pathname, search } = request.nextUrl;
  const slug = adminSlugFromPath(pathname);
  const isPlatform = pathname === "/platform" || pathname.startsWith("/platform/");
  const onLogin = pathname === PLATFORM_LOGIN || pathname.endsWith("/admin/login");
  // The resolver itself: it must stay reachable for a signed-in account that
  // holds no role for the panel in the URL, otherwise it cannot forward them.
  const onResolver = pathname === RESOLVER;

  // The panel URLs depend on the client. Used both for redirects and to stamp
  // the request so server actions resolve the same wedding as the page.
  const adminHome = slug ? `/${slug}/admin` : "/admin";
  const adminLogin = slug ? `/${slug}/admin/login` : "/admin/login";
  const panelHome = isPlatform ? "/platform" : adminHome;
  // Where an unauthenticated visitor is sent: this panel's own login page.
  const loginPath = isPlatform ? PLATFORM_LOGIN : adminLogin;

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

  // Any refresh above rotated the auth cookies onto `response`. Every response
  // we return must carry them, otherwise the browser keeps the old tokens and
  // the next request repeats the refresh — and Supabase treats a reused refresh
  // token as a leaked session, logging the person out.
  const withRefreshedCookies = (target: NextResponse) => {
    response.cookies.getAll().forEach((c) => target.cookies.set(c));
    return target;
  };

  if (allowed) {
    if (onLogin) return withRefreshedCookies(NextResponse.redirect(new URL(panelHome, request.url)));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  // Signed in, but without the role for THIS panel: do not enter the panel and
  // do not loop on a login form. Send them to the resolver, which forwards to
  // the panel they can use — landing on the public invitation would look like a
  // logout to a client who simply opened the wrong link.
  if (signedIn) {
    if (onResolver) {
      response.headers.set("Cache-Control", "private, no-store");
      return withRefreshedCookies(response); // the resolver forwards onwards
    }
    if (onLogin) return withRefreshedCookies(response); // let them sign in
    return withRefreshedCookies(NextResponse.redirect(new URL(RESOLVER, request.url)));
  }

  // Signed out, or the session expired: go to THIS panel's login — never the
  // public homepage — and remember the exact route so they land back on it.
  if (onLogin) return withRefreshedCookies(response); // let them sign in
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  return withRefreshedCookies(NextResponse.redirect(loginUrl));
}

export const config = { matcher: ["/admin/:path*", "/platform/:path*", "/:slug/admin/:path*"] };
