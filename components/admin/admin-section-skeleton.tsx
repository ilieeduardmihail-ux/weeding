/**
 * Calm, opacity-only placeholder used only for the very first admin load,
 * before the shared dataset arrives. Section switches never show it again.
 */
export function AdminSectionSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12" aria-busy="true">
      <span className="sr-only">Se încarcă datele…</span>
      <div className="animate-pulse">
        <div className="h-10 w-64 max-w-full rounded-md bg-ink/10" />
        <div className="mt-4 h-4 w-96 max-w-full rounded bg-ink/10" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-28 rounded-lg bg-ink/10" />
          ))}
        </div>
      </div>
    </main>
  );
}
