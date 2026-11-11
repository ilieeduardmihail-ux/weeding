"use client";

import { useActionState } from "react";
import { updatePassword, type NewPasswordState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: NewPasswordState = {};

export function NewPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(updatePassword, initial);

  return (
    <form action={action} className="glass space-y-4 rounded-xl p-6">
      {email && (
        <p className="text-xs text-ink/50">
          Setezi parola pentru <span className="text-ink/80">{email}</span>.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">Parola nouă</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Repetă parola</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Se salvează…" : "Salvează parola"}
      </Button>
    </form>
  );
}
