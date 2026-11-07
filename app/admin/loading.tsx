/**
 * Instant navigation feedback for /admin. The nav stays mounted; only the
 * content area shows a calm skeleton while the next section streams in.
 * Purely opacity-based (no spinner, no layout animation).
 */
export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12" aria-busy="true">
      <span className="sr-only">Se încarcă secțiunea…</span>
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
