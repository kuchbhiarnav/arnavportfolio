import { afterEach, describe, expect, it } from 'vitest';
import { streamGemini } from '../src/lib/gemini';
import { AiError } from '../src/lib/ai';

const realFetch = globalThis.fetch;
let calls: { url: string; init: RequestInit & { body: string } }[] = [];
let queue: (() => Response)[] = [];
const install = () => { calls = []; globalThis.fetch = (async (url: string, init: RequestInit & { body: string }) => { calls.push({ url, init }); const next = queue.shift(); if (!next) throw new Error('no stub'); return next(); }) as typeof fetch; };
afterEach(() => { globalThis.fetch = realFetch; queue = []; });

const opts = () => ({ apiKey: 'secret-key', model: 'gemini-3.5-flash-lite', system: 'sys', contents: [{ role: 'user', parts: [{ text: 'hi' }] }, { role: 'model', parts: [{ text: 'yo' }] }], signal: new AbortController().signal, maxOutputTokens: 120 });
const sse = (...o: object[]) => new Response(o.map((x) => `data: ${JSON.stringify(x)}\n\n`).join(''), { status: 200 });
const part = (text: string, thought = false) => ({ candidates: [{ content: { parts: [{ text, ...(thought ? { thought: true } : {}) }] } }] });
const status = (s: number) => () => new Response('{}', { status: s });
async function collect(g: AsyncGenerator<string>) { let out = ''; for await (const c of g) out += c; return out; }

describe('Gemini streaming wrapper', () => {
  it('sends the key in a header only, bounds output, uses minimal thinking and hides thought parts', async () => {
    install();
    queue = [() => sse(part('secret reasoning', true), part('Hel'), part('lo'))];
    expect(await collect(streamGemini(opts()))).toBe('Hello');
    const c = calls[0]!;
    expect(c.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:streamGenerateContent?alt=sse');
    expect(c.url).not.toContain('secret-key');
    expect((c.init.headers as Record<string, string>)['x-goog-api-key']).toBe('secret-key');
    const body = JSON.parse(c.init.body);
    expect(body.generationConfig).toMatchObject({ maxOutputTokens: 120, temperature: 0.2, thinkingConfig: { thinkingLevel: 'minimal' } });
    expect(body.contents.map((m: { role: string }) => m.role)).toEqual(['user', 'model']);
    expect(body.systemInstruction.parts[0].text).toBe('sys');
    expect(c.init.body).not.toContain('secret-key');
  });
  it('retries once without the thinking option if the model rejects it (400)', async () => {
    install();
    queue = [status(400), () => sse(part('ok'))];
    expect(await collect(streamGemini(opts()))).toBe('ok');
    expect(JSON.parse(calls[1]!.init.body).generationConfig.thinkingConfig).toBeUndefined();
  });
  it('maps 429 to quota and 401/403/404 to unavailable, without retrying them', async () => {
    install(); queue = [status(429)];
    await expect(collect(streamGemini(opts()))).rejects.toMatchObject({ code: 'quota' });
    for (const s of [401, 403, 404]) { install(); queue = [status(s)]; await expect(collect(streamGemini(opts()))).rejects.toMatchObject({ code: 'unavailable' }); expect(calls).toHaveLength(1); }
  });
  it('retries a 503 once before any text, then gives up', async () => {
    install(); queue = [status(503), () => sse(part('fine'))];
    expect(await collect(streamGemini(opts()))).toBe('fine');
    install(); queue = [status(503), status(503)];
    await expect(collect(streamGemini(opts()))).rejects.toBeInstanceOf(AiError);
    expect(calls).toHaveLength(2);
  });
  it('treats a blocked prompt as blocked and reassembles an SSE event split across chunks', async () => {
    install(); queue = [() => sse({ promptFeedback: { blockReason: 'SAFETY' } })];
    await expect(collect(streamGemini(opts()))).rejects.toMatchObject({ code: 'blocked' });
    install();
    const whole = `data: ${JSON.stringify(part('split text'))}\n\n`;
    const enc = new TextEncoder();
    queue = [() => new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(whole.slice(0, 20))); c.enqueue(enc.encode(whole.slice(20))); c.close(); } }), { status: 200 })];
    expect(await collect(streamGemini(opts()))).toBe('split text');
  });
  it('never retries after text was produced, and reports an abort as a timeout', async () => {
    install();
    let pulls = 0;
    queue = [() => new Response(new ReadableStream({ pull(c) { if (pulls++ === 0) c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(part('partial'))}\n\n`)); else c.error(new Error('boom')); } }), { status: 200 })];
    const got: string[] = [];
    await expect((async () => { for await (const c of streamGemini(opts())) got.push(c); })()).rejects.toMatchObject({ code: 'unavailable' });
    expect(got).toEqual(['partial']); expect(calls).toHaveLength(1);
    const ac = new AbortController(); ac.abort();
    globalThis.fetch = (async () => { throw new DOMException('aborted', 'AbortError'); }) as typeof fetch;
    await expect(collect(streamGemini({ ...opts(), signal: ac.signal }))).rejects.toMatchObject({ code: 'timeout' });
  });
});
