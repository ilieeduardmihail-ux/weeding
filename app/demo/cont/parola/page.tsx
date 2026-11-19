import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Parolă nouă — cont demo",
  description: "Recuperează accesul la contul demo cu un cod primit pe email.",
  robots: { index: false, follow: false },
};

export default function DemoPasswordPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col justify-center gap-6 px-5 py-12">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Cont demo</p>
        <h1 className="mt-2 font-display text-3xl">Parolă nouă</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Îți trimitem un cod de 6 cifre pe email, apoi alegi parola. Datele din panou
          rămân exact cum le-ai lăsat.
        </p>
      </div>

      <ResetForm />
    </main>
  );
}
