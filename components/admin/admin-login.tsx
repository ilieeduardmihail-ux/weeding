import Link from "next/link";
import { signIn } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The login form, shared by /admin/login and /<slug>/admin/login. */
export function AdminLogin({ error }: { error?: string }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-3xl">Autentificare admin</h1>
      <form action={signIn} className="glass space-y-4 rounded-xl p-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Parolă</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {error && (
          <p role="alert" className="text-red-700">
            Email sau parolă greșită.
          </p>
        )}
        <Button type="submit" className="w-full bg-ink text-sea">
          Intră în cont
        </Button>
      </form>
      <p className="text-center text-xs text-ink/60">
        Ai o cheie de acces?{" "}
        <Link href="/start" className="underline decoration-gold underline-offset-4">
          Activează contul
        </Link>
      </p>
    </main>
  );
}
