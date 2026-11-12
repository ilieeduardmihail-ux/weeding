import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isOwnerRequest } from "@/lib/platform";
import { LEGAL_DOCUMENTS } from "@/lib/legal-documents";
import { DocumentCard } from "./document-card";

export const instant = false;

export const metadata: Metadata = {
  title: "Documente legale",
  robots: { index: false, follow: false },
};

export default async function DocumentsPage() {
  // Owner-only and always live.
  await connection();

  const supabase = await createClient();
  await supabase.auth.getUser();
  if (!(await isOwnerRequest())) redirect("/platform/login");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Platformă</p>
          <h1 className="font-display text-4xl">Documente legale</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink/65">
            Șabloane de completat și încheiat cu fiecare client. Înlocuiește câmpurile din paranteze
            drepte, apoi printează sau salvează ca PDF. Operatorul datelor este perechea (mirii), nu
            platforma.
          </p>
        </div>
        <Link
          href="/platform"
          className="text-sm text-ink/70 underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          ← Înapoi la clienți
        </Link>
      </header>

      <div className="space-y-8">
        {LEGAL_DOCUMENTS.map((doc) => (
          <DocumentCard key={doc.id} title={doc.title} text={doc.text} />
        ))}
      </div>
    </main>
  );
}
