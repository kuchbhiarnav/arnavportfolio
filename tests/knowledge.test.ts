import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, needBuild } from './helpers/dist';
import { buildKnowledge, type KnowledgeBase } from '../src/lib/knowledge';

let kb: KnowledgeBase;
beforeAll(() => { needBuild(); kb = JSON.parse(readFileSync(join(DIST, 'assistant', 'knowledge.json'), 'utf8')); });

describe('assistant knowledge (built from the real content)', () => {
  it('has well-formed, unique, site-relative entries', () => {
    const ids = new Set<string>();
    for (const e of kb.entries) {
      expect(e.id, 'id').toMatch(/^[a-z0-9.\-]+$/);
      expect(ids.has(e.id), `duplicate id ${e.id}`).toBe(false);
      ids.add(e.id);
      for (const k of ['kind', 'title', 'text', 'url', 'source', 'status'] as const) expect(e[k], `${e.id}.${k}`).toBeTruthy();
      expect(e.url.startsWith('/') && !e.url.startsWith('//'), `${e.id} url ${e.url}`).toBe(true);
      expect(['verified', 'owner-supplied']).toContain(e.status);
      expect(Array.isArray(e.keywords)).toBe(true);
    }
    expect(kb.entries.length).toBeGreaterThan(30);
  });

  it('never contains unreviewed, draft or held material', () => {
    const blob = JSON.stringify(kb).toLowerCase();
    expect(blob).not.toContain('needs-review');
    expect(blob).not.toContain('climate-data-pipelines'); // draft case study
    expect(blob).not.toContain('19,000'); // held CV bullet (employer attribution unresolved)
    // IMD/ERA5 may appear only as the owner's stated supporting role (Plutas case study, 2026-11-10), not as a built pipeline.
    expect(blob).not.toMatch(/(built|developed|engineered) (the )?(imd|era5)/);
  });

  it('keeps owner-reported percentages and private details out', () => {
    const blob = JSON.stringify(kb);
    for (const claim of ['20%', '25%', '40%', '15%']) expect(blob, claim).not.toContain(claim);
    expect(blob).not.toMatch(/\+\s?\d{2}[\s\d-]{8,}/); // phone numbers
    expect(blob).not.toMatch(/\b20BCS\d+/i); // university UID printed on the degree certificate
    expect(blob.toLowerCase()).not.toContain('rosalin'); // parent named on the certificate
    expect(blob.toLowerCase()).not.toContain('referee');
    const emails = blob.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? [];
    expect([...new Set(emails)]).toEqual(['patnaikarnav3@gmail.com']);
  });

  it('states authorship and presentation accurately', () => {
    const r25 = kb.entries.find((e) => e.id === 'research.gsa-connects-2025-arsenic-mitigation')!;
    expect(r25.text).toContain('Second author');
    expect(r25.text).toContain('Presenting author: Prosun Bhattacharya');
    const r24 = kb.entries.find((e) => e.id === 'research.gsa-connects-2024-climate-resilient-dss')!;
    expect(r24.text).toContain('Second author');
    expect(r24.text).not.toContain('Presenting author');
  });

  it('exposes only allowlisted, existing navigation targets', () => {
    for (const n of kb.nav) {
      expect(n.path.startsWith('/') && !n.path.startsWith('//')).toBe(true);
      expect(n.label).toBeTruthy();
    }
    const paths = kb.nav.map((n) => n.path);
    for (const p of ['/', '/projects', '/research', '/about', '/cv/Arnav-Patnaik-CV.pdf', '/contact', '/projects/groundwater-arsenic-decision-support']) expect(paths).toContain(p);
    expect(paths.join()).not.toContain('climate-data-pipelines');
  });
});

describe('buildKnowledge rules (synthetic input)', () => {
  const base = { summary: 's', shortTitle: 't', org: 'o', period: 'p', role: 'r', problem: 'p', intendedDecision: 'd', constraints: [], data: [], contribution: ['I did a thing with 30% gain.', 'I did another thing.'], approach: [], outcomes: [], limitations: [], tools: [], updated: '2026-01-01' };
  it('drops drafts and needs-review items from every collection', () => {
    const out = buildKnowledge({
      caseStudies: [
        { id: 'ok', data: { ...base, title: 'OK', status: 'owner-supplied', draft: false } },
        { id: 'draft', data: { ...base, title: 'Draft', status: 'owner-supplied', draft: true } },
        { id: 'review', data: { ...base, title: 'Review', status: 'needs-review', draft: false } },
      ],
      research: [{ id: 'r', data: { title: 'R', type: 'x', event: 'e', dateLabel: 'd', authors: [], arnavPosition: 'p', status: 'needs-review', draft: false, related: [] } }],
      work: [],
    });
    const ids = out.entries.map((e) => e.id);
    expect(ids.some((i) => i.startsWith('case.ok'))).toBe(true);
    expect(ids.some((i) => i.startsWith('case.draft'))).toBe(false);
    expect(ids.some((i) => i.startsWith('case.review'))).toBe(false);
    expect(ids.some((i) => i.startsWith('research.'))).toBe(false);
    expect(out.nav.map((n) => n.path)).not.toContain('/projects/draft');
  });
  it('strips percentage claims from contribution text', () => {
    const out = buildKnowledge({ caseStudies: [{ id: 'ok', data: { ...base, title: 'OK', status: 'owner-supplied', draft: false } }], research: [], work: [] });
    const c = out.entries.find((e) => e.id === 'case.ok.contribution')!;
    expect(c.text).not.toContain('30%');
    expect(c.text).toContain('another thing');
  });
});
