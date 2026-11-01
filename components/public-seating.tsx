type Table = { table: number; names: string[] };

export function PublicSeating({ tables }: { tables: Table[] }) {
  return (
    <section id="seating" className="bg-mist/60 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="font-display text-4xl">Where you’ll sit</h2>
        <p className="mt-3 text-ink/70">
          Find your name in the list below. Tables are also shown when you check your RSVP.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map(({ table, names }) => (
            <div key={table} className="rounded-lg bg-sea p-5">
              <h3 className="font-display text-2xl">Table {table}</h3>
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
