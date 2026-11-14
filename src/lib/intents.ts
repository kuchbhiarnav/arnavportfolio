import type { NavTarget } from './knowledge';
import { site } from '../data/site';

/**
 * Navigation understanding for the assistant.
 *
 * Safety model: the model never produces navigation. Only this deterministic parser can, and it can only ever return
 * a path that already exists in the allowlisted `nav` list built from the site's own content. Explicit commands
 * ("show research", "go to contact") navigate; everything else is offered as clickable suggestions.
 */

export type Intent =
  | { type: 'navigate'; target: NavTarget }
  | { type: 'clarify'; options: NavTarget[] }
  | { type: 'ask' };

const VERB = /^(?:please\s+)?(?:can you\s+|could you\s+)?(?:show|open|go to|take me to|navigate to|bring me to|jump to|view|display|visit)\s+(?:me\s+)?(.+)$/i;
const DEICTIC = /^(?:this|that|it|the first one|the one)(?:\s+(?:case study|project|paper|page|one|research))?$/i;

const ALIASES: Record<string, string> = {
  research: '/research', publications: '/research', papers: '/research', paper: '/research', insights: '/research', abstracts: '/research', writing: '/research',
  cv: site.cv.href, resume: site.cv.href, 'résumé': site.cv.href, curriculum: site.cv.href, 'curriculum vitae': site.cv.href,
  contact: '/contact', email: '/contact', 'contact page': '/contact', 'get in touch': '/contact',
  work: '/projects', projects: '/projects', 'case studies': '/projects', portfolio: '/projects', 'selected work': '/projects',
  about: '/about', bio: '/about', 'about page': '/about', story: '/about',
  home: '/', 'home page': '/', homepage: '/',
  privacy: '/privacy', 'privacy policy': '/privacy', terms: '/terms',
};

// Filler that describes the kind of page ("the groundwater case study") rather than which one. Ignored when scoring,
// unless it is all the visitor said.
const GENERIC = new Set(['case', 'study', 'studies', 'project', 'projects', 'page', 'section', 'article', 'paper', 'papers', 'one']);

const clean = (s: string) =>
  s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9é\s-]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^(?:the|his|arnavs|arnav|a|an)\s+/, '').replace(/^(?:the|his|arnavs)\s+/, '').replace(/\s+(?:page|section)$/, '');

export function isAllowedPath(path: string, nav: NavTarget[]): boolean {
  return nav.some((n) => n.path === path);
}

function scoreTarget(phrase: string, t: NavTarget): number {
  const all = phrase.split(' ').filter((w) => w.length > 2);
  const specific = all.filter((w) => !GENERIC.has(w));
  const words = specific.length ? specific : all;
  if (!words.length) return 0;
  const hay = new Set([...t.keywords.map((k) => k.toLowerCase()), ...t.label.toLowerCase().split(/\W+/)]);
  let hits = 0;
  for (const w of words) if (hay.has(w) || [...hay].some((h) => h.startsWith(w) && w.length > 3)) hits++;
  return hits / words.length;
}

/** A short request that is about getting the CV itself ("resume", "his CV please", "where is his résumé", "download cv"). Questions about what the CV says go to the assistant instead. */
const CV_WORD = /(?<![\p{L}])(?:cv|resume|résumé|curriculum vitae)(?![\p{L}])/iu;
const CV_CONTENT = /\b(?:mention|mentions|include|includes|say|says|contain|contains|list|lists|about|experience|skills|worked|education|summary|why|how|compare)\b/i;
export function isCvRequest(text: string): boolean {
  const t = text.trim().replace(/[.!?]+$/, '');
  return CV_WORD.test(t) && t.split(/\s+/).length <= 8 && !CV_CONTENT.test(t);
}

export function parseIntent(text: string, nav: NavTarget[], lastSourcePath?: string): Intent {
  if (isCvRequest(text)) {
    const cv = nav.find((n) => n.path === site.cv.href);
    if (cv) return { type: 'navigate', target: cv };
  }
  const trimmed = text.trim().replace(/[.!?]+$/, '');
  const m = VERB.exec(trimmed);
  if (!m) return { type: 'ask' };
  const phrase = clean(m[1] ?? '');

  // "open this case study": only valid if a previous answer cited a page.
  if (DEICTIC.test(phrase)) {
    const target = lastSourcePath ? nav.find((n) => n.path === lastSourcePath.split('#')[0]) : undefined;
    return target ? { type: 'navigate', target } : { type: 'clarify', options: nav.filter((n) => n.path.startsWith('/projects/')).slice(0, 3) };
  }

  const aliasPath = ALIASES[phrase];
  if (aliasPath) {
    const t = nav.find((n) => n.path === aliasPath);
    if (t) return { type: 'navigate', target: t };
  }

  const ranked = nav
    .map((t) => ({ t, s: scoreTarget(phrase, t) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.t.path.length - b.t.path.length);
  if (!ranked.length) return { type: 'clarify', options: nav.slice(1, 5) };
  const top = ranked[0]!;
  const tied = ranked.filter((r) => r.s === top.s);
  if (top.s >= 0.99 && tied.length === 1) return { type: 'navigate', target: top.t };
  return { type: 'clarify', options: ranked.slice(0, 3).map((r) => r.t) };
}
