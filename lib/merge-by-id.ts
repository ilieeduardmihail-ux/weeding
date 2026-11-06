/**
 * Reconciles a server-rendered list with the local optimistic list.
 *
 * Rows that did not change keep their previous object identity, so the
 * `React.memo` row components skip re-rendering when the page refreshes in the
 * background. Only rows whose content really changed get a new identity.
 */
export function mergeById<T extends { id: string }>(
  previous: readonly T[],
  incoming: readonly T[],
  same: (a: T, b: T) => boolean,
): T[] {
  if (previous.length === 0) return [...incoming];
  const byId = new Map(previous.map((item) => [item.id, item]));
  return incoming.map((item) => {
    const old = byId.get(item.id);
    return old && same(old, item) ? old : item;
  });
}
