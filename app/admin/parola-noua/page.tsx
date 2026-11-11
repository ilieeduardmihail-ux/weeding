import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { demoMode } from "@/lib/demo/mode";
import { NewPasswordForm } from "./form";

// Reading the recovery session makes this page dynamic.
export const instant = false;

export default async function NewPasswordPage() {
  if (demoMode) redirect("/admin");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login?reset=invalid");

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-3xl">Parola nouă</h1>
        <p className="mt-2 text-sm text-ink/65">
          Alege parola pe care o vei folosi de acum în admin. Minim 8 caractere.
        </p>
      </div>

      <NewPasswordForm email={data.user.email ?? ""} />

      <Link
        href="/admin"
        className="text-center text-sm text-ink/60 underline decoration-ink/30 underline-offset-4 transition-colors hover:text-ink"
      >
        Renunță și întoarce-te în admin
      </Link>
    </main>
  );
}
