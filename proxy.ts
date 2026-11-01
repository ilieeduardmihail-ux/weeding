import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, demoMode } from "@/lib/demo/mode";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const LOGIN = "/admin/login"; // not linked anywhere on the public site
const HOME = "/";             // where everyone else is sent (use LOGIN here if you prefer)

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

  // getUser() asks Supabase to validate the session; never trust getSession() here
  const { data: { user } } = await supabase.auth.getUser();

  // A signed-in account is not enough: it must be listed in the `admins` table
  let isAdmin = false;
  if (user) {
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
