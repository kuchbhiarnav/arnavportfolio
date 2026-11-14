/**
 * Spend and abuse control for the AI endpoint: pure counting logic, independent of where the counters live.
 *
 * Why this exists: provider budget alerts do not stop spending, and a per-location rate limiter is approximate.
 * This gate is the hard application-level cap: it is atomic (one Durable Object serialises every call) and refuses
 * a request BEFORE any model call is made. Its limits: it caps requests, not tokens or money. A request that is
 * allowed can still cost more than average, so the caps are deliberately small and the model's output is bounded.
 * A hard cap on actual spend must be set at the provider (project quota) as well.
 */

export interface CounterStore {
  get(key: string): number;
  add(key: string, day: string): number;
  /** Delete counters from days before `day`. */
  prune(day: string): void;
}

export interface ModelCap { id: string; perMinute: number; perDay: number }

export interface Limits {
  perMinute: number;
  perClientDaily: number;
  globalDaily: number;
  /** Cap on all visitors together per minute, matching the provider's requests-per-minute quota. Omitted = no cap. */
  globalPerMinute?: number;
  /** IANA time zone whose midnight starts a new day. The daily caps reset at midnight in this zone. Default UTC. */
  resetZone?: string;
  /** Ordered pool of models with their own daily and per-minute caps. The first model with budget left is used. */
  models?: ModelCap[];
}

/** Calendar day (YYYY-MM-DD) in a time zone, and the seconds left until that zone's next midnight. */
export function dayInfo(now: Date, zone = 'UTC'): { day: string; secondsToReset: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(now);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const day = `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}-${parts.find((p) => p.type === 'day')!.value}`;
  return { day, secondsToReset: Math.max(1, 86400 - (g('hour') * 3600 + g('minute') * 60 + g('second'))) };
}

export type Decision =
  | { ok: true; model?: string }
  | { ok: false; reason: 'burst' | 'client-daily' | 'global-daily'; retryAfterSec: number };

/**
 * Picks the first model in the pool that still has budget today and this minute (skipping `skip`), and counts the request
 * against it. Returns undefined when every model is used up. Daily counters never exceed a model's cap.
 */
export function pickModel(store: CounterStore, now: Date, limits: Limits, skip: string[] = []): { model?: string; reason?: 'burst' | 'global-daily'; retryAfterSec: number } {
  const { day, secondsToReset } = dayInfo(now, limits.resetZone);
  const minute = Math.floor(now.getTime() / 60_000);
  const toNextMinute = 60 - Math.floor((now.getTime() / 1000) % 60);
  let minuteBlocked = false;
  for (const m of limits.models ?? []) {
    if (skip.includes(m.id)) continue;
    if (store.get(`md:${day}:${m.id}`) >= m.perDay) continue;
    if (store.get(`mm:${minute}:${m.id}`) >= m.perMinute) { minuteBlocked = true; continue; }
    store.add(`md:${day}:${m.id}`, day);
    store.add(`mm:${minute}:${m.id}`, day);
    return { model: m.id, retryAfterSec: 0 };
  }
  return minuteBlocked ? { reason: 'burst', retryAfterSec: toNextMinute } : { reason: 'global-daily', retryAfterSec: secondsToReset };
}

/** The provider said "quota" for this model: stop using it for the rest of this minute. */
export function penalise(store: CounterStore, now: Date, limits: Limits, id: string): void {
  const m = limits.models?.find((x) => x.id === id);
  if (!m) return;
  const { day } = dayInfo(now, limits.resetZone);
  const minute = Math.floor(now.getTime() / 60_000);
  const key = `mm:${minute}:${id}`;
  for (let n = store.get(key); n < m.perMinute; n++) store.add(key, day);
}

export function decide(store: CounterStore, now: Date, clientKeys: string[], limits: Limits): Decision {
  const t = now.getTime();
  const { day, secondsToReset: toMidnight } = dayInfo(now, limits.resetZone);
  const minute = Math.floor(t / 60_000);
  const toNextMinute = 60 - Math.floor((t / 1000) % 60);

  store.prune(day);

  const keys = [...new Set(clientKeys)];
  for (const k of keys) {
    if (store.get(`m:${minute}:${k}`) >= limits.perMinute) return { ok: false, reason: 'burst', retryAfterSec: toNextMinute };
    if (store.get(`d:${day}:${k}`) >= limits.perClientDaily) return { ok: false, reason: 'client-daily', retryAfterSec: toMidnight };
  }
  if (store.get(`g:${day}`) >= limits.globalDaily) return { ok: false, reason: 'global-daily', retryAfterSec: toMidnight };
  if (limits.globalPerMinute !== undefined && store.get(`gm:${minute}`) >= limits.globalPerMinute) return { ok: false, reason: 'burst', retryAfterSec: toNextMinute };

  // A model must have budget before anything is consumed, so a refused request never uses up budget.
  let model: string | undefined;
  if (limits.models?.length) {
    const p = pickModel(store, now, limits);
    if (!p.model) return { ok: false, reason: p.reason ?? 'global-daily', retryAfterSec: p.retryAfterSec };
    model = p.model;
  }

  // Only now consume the client and global counters.
  store.add(`g:${day}`, day);
  if (limits.globalPerMinute !== undefined) store.add(`gm:${minute}`, day);
  for (const k of keys) {
    store.add(`m:${minute}:${k}`, day);
    store.add(`d:${day}:${k}`, day);
  }
  return { ok: true, model };
}
