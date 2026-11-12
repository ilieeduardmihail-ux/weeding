"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the browser print dialog; on desktop the user can save as PDF. */
export function PrintButton() {
  return (
    <Button type="button" className="bg-ink text-sea" onClick={() => window.print()}>
      <Printer aria-hidden="true" /> Printează / salvează PDF
    </Button>
  );
}
