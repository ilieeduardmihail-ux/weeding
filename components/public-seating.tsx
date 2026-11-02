type Table = { table: number; names: string[] };

export function PublicSeating({ tables }: { tables: Table[] }) {
  return (
    <section id="seating" className="bg-mist/60 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="font-display text-4xl">Unde stai</h2>
        <p className="mt-3 text-ink/70">
          Caută-ți numele în listă. Masa apare și când îți verifici răspunsul.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map(({ table, names }) => (
            <div key={table} className="rounded-lg bg-sea/70 p-5 ring-1 ring-ink/10">
              <h3 className="font-display text-2xl">Masa {table}</h3>
              <ul className="mt-3 space-y-1 text-ink/80">
                {names.map((name, index) => (
                  <li key={`${name}-${index}`}>{name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
