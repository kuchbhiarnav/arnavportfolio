import { createIndex, retrieve, type Hit } from '../lib/search';
import type { KnowledgeBase } from '../lib/knowledge';
import { LineBuffer, parseEvent } from './stream';
import type { StreamEvent } from '../lib/schema';

export interface Loaded { kb: KnowledgeBase; index: ReturnType<typeof createIndex>; search(q: string, k?: number): Hit[] }

let loading: Promise<Loaded> | null = null;

/** Downloaded only the first time the assistant is used, then cached for the page's lifetime. */
export function loadKnowledge(): Promise<Loaded> {
  loading ??= fetch('/assistant/knowledge.json', { credentials: 'omit' })
    .then((r) => { if (!r.ok) throw new Error(`knowledge ${r.status}`); return r.json() as Promise<KnowledgeBase>; })
    .then((kb) => {
      const index = createIndex(kb.entries);
      return { kb, index, search: (q: string, k = 4) => retrieve(index, kb.entries, q, k) };
    })
    .catch((e) => { loading = null; throw e; });
  return loading;
}

let aiProbe: Promise<boolean> | null = null;
/** Asks the server whether AI mode is on. Any failure means "off": the site then uses local search. */
export function aiAvailable(): Promise<boolean> {
  aiProbe ??= fetch('/api/assistant-config', { cache: 'no-store', credentials: 'omit' })
    .then((r) => (r.ok ? (r.json() as Promise<{ ai?: unknown }>) : { ai: false }))
    .then((j) => j.ai === true)
    .catch(() => false);
  return aiProbe;
}

export function sessionId(): string {
  try {
    let id = sessionStorage.getItem('archive:sid');
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('archive:sid', id); }
    return id;
  } catch { return crypto.randomUUID(); }
}

/** Streams events from /api/ask. Never throws for expected failures; yields an error event instead. */
export async function* askAi(body: { message: string; history: { role: 'user' | 'model'; text: string }[]; sessionId: string }, signal: AbortSignal): AsyncGenerator<StreamEvent> {
  let res: Response;
  try {
    res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal, credentials: 'same-origin' });
  } catch {
    if (signal.aborted) return;
    yield { t: 'error', code: 'unavailable' };
    return;
  }
  if (!res.ok || !res.body) {
    const ev = await res.json().then((j) => parseEvent(JSON.stringify(j))).catch(() => null);
    yield ev && ev.t === 'error' ? ev : { t: 'error', code: res.status === 429 ? 'rate' : 'unavailable' };
    return;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  const buf = new LineBuffer();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of buf.push(dec.decode(value, { stream: true }))) { const ev = parseEvent(line); if (ev) yield ev; }
    }
    for (const line of buf.flush()) { const ev = parseEvent(line); if (ev) yield ev; }
  } catch {
    if (!signal.aborted) yield { t: 'error', code: 'unavailable' };
  }
}
