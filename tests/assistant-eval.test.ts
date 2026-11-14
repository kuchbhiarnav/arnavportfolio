import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, needBuild } from './helpers/dist';
import type { KnowledgeBase } from '../src/lib/knowledge';
import { createIndex, retrieve } from '../src/lib/search';
import { composeLocalAnswer } from '../src/assistant/local-answer';
import { judge, summarise } from '../scripts/eval-lib.mjs';

/**
 * Offline evaluation of the zero-cost fallback (what visitors get whenever the AI is off or unavailable).
 * It scores only the questions that have a factual answer in the portfolio; refusal, safety and gap questions need the model
 * and are measured by scripts/eval-assistant.mjs. The same judge and question set are used for both.
 */
let kb: KnowledgeBase;
let index: ReturnType<typeof createIndex>;
const questions = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'eval-questions.json'), 'utf8')).questions as any[];
beforeAll(() => { needBuild(); kb = JSON.parse(readFileSync(join(DIST, 'assistant', 'knowledge.json'), 'utf8')); index = createIndex(kb.entries); });

describe('fallback answers on the challenge set (no model involved)', () => {
  it('answers the factual, synthesis, short and multilingual questions from the portfolio text', () => {
    const scored = questions.filter((q) => ['fact', 'synth', 'short', 'lang'].includes(q.cat) && q.turns.length === 1);
    const rows = scored.map((q) => {
      const a = composeLocalAnswer(retrieve(index, kb.entries, q.turns[0], 4), kb.nav);
      const text = `${a.text}\n${a.sources.map((s) => s.title).join('\n')}`;
      const j = judge(text, q, new Set(), { skip: ['no valid citation'] });
      return { cat: q.cat, q: q.turns[0], pass: j.pass, failed: j.failed };
    });
    const s = summarise(rows);
    const lines = rows.filter((r: any) => !r.pass).map((r: any) => `  FAIL [${r.cat}] ${r.q} -> ${r.failed.join('; ')}`);
    console.log(`\nFallback (no model): ${s.pass}/${s.n} = ${(s.rate * 100).toFixed(1)}%\n` + Object.entries(s.by).map(([c, b]: any) => `  ${c}: ${b.pass}/${b.n}`).join('\n') + (lines.length ? '\n' + lines.join('\n') : ''));
    expect(s.rate).toBeGreaterThanOrEqual(0.7);
  });
});
