import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { demoMode } from "@/lib/demo/mode";

/**
 * Landing point for the "choose your own password" email.
 *
 * Supports both Supabase link styles:
 * - `token_hash` + `type=recovery` (recommended email template, works on any device)
 * - `code` (default PKCE link, works in the browser that requested the email)
 *
 * After the session is established the admin is sent to /admin/parola-noua.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  if (demoMode) return NextResponse.redirect(`${origin}${next}`);

  if (searchParams.has("error") || searchParams.has("error_description")) {
    return NextResponse.redirect(`${origin}/admin/login?reset=invalid`);
  }

  const supabase = await createClient();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/admin/login?reset=invalid`);
}

/** Only internal admin paths, so a crafted link cannot bounce to another site. */
function safeNext(value: string | null) {
  if (!value) return "/admin";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/admin";
}
