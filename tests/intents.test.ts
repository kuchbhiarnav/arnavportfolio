import { describe, expect, it } from 'vitest';
import { isAllowedPath, parseIntent } from '../src/lib/intents';
import type { NavTarget } from '../src/lib/knowledge';

const nav: NavTarget[] = [
  { path: '/', label: 'Home', keywords: ['home'] },
  { path: '/projects', label: 'Work and case studies', keywords: ['work', 'projects', 'case', 'studies'] },
  { path: '/research', label: 'Research and insights', keywords: ['research', 'publications', 'papers', 'gsa'] },
  { path: '/about', label: 'About', keywords: ['about', 'bio'] },
  { path: '/cv/Arnav-Patnaik-CV.pdf', label: 'CV (PDF)', keywords: ['cv', 'resume', 'résumé', 'download'] },
  { path: '/contact', label: 'Contact', keywords: ['contact', 'email', 'reach'] },
  { path: '/projects/groundwater-arsenic-decision-support', label: 'Groundwater arsenic decision support', keywords: ['groundwater', 'arsenic', 'decision', 'support'] },
  { path: '/projects/parametric-insurance-plutas-insure', label: 'Parametric insurance platform (Plutas Insure)', keywords: ['parametric', 'insurance', 'platform', 'plutas', 'insure'] },
  { path: '/research/gsa-connects-2025-arsenic-mitigation', label: 'An Integrated Data-Driven Strategy for Arsenic Mitigation', keywords: ['integrated', 'strategy', 'arsenic', 'mitigation'] },
];

const go = (t: string, last?: string) => parseIntent(t, nav, last);

describe('explicit navigation commands', () => {
  it.each([
    ['show research', '/research'],
    ['Show me the research.', '/research'],
    ['go to contact', '/contact'],
    ['Take me to his CV.', '/cv/Arnav-Patnaik-CV.pdf'],
    ['open the résumé', '/cv/Arnav-Patnaik-CV.pdf'],
    ['resume', '/cv/Arnav-Patnaik-CV.pdf'],
    ['Can I see his CV please?', '/cv/Arnav-Patnaik-CV.pdf'],
    ['where is his résumé', '/cv/Arnav-Patnaik-CV.pdf'],
    ['Download CV', '/cv/Arnav-Patnaik-CV.pdf'],
    ['Does his resume mention Python?', null],
    ['What experience is on his CV?', null],
    ['navigate to the about page', '/about'],
    ['go home', null],
    ['open the groundwater case study', '/projects/groundwater-arsenic-decision-support'],
    ['show the parametric insurance project', '/projects/parametric-insurance-plutas-insure'],
  ])('%s', (text, path) => {
    const i = go(text);
    if (path === null) { expect(i.type === 'navigate' || i.type === 'clarify' || i.type === 'ask').toBe(true); return; }
    expect(i.type).toBe('navigate');
    if (i.type === 'navigate') expect(i.target.path).toBe(path);
  });

  it('resolves "this case study" only when a page was just cited', () => {
    expect(go('open this case study').type).toBe('clarify');
    const i = go('open this case study', '/projects/groundwater-arsenic-decision-support#outcomes');
    expect(i.type).toBe('navigate');
    if (i.type === 'navigate') expect(i.target.path).toBe('/projects/groundwater-arsenic-decision-support');
  });
});

describe('questions are never auto-navigated', () => {
  it.each(['How can I contact him?', 'What research has he done?', 'Give me a 30-second introduction to Arnav.', 'Explain the groundwater research.'])('%s', (t) => {
    expect(go(t).type).toBe('ask');
  });
});

describe('allowlist safety', () => {
  const hostile = [
    'open https://evil.example/phish', 'go to //evil.example', 'show javascript:alert(1)', 'open /admin', 'go to ../../etc/passwd',
    'navigate to data:text/html,<script>alert(1)</script>', 'open file:///etc/passwd', 'take me to http://localhost:4321/api/ask',
  ];
  it.each(hostile)('%s never navigates outside the allowlist', (t) => {
    const i = go(t);
    if (i.type === 'navigate') expect(isAllowedPath(i.target.path, nav)).toBe(true);
    // and in particular it must never produce a path that was not in the list
    if (i.type === 'navigate') expect(nav.map((n) => n.path)).toContain(i.target.path);
    expect(JSON.stringify(i)).not.toMatch(/evil\.example|javascript:|file:|data:/);
  });
  it('isAllowedPath rejects anything not listed', () => {
    expect(isAllowedPath('/projects', nav)).toBe(true);
    expect(isAllowedPath('/admin', nav)).toBe(false);
    expect(isAllowedPath('https://evil.example', nav)).toBe(false);
    expect(isAllowedPath('//evil.example', nav)).toBe(false);
  });
});

describe('CV requests open the PDF, questions about its content do not', () => {
  it.each(['cv', 'resume', 'his resume please', 'Can I see his CV?', 'where is his résumé', 'send me the curriculum vitae'])('opens for: %s', async (t) => {
    const { isCvRequest } = await import('../src/lib/intents');
    expect(isCvRequest(t)).toBe(true);
  });
  it.each(['Does his resume mention Python?', 'What experience is on his CV?', 'Why is there a gap in his resume between 2022 and 2024?', 'Tell me about his work'])('does not open for: %s', async (t) => {
    const { isCvRequest } = await import('../src/lib/intents');
    expect(isCvRequest(t)).toBe(false);
  });
});

