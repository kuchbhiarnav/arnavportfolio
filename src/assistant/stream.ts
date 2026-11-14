import type { StreamEvent } from '../lib/schema';

const CODES = new Set(['quota', 'rate', 'timeout', 'blocked', 'unavailable', 'disabled', 'invalid']);

/** Validates one line of the server's NDJSON stream. Anything unexpected is dropped, never trusted. */
export function parseEvent(line: string): StreamEvent | null {
  let o: unknown;
  try { o = JSON.parse(line); } catch { return null; }
  if (!o || typeof o !== 'object') return null;
  const e = o as Record<string, unknown>;
  switch (e.t) {
    case 'delta': return typeof e.text === 'string' ? { t: 'delta', text: e.text.slice(0, 4000) } : null;
    case 'done': return { t: 'done', cited: Array.isArray(e.cited) ? e.cited.filter((x): x is string => typeof x === 'string').slice(0, 10) : [] };
    case 'error': return typeof e.code === 'string' && CODES.has(e.code) ? { t: 'error', code: e.code as Extract<StreamEvent, { t: 'error' }>['code'] } : null;
    case 'meta': {
      if (!Array.isArray(e.sources)) return null;
      const sources = e.sources
        .filter((s): s is { id: string; title: string; url: string } => !!s && typeof s.id === 'string' && typeof s.title === 'string' && typeof s.url === 'string')
        .filter((s) => s.url.startsWith('/') && !s.url.startsWith('//')) // internal links only
        .slice(0, 6);
      return { t: 'meta', sources };
    }
    default: return null;
  }
}

/** Splits a streamed text chunk sequence into complete lines. */
export class LineBuffer {
  private buf = '';
  push(chunk: string): string[] {
    this.buf += chunk;
    const parts = this.buf.split('\n');
    this.buf = parts.pop() ?? '';
    return parts.filter(Boolean);
  }
  flush(): string[] { const r = this.buf.trim() ? [this.buf] : []; this.buf = ''; return r; }
}

/** Removes citation markers like [case.x.outcomes] from display text, including a partial marker still arriving. */
export function cleanForDisplay(text: string): string {
  return text.replace(/\s?\[[a-z]+\.[a-z0-9._-]+(?:\s*,\s*[a-z]+\.[a-z0-9._-]+)*\]/gi, '').replace(/\s?\[[a-z0-9._,\s-]*$/i, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^[ \t]*[*-][ \t]+/gm, '• ').replace(/[ \t]+\n/g, '\n');
}
