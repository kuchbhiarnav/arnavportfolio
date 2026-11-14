import { DurableObject } from 'cloudflare:workers';
import { decide, penalise, pickModel, type CounterStore, type Decision, type Limits } from './usage-core';

/**
 * One global instance. Durable Objects are single-threaded and `consume` makes no awaits, so check-and-increment
 * is atomic: concurrent requests cannot overshoot the cap. SQLite storage is the only backend on the Free plan.
 */
export class UsageGate extends DurableObject {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env as never);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS counters (k TEXT PRIMARY KEY, n INTEGER NOT NULL, day TEXT NOT NULL)');
    });
  }

  private store(): CounterStore {
    const sql = this.ctx.storage.sql;
    return {
      get: (k) => {
        const rows = sql.exec('SELECT n FROM counters WHERE k = ?', k).toArray();
        return rows.length ? Number(rows[0]!.n) : 0;
      },
      add: (k, day) => {
        sql.exec('INSERT INTO counters (k, n, day) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = n + 1', k, day);
        return 0;
      },
      prune: (day) => {
        sql.exec('DELETE FROM counters WHERE day < ?', day);
      },
    };
  }

  consume(clientKeys: string[], limits: Limits): Decision {
    return decide(this.store(), new Date(), clientKeys, limits);
  }

  /** The chosen model failed with a provider quota error before producing text: rest it for this minute and pick the next one. */
  fallback(limits: Limits, failed: string[]): { model?: string } {
    const store = this.store();
    const now = new Date();
    for (const id of failed) penalise(store, now, limits, id);
    return { model: pickModel(store, now, limits, failed).model };
  }
}
