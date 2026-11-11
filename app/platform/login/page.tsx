import type { Metadata } from "next";
import { signInOwner } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const instant = false;

export const metadata: Metadata = {
  title: "Platformă — autentificare",
  robots: { index: false, follow: false },
};

export default async function PlatformLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Platformă</p>
        <h1 className="font-display text-3xl">Cont de administrator</h1>
      </div>
      <form action={signInOwner} className="glass space-y-4 rounded-xl p-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Parolă</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p role="alert" className="text-red-700">
            Email sau parolă greșită.
          </p>
        )}
        <Button type="submit" className="w-full bg-ink text-sea">
          Intră în platformă
        </Button>
      </form>
    </main>
  );
}
