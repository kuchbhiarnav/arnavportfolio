import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Verification vocabulary shared by every collection and by the assistant knowledge base.
 *  - verified        checked against a primary source (see `sources`)
 *  - owner-supplied  stated by Arnav in the CV or in text he supplied; consistent, not independently checkable
 *  - needs-review    conflicting or unconfirmed; NEVER shown publicly and NEVER given to the assistant
 */
export const status = z.enum(['verified', 'owner-supplied', 'needs-review']);

// Absolute http(s) URLs, site-relative paths, or mailto: links only: nothing else can reach a page or the assistant.
const href = z.string().regex(/^(https?:\/\/|\/|mailto:)/, 'must be an https URL, a /path, or mailto:');
const link = z.object({ label: z.string(), url: href });

/** A flagship case study. Every optional section is simply not rendered when empty (no placeholders). */
const caseStudies = defineCollection({
  loader: glob({ base: './src/content/case-studies', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    summary: z.string(), // one sentence, used on cards and in knowledge
    cardLine: z.string().optional(), // card text when it differs from the summary
    order: z.number(),
    draft: z.boolean().default(false), // draft = hidden in production builds
    blockedBy: z.string().optional(), // why a draft cannot be published yet
    status,
    org: z.string(),
    period: z.string(),
    role: z.string(), // the official title, unmodified
    collaborators: z.array(z.string()).default([]),
    highlights: z.array(z.string()).default([]), // evidence chips on cards
    problem: z.string(),
    intendedDecision: z.string(),
    constraints: z.array(z.string()).default([]),
    data: z.array(z.string()).default([]),
    contribution: z.array(z.string()),
    approach: z.array(z.string()).default([]),
    tradeoffs: z.array(z.string()).default([]),
    outputs: z.array(link).default([]),
    outcomes: z.array(z.string()).default([]),
    outcomeContext: z.string().optional(), // what was and was not measured
    limitations: z.array(z.string()).default([]),
    learning: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    sources: z.array(link).default([]),
    ecosystem: z.string().optional(), // e.g. product and company names shown in the byline
    areas: z.array(z.string()).default([]), // areas of contribution, shown in the byline
    contributionGroups: z.array(z.object({ title: z.string(), items: z.array(z.string()), subTitle: z.string().optional(), subItems: z.array(z.string()).default([]) })).default([]),
    outputNotes: z.array(z.string()).default([]), // evidence bullets that are text rather than links
    outputsIntro: z.string().optional(),
    outcomesFollow: z.array(z.string()).default([]), // further outcome paragraphs after the bullets
    showLimitations: z.boolean().default(false), // render the Limitations and learning section
    toolGroups: z.array(z.object({ title: z.string(), items: z.array(z.string()) })).default([]),
    updated: z.string(), // ISO date this page was last reviewed against its sources
  }),
});

/** Research outputs: abstracts, presentations, papers. Kept distinct from articles. */
const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.md' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    cardTitle: z.string(), // title as shown on listing cards
    cardLine: z.string(), // one-line description on listing cards
    readTime: z.string(), // e.g. "5 min"
    quote: z.string(), // pull quote shown beside the byline
    publishedLabel: z.string().optional(), // "Presented" or "Published" value, when different from dateLabel
    cover: image(),
    coverAlt: z.string(),
    type: z.enum(['Conference abstract', 'Co-authored paper', 'Presentation']),
    event: z.string(),
    dateLabel: z.string(), // exactly what the source states, e.g. "22 October 2025"
    isoDate: z.string().optional(),
    authors: z.array(z.string()),
    arnavPosition: z.string(), // e.g. "Second author"
    presentingAuthor: z.string().optional(),
    format: z.string().optional(),
    related: z.array(z.string()).default([]), // case study slugs
    links: z.array(link).default([]),
    status,
    note: z.string().optional(), // public caveat shown beside the entry
    order: z.number(),
    draft: z.boolean().default(false),
  }),
});

/** Supporting projects: foundational work, labelled honestly. */
const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.md' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    order: z.number(),
    context: z.string(), // honest framing, e.g. "Practice project on a fictional company"
    summary: z.string(),
    skills: z.array(z.string()),
    tools: z.array(z.string()),
    cardTitle: z.string().optional(), // title on listing cards
    cardContext: z.string().optional(), // line on listing cards
    cardAward: z.string().optional(), // short badge on listing cards
    projectName: z.string().optional(),
    period: z.string().optional(),
    role: z.string().optional(),
    domain: z.string().optional(),
    toolGroups: z.array(z.object({ title: z.string(), items: z.array(z.string()) })).default([]),
    github: z.url(),
    youtube: z.url().optional(),
    linkedin: z.url().optional(),
    dashboard: z.url().optional(),
    award: z.string().optional(),
    certificate: z.object({ src: image(), alt: z.string(), caption: z.string() }).optional(),
    status,
    draft: z.boolean().default(false),
  }),
});

export const collections = { caseStudies, research, work };
