import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { demoMode } from "@/lib/demo/mode";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function createClient(): Promise<any> {
  // DEMO MODE: no Supabase needed, data lives in memory (lib/demo/store.ts)
  if (demoMode) {
    const { createDemoClient } = await import("@/lib/demo/client");
    return createDemoClient();
  }

  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // called from a Server Component; middleware refreshes the session
          }
        },
      },
    }
  );
}
