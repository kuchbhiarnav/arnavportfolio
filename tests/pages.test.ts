import { describe, expect, it, beforeAll } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { DIST, htmlFiles, needBuild, read, routeOf } from './helpers/dist';

type Page = { route: string; file: string; doc: Document; html: string };
let pages: Page[] = [];
beforeAll(() => {
  needBuild();
  pages = htmlFiles().map((file) => ({ route: routeOf(file), file, html: read(file), doc: new JSDOM(read(file)).window.document }));
});

const PUBLIC = ['/', '/projects', '/research', '/about', '/contact', '/privacy', '/terms', '/404'];

describe('site map', () => {
  it('builds every expected page, and no draft case study', () => {
    const routes = pages.map((p) => p.route);
    for (const r of PUBLIC) expect(routes, r).toContain(r);
    expect(routes).toContain('/projects/groundwater-arsenic-decision-support');
    expect(routes).toContain('/projects/parametric-insurance-plutas-insure');
    expect(routes).not.toContain('/projects/climate-data-pipelines');
    expect(routes).toContain('/research/gsa-connects-2025-arsenic-mitigation');
    expect(routes).toContain('/research/gsa-connects-2024-climate-resilient-dss');
  });
});

describe('metadata', () => {
  it('every page has a unique title, a description, one h1, lang=en and a viewport', () => {
    const titles = new Set<string>();
    for (const p of pages) {
      const title = p.doc.title;
      expect(title, p.route).toBeTruthy();
      expect(titles.has(title), `duplicate title "${title}"`).toBe(false);
      titles.add(title);
      const desc = p.doc.querySelector('meta[name=description]')?.getAttribute('content') ?? '';
      expect(desc.length, `${p.route} description`).toBeGreaterThan(40);
      expect(desc.length, `${p.route} description length`).toBeLessThan(300);
      expect(p.doc.querySelectorAll('h1'), `${p.route} h1`).toHaveLength(1);
      expect(p.doc.documentElement.lang).toBe('en');
      expect(p.doc.querySelector('meta[name=viewport]')).toBeTruthy();
    }
  });
  it('indexes everything except the 404 page', () => {
    for (const p of pages) expect(!!p.doc.querySelector('meta[name=robots][content*=noindex]'), p.route).toBe(p.route === '/404');
  });
  it('carries social tags, and never an invented absolute URL when SITE_URL is unset', () => {
    for (const p of pages) {
      expect(p.doc.querySelector('meta[property="og:title"]'), p.route).toBeTruthy();
      expect(p.doc.querySelector('meta[name="twitter:card"]')).toBeTruthy();
      expect(p.doc.querySelector('link[rel=canonical]'), `${p.route} must not guess a domain`).toBeNull();
      expect(p.doc.querySelector('meta[property="og:image"]')).toBeNull();
    }
  });
  it('has valid JSON-LD with no invented publication dates', () => {
    let count = 0;
    for (const p of pages) for (const s of p.doc.querySelectorAll('script[type="application/ld+json"]')) {
      const json = JSON.parse(s.textContent!);
      count++;
      expect(JSON.stringify(json), p.route).not.toMatch(/datePublished/);
      expect(json['@context']).toBe('https://schema.org');
    }
    expect(count).toBeGreaterThanOrEqual(5);
    const cs = pages.find((p) => p.route === '/projects/groundwater-arsenic-decision-support')!;
    expect(JSON.parse(cs.doc.querySelector('script[type="application/ld+json"]')!.textContent!)['@type']).toBe('Article');
  });
});

describe('truthful content', () => {
  const text = (route: string) => pages.find((p) => p.route === route)!.doc.body.textContent!.replace(/\s+/g, ' ');
  it('shows the verified date and author position, and no "Jan 1" placeholder dates', () => {
    const t = text('/research/gsa-connects-2025-arsenic-mitigation');
    expect(t).toContain('22 October 2025');
    expect(t).toContain('Second author');
    for (const p of pages) expect(p.doc.body.textContent, p.route).not.toMatch(/January 1, 202|Jan 1, 202/);
  });
  it('does not publish the degree certificate, referees or a phone number', () => {
    for (const p of pages) {
      const t = p.doc.body.textContent!;
      expect(t, p.route).not.toMatch(/20BCS\d+|Rosalin|referee/i);
      expect(t, p.route).not.toMatch(/\+\s?\d{2}[\s\d-]{8,}/);
      expect(p.html, p.route).not.toMatch(/Degree\.(jpg|pdf)/i);
    }
  });
  it('labels supporting projects as practice work and the Telangana award with its date', () => {
    const t = text('/projects');
    expect(t).toContain('Codebasics Resume Project Challenge');
    expect(t).toContain('Second Prize');
    expect(text('/projects/project/telangana-tourism-dashboard')).toContain('Second prize, Codebasics resume project challenge, 10 July 2023');
  });
  it('states that the case studies do not claim outcomes the sources do not show', () => {
    expect(text('/projects/groundwater-arsenic-decision-support')).toMatch(/Records analysed are not people reached/);
    expect(text('/projects/parametric-insurance-plutas-insure')).not.toMatch(/Ask about this work|Reviewed against these sources/);
  });
  it('does not include empty case-study sections', () => {
    const pi = pages.find((p) => p.route === '/projects/parametric-insurance-plutas-insure')!;
    const ids = [...pi.doc.querySelectorAll('section.cs-section')].map((s) => s.id);
    for (const gone of ['data', 'sources']) expect(ids, gone).not.toContain(gone);
    for (const s of pi.doc.querySelectorAll('section.cs-section')) expect(s.textContent!.trim().length).toBeGreaterThan(40);
  });
  it('reflects reality in the privacy page (consent-gated analytics, AI off, Calendly on demand)', () => {
    const t = text('/privacy');
    expect(t).toMatch(/only if you accept/i);
    expect(t).toMatch(/at the time of this update it is off/i);
    expect(t).toMatch(/Nothing is requested from Calendly until you open the card/i);
    expect(t).toMatch(/may send audio to the browser vendor/i);
  });
});

describe('links, anchors and images', () => {
  const exists = (path: string) => {
    const clean = path.split('#')[0]!.split('?')[0]!;
    if (clean === '' || clean === '/') return true;
    return [clean, `${clean}.html`, join(clean, 'index.html')].some((c) => existsSync(join(DIST, c)));
  };
  it('every internal link resolves to a built page or file', () => {
    for (const p of pages) for (const a of p.doc.querySelectorAll('a[href^="/"]')) {
      const href = a.getAttribute('href')!;
      expect(exists(href), `${p.route} -> ${href}`).toBe(true);
    }
  });
  it('every in-page and cross-page #anchor points at a real id', () => {
    const idsOf = (route: string) => new Set([...pages.find((p) => p.route === route)!.doc.querySelectorAll('[id]')].map((e) => e.id));
    for (const p of pages) for (const a of p.doc.querySelectorAll('a[href*="#"]')) {
      const href = a.getAttribute('href')!;
      if (href.startsWith('http') || href === '#') continue;
      const [path, hash] = href.split('#') as [string, string];
      const route = path === '' ? p.route : path === '/' ? '/' : path;
      if (!pages.some((q) => q.route === route)) continue;
      expect(idsOf(route).has(hash), `${p.route} -> ${href}`).toBe(true);
    }
  });
  it('external links open safely and announce the new tab', () => {
    for (const p of pages) for (const a of p.doc.querySelectorAll('a[target=_blank]')) {
      expect(a.getAttribute('rel') ?? '', `${p.route} ${a.getAttribute('href')}`).toMatch(/noopener/);
      expect(a.textContent, `${p.route} ${a.getAttribute('href')}`).toMatch(/opens in a new tab/i);
    }
  });
  it('every image has alt text and a file that exists', () => {
    for (const p of pages) for (const img of p.doc.querySelectorAll('img')) {
      expect(img.hasAttribute('alt'), `${p.route} ${img.getAttribute('src')}`).toBe(true);
      const src = img.getAttribute('src')!;
      if (src.startsWith('/')) expect(existsSync(join(DIST, src.split('?')[0]!)), src).toBe(true);
    }
  });
  it('every old URL redirects to a page that exists', () => {
    const rules = readFileSync(join(DIST, '_redirects'), 'utf8').trim().split('\n').map((l) => l.trim().split(/\s+/));
    const sources = rules.map((r) => r[0]);
    for (const old of ['/index.html', '/about.html', '/projects.html', '/insights.html', '/insights-detail.html', '/insights-detail-2.html', '/insights-detail-3.html', '/privacy-policy.html', '/terms-of-service.html'])
      expect(sources, old).toContain(old);
    for (const [, dest, code] of rules) { expect(code).toBe('301'); expect(exists(dest!), dest).toBe(true); }
  });
});

describe('weight budgets', () => {
  const gz = (f: string) => gzipSync(readFileSync(f)).length;
  it('keeps HTML light and the home page script load bounded', () => {
    for (const p of pages) expect(statSync(p.file).size, p.route).toBeLessThan(70_000);
    const home = pages.find((p) => p.route === '/')!;
    const srcs = new Set<string>();
    for (const m of home.html.matchAll(/(?:component-url|renderer-url|src)="(\/_astro\/[^"]+\.js)"/g)) srcs.add(m[1]!);
    expect(srcs.size).toBeGreaterThan(0);
    const total = [...srcs].reduce((n, s) => n + gz(join(DIST, s)), 0);
    expect(total, `home JS (gzip) = ${(total / 1024).toFixed(1)} KB`).toBeLessThan(110 * 1024);
  });
  it('serves no oversized image: 120 KB for images in the page, 250 KB for on-demand images inside dialogs', () => {
    for (const p of pages) for (const img of p.doc.querySelectorAll('img[src^="/_astro/"]')) {
      const limit = img.closest('dialog') ? 250_000 : 120_000;
      expect(statSync(join(DIST, img.getAttribute('src')!)).size, `${p.route} ${img.getAttribute('src')}`).toBeLessThan(limit);
    }
  });
  it('does not ship the old heavy assets', () => {
    for (const f of ['introvid.mp4', 'Degree.jpg', 'Degree.pdf', 'resume.pdf', 'article1.jpg', 'project1.png']) expect(existsSync(join(DIST, f)), f).toBe(false);
    expect(statSync(join(DIST, 'og', 'default.jpg')).size).toBeLessThan(300_000);
  });
});
