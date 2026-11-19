import type { Metadata } from "next";
import Link from "next/link";
import { ContForm } from "./cont-form";

// The form reads ?tab=, ?eroare=, ?sters= and ?expirat=, so each request paints
// its own notice instead of a cached one.
export const instant = false;

export const metadata: Metadata = {
  title: "Panoul demo — cont",
  description: "Creează-ți contul ca să intri în panoul de organizare al nunții demo.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    tab?: string;
    eroare?: string;
    sters?: string;
    expirat?: string;
    email?: string;
  }>;
};

export default async function DemoAccountPage({ searchParams }: Props) {
  const params = await searchParams;

  // One message at a time: the first that applies wins.
  const notice = params.sters
    ? "Contul tău a fost șters, împreună cu tot ce ai lucrat în demo. Nu mai păstrăm nimic."
    : params.expirat
      ? "Contul demo a expirat după 7 zile, iar datele lui s-au șters. Îți poți face altul în câteva secunde."
      : params.eroare
        ? "Email sau parolă greșite. Încearcă din nou sau cere un cod nou."
        : null;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col justify-center gap-6 px-5 py-12">
      <ContForm
        initialTab={params.tab === "login" ? "login" : "signup"}
        initialEmail={params.email ?? ""}
        notice={notice}
      />

      <p className="text-center text-xs leading-relaxed text-ink/60">
        Vrei doar să vezi invitația?{" "}
        <Link href="/demo" className="underline decoration-gold underline-offset-4">
          Deschide demo-ul
        </Link>{" "}
        — fără cont.
      </p>
    </main>
  );
}
