import type { CounterStore } from '../../src/lib/usage-core';

/** In-memory CounterStore with the same semantics as the Durable Object's SQLite table. */
export function memoryStore() {
  const rows = new Map<string, { n: number; day: string }>();
  const store: CounterStore = {
    get: (k) => rows.get(k)?.n ?? 0,
    add: (k, day) => { const r = rows.get(k) ?? { n: 0, day }; r.n++; rows.set(k, r); return r.n; },
    prune: (day) => { for (const [k, r] of rows) if (r.day < day) rows.delete(k); },
  };
  return { store, rows };
}
