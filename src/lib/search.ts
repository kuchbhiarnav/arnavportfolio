import MiniSearch from 'minisearch';
import type { KnowledgeEntry } from './knowledge';

/**
 * Lightweight retrieval shared by the browser (zero-API-cost mode) and the server (AI grounding).
 * With ~50 short entries, BM25-style search is enough; embeddings or a vector database are not justified
 * until measured relevance (tests/search.test.ts) says otherwise.
 */

const STOP = new Set(
  ('a an the and or but if then of to in on at for from by with about as is are was were be been being do does did can could ' +
    'would should will shall may might must have has had having i me my we our you your he him his she her it its they them their ' +
    'this that these those what which who whom whose when where why how give show tell explain describe list please also any some ' +
    'much many more most other such only own same so than too very just into over under again further once here there all both each ' +
    'few not no nor off up down out arnav arnavs')
    .split(/\s+/),
);

const process = (term: string): string | null => {
  const t = term.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  if (t.length < 2 || STOP.has(t)) return null;
  return t;
};

export function createIndex(entries: KnowledgeEntry[]): MiniSearch {
  const ms = new MiniSearch({
    fields: ['title', 'keywords', 'text'],
    storeFields: [],
    processTerm: process,
    searchOptions: { boost: { title: 3, keywords: 2 }, prefix: true, fuzzy: 0.18, combineWith: 'OR', processTerm: process },
  });
  ms.addAll(entries.map((e) => ({ id: e.id, title: e.title, keywords: e.keywords.join(' '), text: e.text })));
  return ms;
}

export interface Hit {
  entry: KnowledgeEntry;
  score: number;
  /** Share of the question's meaningful terms that matched (0..1). A lone coincidental word gives a low value. */
  coverage: number;
}

/** The question's meaningful terms, after the same normalisation the index uses. */
export function queryTerms(query: string): string[] {
  return [...new Set(query.split(/[^\p{L}\p{N}]+/u).map(process).filter((t): t is string => !!t))];
}

export function retrieve(index: MiniSearch, entries: KnowledgeEntry[], query: string, k = 4): Hit[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const q = query.slice(0, 500);
  const total = queryTerms(q).length || 1;
  const hits: Hit[] = [];
  // Broad openers such as "What does Arnav do?" are made only of filler words, so there is nothing to match on. Answer them
  // with the curated introduction and overview entries instead of reporting that nothing was found.
  if (queryTerms(q).length === 0) {
    for (const id of ['profile.intro', 'profile.focus', 'faq.climate-tech']) {
      const entry = byId.get(id);
      if (entry && hits.length < k) hits.push({ entry, score: 10 - hits.length, coverage: 1 });
    }
    if (hits.length) return hits;
  }
  for (const r of index.search(q)) {
    const entry = byId.get(String(r.id));
    if (entry) hits.push({ entry, score: r.score, coverage: Math.min(1, new Set(r.queryTerms).size / total) });
    if (hits.length >= k) break;
  }
  return hits;
}
