"use client";

import { useState } from "react";
import { Check, Copy, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** One legal template: readable, copyable and printable. */
export function DocumentCard({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the user can still select the text manually.
    }
  };

  return (
    <section className="glass rounded-xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="font-display text-2xl">{title}</h2>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? "Copiat" : "Copiază"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer aria-hidden="true" /> Printează
          </Button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink/80 print:text-black">
        {text}
      </pre>
    </section>
  );
}
