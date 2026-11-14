import type { Hit } from '../lib/search';
import type { NavTarget } from '../lib/knowledge';
import type { Source } from './types';

export interface LocalAnswer { text: string; sources: Source[]; matched: boolean }

/** A relevance floor, calibrated against the suggested questions and off-topic probes in tests/search.test.ts. */
export const MIN_SCORE = 3;
/** At least this share of the question's meaningful words must match, so one coincidental word is never an answer. */
export const MIN_COVERAGE = 0.34;

const safeUrl = (u: string) => u.startsWith('/') && !u.startsWith('//');

function firstSentences(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return (end > max * 0.5 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…').trim();
}

/** Zero-API-cost answer: curated text and passages from the portfolio, never generated. */
export function composeLocalAnswer(hits: Hit[], nav: NavTarget[]): LocalAnswer {
  const good = hits.filter((h) => h.score >= MIN_SCORE && h.coverage >= MIN_COVERAGE);
  if (!good.length) {
    const fallbacks = ['/projects', '/research', '/contact'].map((p) => nav.find((n) => n.path === p)).filter((n): n is NavTarget => !!n);
    return {
      matched: false,
      text: "I couldn't find a reliable answer to that in Arnav's portfolio. I can help you explore his professional experience, projects, research and skills.",
      sources: fallbacks.map((n) => ({ id: `nav:${n.path}`, title: n.label, url: n.path })),
    };
  }
  const top = good[0]!;
  const curated = good.find((h) => (h.entry.kind === 'faq' || h.entry.kind === 'contact') && h.score >= top.score * 0.75) ?? top;
  const others = good.filter((h) => h.entry.id !== curated.entry.id).slice(0, 2);
  const lead = curated.entry.kind === 'faq' || curated.entry.kind === 'contact' ? 760 : 420;
  let text = firstSentences(curated.entry.text, lead);
  // A close second hit (a comparison question, for instance) deserves its own opening line, not just a title.
  const second = others[0];
  if (second && second.score >= top.score * 0.7 && second.entry.kind !== 'faq') text += `\n\n${firstSentences(second.entry.text, 260)}`;
  const titles = (second && second.score >= top.score * 0.7 && second.entry.kind !== 'faq' ? others.slice(1) : others);
  if (titles.length) text += `\n\nRelated: ${titles.map((o) => o.entry.title).join('; ')}.`;
  const sources = [curated, ...others].map((h) => ({ id: h.entry.id, title: h.entry.title, url: h.entry.url })).filter((s) => safeUrl(s.url));
  return { text, sources, matched: true };
}

/** Trim a full answer to something comfortable to hear. */
export function spokenSummary(text: string, max = 300): string {
  return firstSentences(text.replace(/\[[^\]]+\]/g, '').replace(/\n+/g, ' '), max);
}
