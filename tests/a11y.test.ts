import { describe, expect, it, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';
import { htmlFiles, needBuild, read, routeOf } from './helpers/dist';

beforeAll(() => needBuild());

// axe-core on the built HTML (no JavaScript executed, so this is also the no-JS experience).
// Colour contrast needs real layout, so it is verified separately from the design tokens (tests/contrast.test.ts).
describe('accessibility (axe-core, WCAG 2.2 A/AA rules)', () => {
  it('has no violations on any page', async () => {
    const failures: string[] = [];
    for (const file of htmlFiles()) {
      const dom = new JSDOM(read(file), { runScripts: 'outside-only', pretendToBeVisual: true });
      dom.window.eval(axe.source);
      const results = await (dom.window as any).axe.run(dom.window.document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
        rules: { 'color-contrast': { enabled: false } },
      });
      for (const v of results.violations) failures.push(`${routeOf(file)}: [${v.impact}] ${v.id}: ${v.help} (${v.nodes.slice(0, 2).map((n: any) => n.target.join(' ')).join(' | ')})`);
    }
    expect(failures, '\n' + failures.join('\n')).toEqual([]);
  });
});
