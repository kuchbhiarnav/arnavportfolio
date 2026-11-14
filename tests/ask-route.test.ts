import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { decide, penalise, pickModel } from '../src/lib/usage-core';
import { memoryStore } from './helpers/memory-store';
import type { KnowledgeEntry } from '../src/lib/knowledge';

const entries: KnowledgeEntry[] = [
  { id: 'case.x.y', kind: 'case-study', title: 'Groundwater arsenic work', text: 'Groundwater arsenic decision support in Bangladesh using Power BI.', url: '/projects/x', source: 's', status: 'owner-supplied', keywords: ['groundwater', 'arsenic'] },
  { id: 'exp.plutas', kind: 'experience', title: 'Plutas role', text: 'Parametric insurance research at Plutas.ai.', url: '/about#experience', source: 's', status: 'owner-supplied', keywords: ['insurance'] },
];
vi.mock('../src/lib/knowledge-source', () => ({ loadKnowledge: async () => ({ entries, nav: [] }) }));
const streamMock = vi.fn();
vi.mock('../src/lib/gemini', () => ({ streamGemini: (o: unknown) => streamMock(o) }));

const { POST, ALL } = await import('../src/pages/api/ask');
const { AiError } = await import('../src/lib/ai');

const KEY = 'SECRET-KEY-should-never-leak';
const E = env as unknown as Record<string, unknown>;

function configure(over: Record<string, unknown> = {}, store = memoryStore().store) {
  for (const k of Object.keys(E)) delete E[k];
  Object.assign(E, {
    AI_ENABLED: 'true', GEMINI_API_KEY: KEY, RATE_SALT: 'a-long-random-salt-value', GEMINI_MODELS: 'gemini-3.5-flash-lite,gemini-3.1-flash-lite',
    AI_CLIENT_PER_MINUTE: '3', AI_CLIENT_DAILY_LIMIT: '20', AI_GLOBAL_DAILY_LIMIT: '100',
    USAGE_GATE: { idFromName: () => 'id', get: () => ({
      consume: async (keys: string[], limits: never) => decide(store, new Date(), keys, limits),
      fallback: async (limits: never, failed: string[]) => { for (const id of failed) penalise(store, new Date(), limits, id); return { model: pickModel(store, new Date(), limits, failed).model }; },
    }) },
    ...over,
  });
}
const call = (body: unknown, headers: Record<string, string> = {}) =>
  POST({ request: new Request('https://site.example/api/ask', { method: 'POST', headers: { origin: 'https://site.example', 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }) } as never);
const lines = async (r: Response) => (await r.text()).trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

beforeEach(() => {
  streamMock.mockReset();
  streamMock.mockImplementation(async function* () { yield 'Arnav worked on '; yield 'groundwater research [case.x.y] and [made.up].'; });
  configure();
});

describe('POST /api/ask: defences, in order', () => {
  it('rejects cross-origin requests before doing anything else', async () => {
    const r = await call({ message: 'hi' }, { origin: 'https://evil.example' });
    expect(r.status).toBe(403);
    expect(streamMock).not.toHaveBeenCalled();
  });

  it('is disabled unless the owner opted in, and says so', async () => {
    configure({ AI_ENABLED: 'false' });
    const r = await call({ message: 'hi' });
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ t: 'error', code: 'disabled' });
    expect(streamMock).not.toHaveBeenCalled();
  });

  it('fails closed when the key, salt or usage gate is missing', async () => {
    for (const missing of ['GEMINI_API_KEY', 'RATE_SALT', 'USAGE_GATE']) {
      configure(); delete E[missing];
      expect((await call({ message: 'hi' })).status, missing).toBe(503);
    }
    expect(streamMock).not.toHaveBeenCalled();
  });

  it('validates input: bad JSON, unknown keys, oversized bodies', async () => {
    expect((await call('{not json')).status).toBe(400);
    expect((await call({ message: 'hi', model: 'some-other-model' })).status).toBe(400);
    expect((await call({ message: 'x'.repeat(501) })).status).toBe(400);
    expect((await call({ message: 'hi', pad: 'x'.repeat(9000) })).status).toBe(413);
    expect(streamMock).not.toHaveBeenCalled();
  });

  it('enforces the usage gate BEFORE any model call and returns Retry-After', async () => {
    const ok = [await call({ message: 'groundwater' }), await call({ message: 'groundwater' }), await call({ message: 'groundwater' })];
    for (const r of ok) { expect(r.status).toBe(200); await r.text(); }
    expect(streamMock).toHaveBeenCalledTimes(3);
    const refused = await call({ message: 'groundwater' });
    expect(refused.status).toBe(429);
    expect(await refused.json()).toEqual({ t: 'error', code: 'rate' });
    expect(Number(refused.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(streamMock).toHaveBeenCalledTimes(3); // the refused request never reached the model
  });

  it('reports the daily budget as "quota"', async () => {
    configure({ AI_GLOBAL_DAILY_LIMIT: '1' });
    await (await call({ message: 'groundwater' })).text();
    const r = await call({ message: 'groundwater' });
    expect(r.status).toBe(429);
    expect(await r.json()).toEqual({ t: 'error', code: 'quota' });
  });
});

describe('POST /api/ask: streaming', () => {
  it('streams meta, deltas and a done event with only valid citations', async () => {
    const r = await call({ message: 'Explain the groundwater research', history: [{ role: 'user', text: 'hi' }], sessionId: 'abcdefgh-1234' });
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('application/x-ndjson');
    expect(r.headers.get('cache-control')).toBe('no-store');
    const ev = await lines(r);
    expect(ev[0].t).toBe('meta');
    expect(ev[0].sources.map((s: { id: string }) => s.id)).toContain('case.x.y');
    expect(ev.filter((e) => e.t === 'delta').map((e) => e.text).join('')).toContain('groundwater research');
    expect(ev.at(-1)).toEqual({ t: 'done', cited: ['case.x.y'] }); // [made.up] is dropped
  });

  it('calls the model with the configured model, bounded output, a timeout signal and delimited context', async () => {
    await (await call({ message: 'Explain the groundwater research' })).text();
    const o = streamMock.mock.calls[0]![0];
    expect(o.model).toBe('gemini-3.5-flash-lite');
    expect(o.maxOutputTokens).toBeLessThanOrEqual(1500);
    expect(o.signal).toBeInstanceOf(AbortSignal);
    expect(o.system).toContain('Never guess or invent facts about Arnav');
    expect(o.contents.at(-1).parts[0].text).toContain('<knowledge>');
    expect(o.contents.at(-1).parts[0].text).toContain('<visitor_question>');
  });

  it('moves to the next model in the pool when the first reports a quota error before any text', async () => {
    const models: string[] = [];
    streamMock.mockImplementation(async function* (o: { model: string }) {
      models.push(o.model);
      if (o.model === 'gemini-3.5-flash-lite') throw new AiError('quota');
      yield 'Answer from the second model [case.x.y].';
    });
    const ev = await lines(await call({ message: 'Explain the groundwater research' }));
    expect(models).toEqual(['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
    expect(ev.at(-1).t).toBe('done');
  });

  it('does not fall back once text has been sent, and never tries a model twice', async () => {
    const models: string[] = [];
    streamMock.mockImplementation(async function* (o: { model: string }) { models.push(o.model); yield 'partial '; throw new AiError('unavailable'); });
    expect((await lines(await call({ message: 'Explain the groundwater research' }))).at(-1)).toEqual({ t: 'error', code: 'unavailable' });
    expect(models).toHaveLength(1);
    models.length = 0;
    streamMock.mockImplementation(async function* (o: { model: string }) { models.push(o.model); throw new AiError('quota'); });
    expect((await lines(await call({ message: 'Explain the groundwater research again' }, { 'cf-connecting-ip': '203.0.113.77' }))).at(-1)).toEqual({ t: 'error', code: 'quota' });
    expect(models).toEqual(['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
  });

  it('maps model failures to typed errors without leaking details', async () => {
    for (const code of ['quota', 'timeout', 'blocked', 'unavailable'] as const) {
      configure();
      streamMock.mockImplementation(async function* () { throw new AiError(code, 'internal detail ' + KEY); });
      const ev = await lines(await call({ message: 'groundwater' }));
      expect(ev.at(-1)).toEqual({ t: 'error', code });
    }
  });

  it('turns an unexpected exception into a generic "unavailable"', async () => {
    streamMock.mockImplementation(async function* () { throw new Error('boom ' + KEY); });
    const ev = await lines(await call({ message: 'groundwater' }));
    expect(ev.at(-1)).toEqual({ t: 'error', code: 'unavailable' });
  });

  it('never puts the API key in any response', async () => {
    const bodies = [
      await (await call({ message: 'groundwater' })).text(),
      JSON.stringify(await (await call({ message: 'x'.repeat(600) })).json()),
      await (await call({ message: 'hi' }, { origin: 'https://evil.example' })).text(),
    ];
    for (const b of bodies) expect(b).not.toContain(KEY);
  });
});

describe('other methods', () => {
  it('refuses anything but POST', () => {
    const r = (ALL as (c: unknown) => Response)({});
    expect(r.status).toBe(405);
    expect(r.headers.get('allow')).toBe('POST');
  });
});
