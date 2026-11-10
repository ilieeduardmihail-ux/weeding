import { signIn } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Next 16: reading searchParams blocks the route, which is fine for a login page.
export const instant = false;

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-3xl">Autentificare admin</h1>
      <form action={signIn} className="glass space-y-4 rounded-xl p-6">
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
        <div className="space-y-2"><Label htmlFor="password">Parolă</Label><Input id="password" name="password" type="password" required /></div>
        {error && <p role="alert" className="text-red-200">Email sau parolă greșită.</p>}
        <Button type="submit" className="w-full bg-ink text-sea">Intră în cont</Button>
      </form>
    </main>
  );
}
