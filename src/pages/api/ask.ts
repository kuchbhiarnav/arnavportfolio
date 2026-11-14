import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { readConfig } from '../../lib/config';
import { askSchema, LIMITS, type StreamEvent } from '../../lib/schema';
import { clientKey, readLimitedText, sameOrigin } from '../../lib/security';
import { loadKnowledge } from '../../lib/knowledge-source';
import { createIndex, retrieve } from '../../lib/search';
import { AiError } from '../../lib/ai';
import { streamGemini } from '../../lib/gemini';
import { SYSTEM_INSTRUCTIONS, buildUserTurn, citedIds, portfolioMap } from '../../lib/prompt';
import type { KnowledgeEntry } from '../../lib/knowledge';
import type { UsageGate } from '../../lib/usage-gate';

export const prerender = false;

const enc = new TextEncoder();
/** How long one model gets to produce its first words before the pool moves on to the next. */
const FIRST_BYTE_MS = 8000;
const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const fail = (status: number, code: StreamEvent extends infer E ? (E extends { t: 'error'; code: infer C } ? C : never) : never, extra: HeadersInit = {}) =>
  new Response(JSON.stringify({ t: 'error', code }), { status, headers: { ...JSON_HEADERS, ...extra } });

let cache: { entries: KnowledgeEntry[]; index: ReturnType<typeof createIndex>; map: string } | undefined;
async function knowledge() {
  if (!cache) {
    const kb = await loadKnowledge();
    cache = { entries: kb.entries, index: createIndex(kb.entries), map: portfolioMap(kb.entries) };
  }
  return cache;
}

export const POST: APIRoute = async ({ request }) => {
  const e = env as unknown as Record<string, unknown> & { USAGE_GATE?: DurableObjectNamespace<UsageGate> };
  const cfg = readConfig(e);

  // 1. Same-origin only. A cross-site page cannot spend the owner's budget.
  if (!sameOrigin(request, cfg.siteUrl)) return fail(403, 'invalid');

  // 2. Owner kill switch and fail-closed configuration. No key, no salt or no gate => no model call, ever.
  if (!cfg.aiAvailable || !cfg.salt || !cfg.apiKey || !e.USAGE_GATE) return fail(503, 'disabled');

  // 3. Bounded, validated input.
  const raw = await readLimitedText(request, LIMITS.body);
  if (raw === null) return fail(413, 'invalid');
  let parsed;
  try { parsed = askSchema.safeParse(JSON.parse(raw)); } catch { return fail(400, 'invalid'); }
  if (!parsed.success) return fail(400, 'invalid');
  const { message, history, sessionId } = parsed.data;

  // 4. Hard, shared, atomic usage limits, checked BEFORE any model call.
  const keys = [`ip:${await clientKey(request, cfg.salt)}`, ...(sessionId ? [`s:${sessionId}`] : [])];
  const gate = e.USAGE_GATE.get(e.USAGE_GATE.idFromName('global'));
  const limits = { ...cfg.limits, models: cfg.models };
  const decision = await gate.consume(keys, limits);
  if (!decision.ok) {
    return fail(429, decision.reason === 'burst' ? 'rate' : 'quota', { 'Retry-After': String(decision.retryAfterSec) });
  }

  // 5. Retrieval from the approved knowledge only.
  const { entries, index, map } = await knowledge();
  const lastUser = [...history].reverse().find((h) => h.role === 'user')?.text ?? '';
  const query = message.split(/\s+/).length < 5 ? `${lastUser} ${message}` : message;
  const hits = retrieve(index, entries, query, 6);
  const given = hits.map((h) => h.entry);

  // 6. Stream, with a hard timeout per attempt and client-disconnect cancellation.
  const ctrl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  request.signal.addEventListener('abort', () => ctrl.abort());

  const contents = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: buildUserTurn(given, message, map) }] },
  ];

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: StreamEvent) => controller.enqueue(enc.encode(JSON.stringify(ev) + '\n'));
      let full = '';
      try {
        send({ t: 'meta', sources: given.slice(0, 4).map((x) => ({ id: x.id, title: x.title, url: x.url })) });
        // The pool picked a model with budget left. If it fails with a provider quota or availability error before any text, rest it
        // and move to the next model in the pool (counted against that model's own cap) instead of failing the visitor.
        let model = decision.model ?? cfg.models[0]?.id ?? '';
        const failed: string[] = [];
        for (;;) {
          const attempt = new AbortController();
          ctrl.signal.addEventListener('abort', () => attempt.abort());
          clearTimeout(timer);
          // A model that has not started answering within a few seconds is replaced by the next one; once text flows the full timeout applies.
          timer = setTimeout(() => attempt.abort(), FIRST_BYTE_MS);
          try {
            for await (const delta of streamGemini({ apiKey: cfg.apiKey!, model, system: SYSTEM_INSTRUCTIONS, contents, signal: attempt.signal, maxOutputTokens: cfg.maxOutputTokens })) {
              if (!full) { clearTimeout(timer); timer = setTimeout(() => attempt.abort(), cfg.requestTimeoutMs); }
              full += delta;
              send({ t: 'delta', text: delta });
            }
            break;
          } catch (err) {
            const retryable = err instanceof AiError && ['quota', 'unavailable', 'timeout'].includes(err.code);
            if (!full && retryable && !ctrl.signal.aborted && failed.length < cfg.models.length - 1) {
              failed.push(model);
              const next = (await gate.fallback(limits, failed)).model;
              if (next) { model = next; continue; }
            }
            throw err;
          }
        }
        // The model may cite any entry in the map; make sure the visitor gets a link for each one it cited.
        const cited = citedIds(full, entries);
        const extra = entries.filter((x) => cited.includes(x.id) && !given.slice(0, 4).includes(x));
        if (extra.length) send({ t: 'meta', sources: extra.map((x) => ({ id: x.id, title: x.title, url: x.url })) });
        send({ t: 'done', cited });
      } catch (err) {
        send({ t: 'error', code: err instanceof AiError ? err.code : 'unavailable' });
      } finally {
        clearTimeout(timer);
        controller.close();
      }
    },
    cancel() { clearTimeout(timer); ctrl.abort(); },
  });

  return new Response(body, { headers: { ...JSON_HEADERS, 'Content-Type': 'application/x-ndjson; charset=utf-8' } });
};

// Anything but POST is refused explicitly.
export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });
