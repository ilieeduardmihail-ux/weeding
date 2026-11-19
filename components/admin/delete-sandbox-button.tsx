"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDemoAccount } from "@/app/demo/cont/actions";

/**
 * Deleting the demo account also deletes the sandbox, the uploaded files and
 * the Supabase user. A confirm() is enough here: the action is irreversible and
 * the only way to make the promise in the privacy policy true.
 */
export function DeleteSandboxButton() {
  return (
    <form
      action={deleteDemoAccount}
      onSubmit={(event) => {
        const ok = window.confirm(
          "Ștergi contul demo? Dispare și copia ta de lucru, cu tot ce ai completat. Nu se poate anula."
        );
        if (!ok) event.preventDefault();
      }}
    >
      <Button type="submit" variant="ghost" size="sm" className="text-ink/70">
        <Trash2 aria-hidden="true" /> Șterge contul
      </Button>
    </form>
  );
}
