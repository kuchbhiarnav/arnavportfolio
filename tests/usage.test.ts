import { describe, expect, it } from 'vitest';
import { decide } from '../src/lib/usage-core';
import { memoryStore } from './helpers/memory-store';

const L = { perMinute: 3, perClientDaily: 5, globalDaily: 8 };
const at = (iso: string) => new Date(iso);

describe('usage gate (hard application-level cap)', () => {
  it('allows requests under every limit and counts them', () => {
    const { store } = memoryStore();
    expect(decide(store, at('2026-11-07T10:00:00Z'), ['ip:a'], L).ok).toBe(true);
    expect(store.get('g:2026-11-07')).toBe(1);
    expect(store.get('d:2026-11-07:ip:a')).toBe(1);
  });

  it('refuses a burst and tells the client when to retry', () => {
    const { store } = memoryStore();
    for (let i = 0; i < 3; i++) expect(decide(store, at('2026-11-07T10:00:10Z'), ['ip:a'], L).ok).toBe(true);
    const d = decide(store, at('2026-11-07T10:00:20Z'), ['ip:a'], L);
    expect(d).toEqual({ ok: false, reason: 'burst', retryAfterSec: 40 });
    // next minute is a fresh window
    expect(decide(store, at('2026-11-07T10:01:00Z'), ['ip:a'], L).ok).toBe(true);
  });

  it('enforces the per-client daily limit and resets at UTC midnight', () => {
    const { store } = memoryStore();
    for (let m = 0; m < 5; m++) expect(decide(store, at(`2026-11-07T10:0${m}:00Z`), ['ip:a'], L).ok).toBe(true);
    const d = decide(store, at('2026-11-07T10:09:00Z'), ['ip:a'], L);
    expect(d.ok).toBe(false);
    if (!d.ok) { expect(d.reason).toBe('client-daily'); expect(d.retryAfterSec).toBe(13 * 3600 + 51 * 60); }
    expect(decide(store, at('2026-11-08T00:00:01Z'), ['ip:a'], L).ok).toBe(true);
  });

  it('enforces the global daily cap across different clients', () => {
    const { store } = memoryStore();
    for (let i = 0; i < 8; i++) expect(decide(store, at(`2026-11-07T1${i}:00:00Z`), [`ip:${i}`], L).ok).toBe(true);
    const d = decide(store, at('2026-11-07T20:00:00Z'), ['ip:fresh'], L);
    expect(d).toMatchObject({ ok: false, reason: 'global-daily' });
  });

  it('a refused request never consumes budget', () => {
    const { store } = memoryStore();
    for (let i = 0; i < 3; i++) decide(store, at('2026-11-07T10:00:00Z'), ['ip:a'], L);
    const before = store.get('g:2026-11-07');
    for (let i = 0; i < 50; i++) decide(store, at('2026-11-07T10:00:30Z'), ['ip:a'], L);
    expect(store.get('g:2026-11-07')).toBe(before);
  });

  it('rotating the session id does not escape the IP limit, and one IP cannot starve others', () => {
    const { store } = memoryStore();
    for (let i = 0; i < 3; i++) expect(decide(store, at('2026-11-07T10:00:00Z'), ['ip:a', `s:${i}`], L).ok).toBe(true);
    expect(decide(store, at('2026-11-07T10:00:01Z'), ['ip:a', 's:new'], L)).toMatchObject({ ok: false, reason: 'burst' });
    expect(decide(store, at('2026-11-07T10:00:01Z'), ['ip:b', 's:x'], L).ok).toBe(true);
  });

  it('prunes old days so counters cannot grow without bound', () => {
    const { store, rows } = memoryStore();
    decide(store, at('2026-11-05T10:00:00Z'), ['ip:a'], L);
    expect(rows.size).toBeGreaterThan(0);
    decide(store, at('2026-11-07T10:00:00Z'), ['ip:a'], L);
    expect([...rows.keys()].some((k) => k.includes('2026-11-05'))).toBe(false);
  });

  it('is atomic by construction: no awaits, one synchronous decision', () => {
    // The Durable Object runs `decide` synchronously and is single-threaded; concurrent callers are serialised.
    const { store } = memoryStore();
    const results = Array.from({ length: 20 }, () => decide(store, at('2026-11-07T10:00:00Z'), ['ip:a'], { perMinute: 100, perClientDaily: 100, globalDaily: 7 }));
    expect(results.filter((r) => r.ok)).toHaveLength(7);
  });

  it('caps all visitors together per minute, to stay under the provider requests-per-minute quota', () => {
    const { store } = memoryStore();
    const G = { ...L, perMinute: 9, globalDaily: 99, globalPerMinute: 4 };
    for (let i = 0; i < 4; i++) expect(decide(store, at('2026-11-07T10:00:05Z'), [`ip:${i}`], G).ok).toBe(true);
    expect(decide(store, at('2026-11-07T10:00:30Z'), ['ip:other'], G)).toEqual({ ok: false, reason: 'burst', retryAfterSec: 30 });
    expect(decide(store, at('2026-11-07T10:01:00Z'), ['ip:other'], G).ok).toBe(true);
  });

  it('can start a new day at midnight Pacific time, when the provider quota resets', () => {
    const { store } = memoryStore();
    const P = { ...L, perClientDaily: 1, resetZone: 'America/Los_Angeles' };
    expect(decide(store, at('2026-11-07T20:00:00Z'), ['ip:a'], P).ok).toBe(true); // 12:00 Pacific
    const d = decide(store, at('2026-11-08T07:00:00Z'), ['ip:a'], P); // 23:00 Pacific, same Pacific day
    expect(d).toMatchObject({ ok: false, reason: 'client-daily', retryAfterSec: 3600 });
    expect(decide(store, at('2026-11-08T08:00:01Z'), ['ip:a'], P).ok).toBe(true); // just after midnight Pacific
  });
});
