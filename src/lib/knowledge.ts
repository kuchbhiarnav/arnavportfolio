import { site } from '../data/site';
import { roles, education, languages, interests } from '../data/experience';
import { capabilityGroups } from '../data/capabilities';
import type { Status } from '../data/site';

/**
 * The assistant's ONLY knowledge source. Built from the same content and data modules the pages render,
 * so the site and the assistant cannot drift apart.
 *
 * Rules enforced here (and tested):
 *  - entries marked `needs-review` and `draft` content never enter the knowledge base;
 *  - held CV bullets are excluded;
 *  - percentage claims are excluded (owner-reported, no documented measurement basis);
 *  - no phone number, reference details or private notes exist in any source module.
 */

export type Kind = 'profile' | 'experience' | 'education' | 'case-study' | 'research' | 'project' | 'skill' | 'contact' | 'faq';

export interface KnowledgeEntry {
  id: string;
  kind: Kind;
  title: string;
  text: string;
  /** Public URL or section anchor the assistant cites. Always site-relative. */
  url: string;
  /** Where the fact comes from, shown to the owner during review. */
  source: string;
  date?: string;
  status: Exclude<Status, 'needs-review'>;
  keywords: string[];
}

export interface NavTarget {
  path: string;
  label: string;
  keywords: string[];
}

export interface KnowledgeBase {
  entries: KnowledgeEntry[];
  nav: NavTarget[];
}

/* ---- minimal structural types so this module is testable without Astro's runtime ---- */
interface Item<T> { id: string; body?: string; data: T }
interface CaseData {
  title: string; shortTitle: string; summary: string; status: Status; draft: boolean; org: string; period: string; role: string;
  problem: string; intendedDecision: string; constraints: string[]; data: string[]; contribution: string[]; approach: string[];
  outcomes: string[]; outcomeContext?: string; limitations: string[]; tools: string[]; updated: string;
}
interface ResearchData {
  title: string; type: string; event: string; dateLabel: string; isoDate?: string; authors: string[]; arnavPosition: string;
  presentingAuthor?: string; format?: string; status: Status; draft: boolean; note?: string; related: string[];
}
interface WorkData {
  title: string; context: string; summary: string; skills: string[]; tools: string[]; github: string; dashboard?: string;
  award?: string; status: Status; draft: boolean;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${y}`;
}
/** Compact CV style used in tables, e.g. 08/2020 – 06/2024. */
export function rangeNumeric(start: string, end: string | null): string {
  const f = (ym: string) => { const [y, m] = ym.split('-'); return `${m}/${y}`; };
  return `${f(start)} – ${end ? f(end) : 'present'}`;
}
export function formatRange(start: string, end: string | null): string {
  return `${formatMonth(start)} to ${end ? formatMonth(end) : 'present'}`;
}

const hasPercent = (s: string) => /\d\s?%/.test(s);
const join = (xs: string[]) => xs.map((x) => x.replace(/\s+/g, ' ').trim()).join(' ');
const approved = (s: Status): s is Exclude<Status, 'needs-review'> => s !== 'needs-review';

const STATIC_NAV: NavTarget[] = [
  { path: '/', label: 'Home', keywords: ['home', 'start', 'main', 'landing'] },
  { path: '/projects', label: 'Projects, work highlights and data & analytics', keywords: ['work', 'highlights', 'projects', 'project', 'case', 'studies', 'portfolio', 'experience'] },
  { path: '/research', label: 'Research and insights', keywords: ['research', 'publications', 'papers', 'paper', 'abstracts', 'insights', 'writing', 'journal', 'gsa'] },
  { path: '/about', label: 'About', keywords: ['about', 'bio', 'biography', 'story', 'background', 'education', 'interests'] },
  { path: site.cv.href, label: 'CV (PDF, opens in a new tab)', keywords: ['cv', 'resume', 'résumé', 'download', 'curriculum', 'vitae', 'pdf'] },
  { path: '/contact', label: 'Contact', keywords: ['contact', 'email', 'reach', 'hire', 'message', 'touch', 'linkedin', 'github'] },
  { path: '/privacy', label: 'Privacy policy', keywords: ['privacy', 'data', 'cookies', 'analytics'] },
  { path: '/terms', label: 'Terms of use', keywords: ['terms', 'conditions', 'legal'] },
];

export interface BuildInput {
  caseStudies: Item<CaseData>[];
  research: Item<ResearchData>[];
  work: Item<WorkData>[];
}

export function buildKnowledge(input: BuildInput): KnowledgeBase {
  const entries: KnowledgeEntry[] = [];
  const nav: NavTarget[] = [...STATIC_NAV];
  const add = (e: KnowledgeEntry) => entries.push(e);

  /* ---------- profile ---------- */
  add({
    id: 'profile.intro',
    kind: 'faq',
    title: 'Thirty-second introduction to Arnav',
    text:
      "Arnav Patnaik is a climate and data professional with about two years of experience in climate-risk analytics, statistical modelling and environmental data engineering. At Exceldots AB he prepared 6.37 million arsenic screening records and built a classification model and Power BI dashboards for groundwater-safety research in Bangladesh; that work was presented at GSA Connects 2024 and 2025, where he is second author. At Plutas.ai he has led market, regulatory and ecosystem research and product wireframing for a parametric insurance platform in India. He is now studying for a Master's in Management at Vrije Universiteit Brussel.",
    url: '/',
    source: 'CV (October 2026); GSA programme pages checked 2026-11-07',
    status: 'verified',
    keywords: ['introduction', 'intro', 'who', 'summary', 'overview', 'about', 'thirty', '30', 'second', 'bio', 'current', 'professional', 'role', 'position', 'currently', 'doing'],
  });
  add({
    id: 'profile.focus',
    kind: 'profile',
    title: 'Professional focus and how the work connects',
    text:
      'Arnav describes his work as turning complex environmental and business data into decisions, products and stories people can use. It rests on three connected capabilities: understanding complex systems through data and research; making information usable through dashboards, decision-support tools, wireframes and interfaces; and helping ideas move forward through market research, founder\'s-office execution, stakeholder communication and investor materials. His path runs from a computer science and AI/ML foundation, through applied analytics and environmental research, to climate-tech and insurance product work, with management studies broadening the business perspective.',
    url: '/about',
    source: 'CV (October 2026); site positioning',
    status: 'owner-supplied',
    keywords: ['focus', 'positioning', 'connect', 'capabilities', 'data', 'product', 'strategy', 'story', 'career', 'arc'],
  });
  add({
    id: 'profile.contact',
    kind: 'contact',
    title: 'How to contact Arnav',
    text: `Email: ${site.email}. LinkedIn: ${site.links.linkedin}. GitHub: ${site.links.github}. ResearchGate: ${site.links.researchgate}. The Contact page has a form that opens the visitor's own email application with the message filled in; nothing is sent by the website itself. The site does not state availability, salary expectations or work authorisation.`,
    url: '/contact',
    source: 'Site contact details',
    status: 'owner-supplied',
    keywords: ['contact', 'email', 'reach', 'hire', 'hiring', 'message', 'linkedin', 'github', 'researchgate', 'book', 'meeting', 'availability'],
  });
  add({
    id: 'profile.location',
    kind: 'profile',
    title: 'Where Arnav is based',
    text: `Arnav is based in ${site.location} according to his current CV, where he studies at Vrije Universiteit Brussel.`,
    url: '/contact',
    source: 'CV (October 2026)',
    status: 'owner-supplied',
    keywords: ['location', 'based', 'where', 'brussels', 'belgium', 'live', 'city'],
  });
  add({
    id: 'profile.cv',
    kind: 'faq',
    title: 'Download the CV',
    text: `Arnav's CV is a PDF, last updated ${site.cv.updated}. It opens in a new tab and no email address is needed. There is no separate résumé page: the PDF is the résumé.`,
    url: site.cv.href,
    source: 'CV PDF',
    status: 'verified',
    keywords: ['cv', 'resume', 'résumé', 'download', 'pdf', 'curriculum', 'vitae'],
  });
  add({
    id: 'profile.personal',
    kind: 'profile',
    title: 'Interests and languages',
    text: `Outside work Arnav is interested in ${interests.join(', ').toLowerCase()}. ${languages.map((l) => `${l.name}: ${l.level}`).join('. ')}.`,
    url: '/about#beyond-work',
    source: 'Site About page; CV languages',
    status: 'owner-supplied',
    keywords: ['interests', 'hobbies', 'travel', 'photography', 'cooking', 'languages', 'language', 'speak', 'spoken', 'fluent', 'fluency', 'proficiency', 'french', 'english', 'personal'],
  });

  /* ---------- experience ---------- */
  for (const r of roles) {
    if (!approved(r.status)) continue;
    const safe = r.bullets.filter((b) => !b.hold && !hasPercent(b.text)).map((b) => b.text);
    add({
      id: `exp.${r.id}`,
      kind: 'experience',
      title: `${r.title}, ${r.org}`,
      text: `${r.org}: ${r.title}, ${formatRange(r.start, r.end)} (${r.place}). ${r.summary} ${safe.join(' ')} The CV also reports some percentage improvements; they are owner-reported and their measurement basis is not documented here.`.replace(/\s+/g, ' '),
      url: r.caseStudy ? `/projects/${r.caseStudy}` : '/about#experience',
      source: r.source,
      date: r.start,
      status: r.status,
      keywords: [r.org.toLowerCase(), r.title.toLowerCase(), 'role', 'job', 'experience', 'employer', 'work history'],
    });
  }
  for (const e of education) {
    if (!approved(e.status)) continue;
    add({
      id: `edu.${e.id}`,
      kind: 'education',
      title: `${e.degree.split(',')[0]}, ${e.school}`,
      text: `${e.school}: ${e.degree}, ${formatRange(e.start, e.end)} (${e.place}). ${e.detail ?? ''}`.replace(/\s+/g, ' ').trim(),
      url: `/about#education`,
      source: e.source,
      date: e.start,
      status: e.status,
      keywords: ['education', 'degree', 'university', 'study', 'studies', 'studying', 'student', 'master', 'bachelor', 'cgpa', 'grade'],
    });
  }

  /* ---------- case studies ---------- */
  for (const cs of input.caseStudies) {
    const d = cs.data;
    if (d.draft || !approved(d.status)) continue;
    const base = `/projects/${cs.id}`;
    nav.push({ path: base, label: d.shortTitle, keywords: [...d.shortTitle.toLowerCase().split(/\W+/), ...d.title.toLowerCase().split(/\W+/)].filter((w) => w.length > 3) });
    const st = d.status as Exclude<Status, 'needs-review'>;
    add({
      id: `case.${cs.id}.overview`, kind: 'case-study', title: d.title, url: base, source: `Case study page; updated ${d.updated}`, status: st, date: d.updated,
      text: `${d.summary} Organisation: ${d.org}. Period: ${d.period}. Official role: ${d.role}. Problem: ${d.problem} Intended decision: ${d.intendedDecision}`,
      keywords: [d.shortTitle.toLowerCase(), 'case study', 'project', ...d.tools.map((t) => t.toLowerCase())],
    });
    add({
      id: `case.${cs.id}.contribution`, kind: 'case-study', title: `${d.shortTitle}: Arnav's contribution`, url: `${base}#contribution`, source: 'CV (October 2026) via case study page', status: st,
      text: join(d.contribution.filter((c) => !hasPercent(c))),
      keywords: [d.shortTitle.toLowerCase(), 'contribution', 'responsibilities', 'role', 'did', 'built', 'designed'],
    });
    if (d.data.length || d.approach.length || d.tools.length) {
      add({
        id: `case.${cs.id}.approach`, kind: 'case-study', title: `${d.shortTitle}: data and approach`, url: `${base}#approach`, source: 'Published abstracts via case study page', status: st,
        text: `${join(d.data)} ${join(d.constraints)} ${join(d.approach)} Tools: ${d.tools.join(', ')}.`.trim(),
        keywords: [d.shortTitle.toLowerCase(), 'data', 'method', 'approach', 'pipeline', 'tools', 'python', 'sql', 'mysql', 'power bi'],
      });
    }
    if (d.outcomes.length || d.limitations.length) {
      add({
        id: `case.${cs.id}.outcomes`, kind: 'case-study', title: `${d.shortTitle}: outcomes and limits`, url: `${base}#outcomes`, source: 'Published abstracts via case study page', status: st,
        text: `${join(d.outcomes)} ${d.outcomeContext ?? ''} Limitations: ${join(d.limitations)}`.trim(),
        keywords: [d.shortTitle.toLowerCase(), 'outcome', 'result', 'findings', 'limitations', 'impact'],
      });
    }
  }

  /* ---------- research ---------- */
  for (const r of input.research) {
    const d = r.data;
    if (d.draft || !approved(d.status)) continue;
    const base = `/research/${r.id}`;
    nav.push({ path: base, label: d.title, keywords: d.title.toLowerCase().split(/\W+/).filter((w) => w.length > 3) });
    const st = d.status as Exclude<Status, 'needs-review'>;
    add({
      id: `research.${r.id}`, kind: 'research', title: d.title, url: base, source: d.status === 'verified' ? 'Conference programme page, checked 2026-11-07' : 'Owner-supplied; details being confirmed', status: st, date: d.isoDate,
      text: `${d.type}: "${d.title}". ${d.event}. ${d.dateLabel}.${d.authors.length ? ` Authors, in order: ${d.authors.join(', ')}.` : ''} Arnav is listed as: ${d.arnavPosition}.${d.presentingAuthor ? ` Presenting author: ${d.presentingAuthor}.` : ''}${d.format ? ` Format: ${d.format}.` : ''}${d.note ? ` Note: ${d.note}` : ''}`,
      keywords: ['research', 'publication', 'paper', 'abstract', 'gsa', 'conference', 'author', 'authorship', ...d.title.toLowerCase().split(/\W+/).filter((w) => w.length > 4)],
    });
    if (r.body) {
      add({
        id: `research.${r.id}.abstract`, kind: 'research', title: `Abstract: ${d.title}`, url: `${base}#abstract`, source: 'Abstract text supplied by Arnav', status: st,
        text: r.body.replace(/\s+/g, ' ').trim(),
        keywords: ['abstract', 'research', 'groundwater', 'arsenic', 'explain', 'findings', 'method'],
      });
    }
  }

  /* ---------- supporting projects ---------- */
  for (const w of input.work) {
    const d = w.data;
    if (d.draft || !approved(d.status)) continue;
    const st = d.status as Exclude<Status, 'needs-review'>;
    add({
      id: `project.${w.id}`, kind: 'project', title: d.title, url: `/projects/project/${w.id}`, source: 'Project README and site page', status: st,
      text: `${d.title}. ${d.context} ${d.summary} Skills shown: ${d.skills.join(', ')}. Tools: ${d.tools.join(', ')}.${d.award ? ` Recognition: ${d.award}.` : ''} Code: ${d.github}.${d.dashboard ? ' A live dashboard link is provided on the project card.' : ''}`,
      keywords: ['project', 'supporting', ...d.tools.map((t) => t.toLowerCase()), ...d.skills.map((s) => s.toLowerCase())],
    });
  }
  nav.push(...input.work.filter((w) => !w.data.draft && approved(w.data.status)).map((w) => ({ path: `/projects/project/${w.id}`, label: w.data.title, keywords: w.data.title.toLowerCase().split(/\W+/).filter((x) => x.length > 3) })));

  /* ---------- capabilities, each pointing at evidence ---------- */
  for (const g of capabilityGroups) {
    for (const c of g.items) {
      add({
        id: `skill.${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
        kind: 'skill',
        title: c.name,
        text: `${c.name} (${g.title.toLowerCase()}). Where it was used: ${c.evidence.map((e) => e.label).join('; ')}.`,
        url: c.evidence[0]!.href,
        source: 'Capabilities section; each item links to the work that demonstrates it',
        status: 'owner-supplied',
        keywords: [c.name.toLowerCase(), 'skill', 'skills', 'tool', 'technology', 'experience with'],
      });
    }
  }

  /* ---------- curated answers used by the zero-API-cost mode ---------- */
  add({
    id: 'faq.python-sql',
    kind: 'faq',
    title: 'Which projects demonstrate Python and SQL?',
    text:
      'Python: the groundwater arsenic work used it for ETL and preprocessing, and the GSA Connects 2024 abstract describes a Python script that automated data collection from a third-party API. SQL: the ad-hoc analysis project is a SQL analysis of about 970,000 records, and the GSA Connects 2025 abstract describes MySQL for structured storage in the arsenic decision-support system.',
    url: '/projects/groundwater-arsenic-decision-support#contribution',
    source: 'Case study; research abstracts; project README',
    status: 'owner-supplied',
    keywords: ['python', 'sql', 'mysql', 'projects', 'demonstrate', 'code', 'programming', 'languages'],
  });
  add({
    id: 'faq.climate-tech',
    kind: 'faq',
    title: "Arnav's climate-technology work",
    text:
      'Two published pieces of work sit in climate technology. First, groundwater arsenic decision support for Bangladesh, built at Exceldots AB and reported at GSA Connects 2024 and 2025. Second, market, regulatory and ecosystem research plus product wireframing for a B2B2C parametric insurance platform in India at Plutas.ai. The site does not yet describe other climate-data work in detail.',
    url: '/projects',
    source: 'Case studies and CV',
    status: 'owner-supplied',
    keywords: ['climate', 'technology', 'climate-tech', 'climatetech', 'environment', 'insurtech', 'parametric', 'groundwater'],
  });
  add({
    id: 'faq.role-fit',
    kind: 'faq',
    title: 'How to judge fit for a role',
    text:
      "To assess fit, compare the role's requirements with the documented evidence: data preparation, classification and dashboards (groundwater case study); product wireframing and market research (Plutas case study); published research (second author on two GSA Connects abstracts); and the Power BI, Excel, Python and SQL work on the Work page. The site does not document roles beyond those listed.",
    url: '/projects',
    source: 'Case studies and CV',
    status: 'owner-supplied',
    keywords: ['fit', 'role', 'requirements', 'suitable', 'relate', 'relevant', 'job description', 'hire'],
  });

  return { entries, nav };
}
