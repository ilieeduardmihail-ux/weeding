import type { Metadata } from "next";
import { ActivateForm } from "./activate-form";

export const metadata: Metadata = {
  title: "Activează-ți invitația",
  description: "Introdu cheia de acces primită pentru a-ți activa site-ul nunții.",
  robots: { index: false, follow: false },
};

export default function StartPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Bine ai venit</p>
        <h1 className="mt-3 font-display text-4xl">Activează-ți invitația</h1>
        <p className="mt-3 text-ink/70">
          Introdu cheia de acces primită de la organizator, împreună cu un email și o parolă pentru
          contul tău de administrare.
        </p>
      </div>

      <ActivateForm />

      <p className="text-center text-xs leading-relaxed text-ink/55">
        Cheia se folosește o singură dată. Perioada de valabilitate începe din momentul activării.
      </p>
    </main>
  );
}
