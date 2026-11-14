/** Scoring rules shared by the live evaluation (scripts/eval-assistant.mjs) and the offline test (tests/assistant-eval.test.ts). */
const CITE = /\[([a-z0-9][a-z0-9._-]*(?:\s*,\s*[a-z0-9][a-z0-9._-]*)*)\]/gi;

export const stripCitations = (s) => s.replace(CITE, '').replace(/\s{2,}/g, ' ').trim();
export const citedIds = (s) => [...s.matchAll(CITE)].flatMap((m) => m[1].split(',').map((x) => x.trim()));
const has = (hay, needle) => hay.toLowerCase().includes(String(needle).toLowerCase());
const rx = (src) => { const i = /^\(\?i\)/.test(src); return new RegExp(i ? src.slice(4) : src, i ? 'i' : ''); };

/**
 * @param {string} answer
 * @param {any} q
 * @param {Set<string>} [validIds]
 * @param {{skip?: string[]}} [opts]
 * @returns {{pass:boolean, failed:string[]}}
 */
export function judge(answer, q, validIds = new Set(), { skip = /** @type {string[]} */ ([]) } = {}) {
  const failed = [];
  const text = stripCitations(answer || '');
  const need = (name, ok) => { if (!skip.includes(name) && !ok) failed.push(name); };
  need('non-empty', text.length > 0);
  for (const s of q.all ?? []) need(`missing "${s}"`, has(text, s));
  if (q.any) need(`none of ${JSON.stringify(q.any)}`, q.any.some((s) => has(text, s)));
  if (q.any2) need(`none of ${JSON.stringify(q.any2)}`, q.any2.some((s) => has(text, s)));
  if (q.ack) need('does not say what the site lacks', q.ack.some((s) => has(text, s)));
  if (q.rel) need('no related material offered', q.rel.some((s) => has(text, s)));
  for (const s of q.not_ ?? []) need(`contains forbidden "${s}"`, !has(text, s));
  // A forbidden claim only counts in a sentence that asserts it: "the site does not state that he has worked at Google" is not a claim.
  const NEG = /\b(not|no|never|n't|cannot|without|neither|nor)\b/i;
  const asserting = text.split(/(?<=[.!?])\s+|\n+/).filter((sent) => !NEG.test(sent));
  for (const r of q.notRegex ?? []) need(`matches forbidden ${r}`, !asserting.some((sent) => rx(r).test(sent)));
  const ids = citedIds(answer || '');
  if (validIds.size) need(`cites unknown entries ${ids.filter((i) => !validIds.has(i)).join(',')}`, ids.every((i) => validIds.has(i)));
  if (q.cite) need('no valid citation', ids.some((i) => !validIds.size || validIds.has(i)));
  return { pass: failed.length === 0, failed };
}

export function summarise(rows) {
  const by = {};
  for (const r of rows) { const b = (by[r.cat] ??= { n: 0, pass: 0 }); b.n++; if (r.pass) b.pass++; }
  const n = rows.length, pass = rows.filter((r) => r.pass).length;
  return { n, pass, rate: n ? pass / n : 0, by };
}
