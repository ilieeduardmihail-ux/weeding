"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activateAccount } from "./actions";

export function ActivateForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");

    if (password !== confirm) {
      setError("Parolele nu coincid.");
      return;
    }

    setError(null);
    start(async () => {
      const result = await activateAccount({
        key: String(data.get("key") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        password,
      });
      if (result && !result.ok) setError(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="glass space-y-5 rounded-xl p-6">
      <div className="space-y-2">
        <Label htmlFor="key">Cheie de acces</Label>
        <Input
          id="key"
          name="key"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="WED-XXXX-XXXX-XXXX-XXXX"
          className="font-mono tracking-wider"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Parolă</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmă parola</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full bg-ink text-sea">
        <KeyRound aria-hidden="true" /> {pending ? "Se activează…" : "Activează contul"}
      </Button>
      <p className="text-center text-xs text-ink/60">
        Ai deja cont?{" "}
        <Link href="/admin/login" className="underline decoration-gold underline-offset-4">
          Intră în admin
        </Link>
      </p>
    </form>
  );
}
