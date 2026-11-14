import { describe, expect, it } from 'vitest';
import { decide, penalise, pickModel, type Limits } from '../src/lib/usage-core';
import { memoryStore } from './helpers/memory-store';
import { budgetsFor } from '../src/lib/models';

const models = budgetsFor(['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
const limits = (over: Partial<Limits> = {}): Limits => ({ perMinute: 1000, perClientDaily: 100000, globalDaily: 100000, globalPerMinute: 100000, resetZone: 'America/Los_Angeles', models, ...over });
const T0 = new Date('2026-11-13T12:00:00Z');
const at = (min: number) => new Date(T0.getTime() + min * 60_000);

describe('model pool and the daily cap', () => {
  it('uses the first model until its minute budget is gone, then the second, then stops', () => {
    const { store } = memoryStore();
    const used: string[] = [];
    for (let i = 0; i < 30; i++) { const d = decide(store, T0, [`c${i}`], limits()); if (d.ok) used.push(d.model!); }
    expect(used.filter((m) => m === 'gemini-3.5-flash-lite')).toHaveLength(12); // 80% of 15 per minute
    expect(used.filter((m) => m === 'gemini-3.1-flash-lite')).toHaveLength(12);
    expect(used).toHaveLength(24);
    const refused = decide(store, T0, ['late'], limits());
    expect(refused).toMatchObject({ ok: false, reason: 'burst' });
  });

  it('never lets any model exceed its daily cap, however many minutes pass', () => {
    const { store } = memoryStore();
    const perModel: Record<string, number> = {};
    let refusedDaily = 0;
    // 40 minutes, 30 attempts a minute: far more than the pool can take.
    for (let m = 0; m < 40; m++) for (let i = 0; i < 30; i++) {
      const d = decide(store, at(m), [`c${m}-${i}`], limits());
      if (d.ok) perModel[d.model!] = (perModel[d.model!] ?? 0) + 1; else if (d.reason === 'global-daily') refusedDaily++;
    }
    for (const m of models) expect(perModel[m.id] ?? 0).toBeLessThanOrEqual(m.perDay);
    expect(perModel['gemini-3.5-flash-lite']).toBe(450);
    expect(perModel['gemini-3.1-flash-lite']).toBe(450);
    expect(refusedDaily).toBeGreaterThan(0); // after 900 answers the site stops asking Google
  });

  it('a refused request consumes no budget on any model', () => {
    const { store } = memoryStore();
    const l = limits({ perClientDaily: 1 });
    expect(decide(store, T0, ['same'], l).ok).toBe(true);
    for (let i = 0; i < 5; i++) expect(decide(store, T0, ['same'], l)).toMatchObject({ ok: false, reason: 'client-daily' });
    // only one model request was ever counted
    let total = 0; for (const m of models) { const p = pickModel(store, T0, limits({ models: [m] })); if (p.model) total++; }
    expect(total).toBe(2);
    expect(store.get(`md:2026-11-13:${models[0]!.id}`)).toBe(2); // 1 real + 1 probe from this assertion
  });

  it('resets at midnight Pacific time, not UTC', () => {
    const { store } = memoryStore();
    const l = limits({ models: [{ id: 'm', perMinute: 100000, perDay: 3 }] });
    const before = new Date('2026-11-13T07:30:00Z'); // 23:30 on the 12th in Los Angeles (UTC-8)
    for (let i = 0; i < 3; i++) expect(decide(store, before, [`a${i}`], l).ok).toBe(true);
    expect(decide(store, before, ['a9'], l)).toMatchObject({ ok: false, reason: 'global-daily' });
    expect(decide(store, new Date('2026-11-13T08:30:00Z'), ['b1'], l).ok).toBe(true); // 00:30 on the 13th Pacific
  });

  it('rests a model after a provider quota error and falls back to the next', () => {
    const { store } = memoryStore();
    penalise(store, T0, limits(), 'gemini-3.5-flash-lite');
    expect(pickModel(store, T0, limits()).model).toBe('gemini-3.1-flash-lite');
    expect(pickModel(store, T0, limits(), ['gemini-3.1-flash-lite']).model).toBeUndefined();
    expect(pickModel(store, at(1), limits()).model).toBe('gemini-3.5-flash-lite'); // next minute: available again
  });

  it('without a pool the gate behaves as before', () => {
    const { store } = memoryStore();
    expect(decide(store, T0, ['x'], { perMinute: 3, perClientDaily: 5, globalDaily: 50 })).toEqual({ ok: true, model: undefined });
  });
});
