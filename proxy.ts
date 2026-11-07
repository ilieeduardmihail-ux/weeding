import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, demoMode } from "@/lib/demo/mode";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const LOGIN = "/admin/login"; // not linked anywhere on the public site
const HOME = "/";             // where everyone else is sent (use LOGIN here if you prefer)

type JsonWebKeySet = {
  keys: { kty: string; key_ops: string[]; kid?: string; alg?: string }[];
};

// The project signs sessions with asymmetric keys (ES256), so the JWT can be
// verified locally with WebCrypto. The public key set is cached per warm
// serverless instance: no Auth round trip on every admin navigation.
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

export async function proxy(request: NextRequest) {
  const onLogin = request.nextUrl.pathname === LOGIN;

  // DEMO MODE: no Supabase session, just a cookie set by the demo sign-in.
  if (demoMode) {
    const signedIn = request.cookies.get(DEMO_COOKIE)?.value === "1";
    if (!signedIn && !onLogin) return NextResponse.redirect(new URL(LOGIN, request.url));
    if (signedIn && onLogin) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getClaims verifies the JWT signature locally when the cached JWKS is
  // available; it never trusts the cookie blindly and refreshes it if needed.
  const { data: auth } = await supabase.auth.getClaims(undefined, { jwks: await getJwks() });
  let signedIn = Boolean(auth?.claims);

  // Safety net: if local verification could not run (key rotation, symmetric
  // keys), fall back to the Auth server once instead of logging the admin out.
  if (!signedIn) {
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }

  // A signed-in account is not enough: it must be listed in the `admins` table
  let isAdmin = false;
  if (signedIn) {
    const { data } = await supabase.rpc("is_admin");
    isAdmin = data === true;
  }

  if (isAdmin) {
    if (onLogin) return NextResponse.redirect(new URL("/admin", request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  if (onLogin) return response; // let the couple sign in

  // Signed out, or signed in without admin rights
  const redirect = NextResponse.redirect(new URL(HOME, request.url));
  response.cookies.getAll().forEach((c) => redirect.cookies.set(c)); // keep refreshed auth cookies
  return redirect;
}

export const config = { matcher: ["/admin/:path*"] };
