#!/usr/bin/env node
/**
 * Live evaluation of the portfolio assistant through its real /api/ask route.
 *   npm run dev            (in another terminal, with a working GEMINI_API_KEY in .dev.vars)
 *   node scripts/eval-assistant.mjs [--base http://localhost:4321] [--delay 800] [--out reports/assistant-eval.md]
 * The route's own limits apply (per-minute and per-day caps). For a full run, raise AI_CLIENT_PER_MINUTE and
 * AI_CLIENT_DAILY_LIMIT in .dev.vars temporarily and restore them afterwards. Answers rate-limited or failed by the provider are
 * reported separately from answers that were wrong.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judge, summarise } from './eval-lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:4321');
const delay = Number(arg('delay', 800));
const out = arg('out', join(here, '..', 'reports', 'assistant-eval.md'));
const { questions } = JSON.parse(readFileSync(join(here, 'eval-questions.json'), 'utf8'));
const kb = JSON.parse(readFileSync(join(here, '..', 'dist', 'client', 'assistant', 'knowledge.json'), 'utf8'));
const valid = new Set(kb.entries.map((e) => e.id));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(message, history, session, tries = 0) {
  const t0 = Date.now();
  const res = await fetch(`${base}/api/ask`, { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify({ message, history, sessionId: session }) });
  if (res.status === 429) {
    // The site's own gate (or the provider) asked us to wait. Honour it and retry a few times before giving up on this question.
    if (tries < 3) { const wait = Math.min(Math.max(Number(res.headers.get('retry-after')) || 20, 5), 65); await sleep((wait + 1) * 1000); return ask(message, history, session, tries + 1); }
    return { error: 'rate_limited', ms: Date.now() - t0, text: '' };
  }
  const body = await res.text();
  let text = '', error;
  for (const l of body.split('\n').filter(Boolean)) { try { const j = JSON.parse(l); if (j.t === 'delta') text += j.text; if (j.t === 'error') error = j.code; } catch {} }
  return { text, error, ms: Date.now() - t0 };
}

const rows = [];
for (const q of questions) {
  const session = `eval-${q.id}-${Math.random().toString(36).slice(2, 10)}`;
  let history = [], last;
  for (const turn of q.turns) {
    last = await ask(turn, history, session);
    if (last.error) break;
    history = [...history, { role: 'user', text: turn }, { role: 'model', text: last.text.slice(0, 800) }].slice(-6);
    await sleep(delay);
  }
  const infra = last.error; // provider or limit problem: the answer cannot be judged
  const j = infra ? { pass: false, failed: [`not answered: ${infra}`] } : judge(last.text, q, valid);
  rows.push({ id: q.id, cat: q.cat, q: q.turns.at(-1), pass: j.pass, failed: j.failed, infra: !!infra, ms: last.ms, text: last.text });
  process.stdout.write(`${j.pass ? 'PASS' : infra ? 'N/A ' : 'FAIL'} [${q.cat}] ${q.turns.at(-1).slice(0, 70)}${j.pass ? '' : '  -> ' + j.failed.join('; ')}\n`);
}

const answered = rows.filter((r) => !r.infra);
const all = summarise(rows), ans = summarise(answered);
const lat = answered.map((r) => r.ms).sort((a, b) => a - b);
const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : 'n/a');
let md = `# Assistant evaluation\n\nRun: ${new Date().toISOString()} against ${base}\n\n`;
md += answered.length === 0
  ? `- **Live success rate: not measurable.** The model answered none of the ${rows.length} questions (provider error or rate limit). Fix that first; nothing below says anything about answer quality.\n`
  : `- **Overall success rate: ${pct(all.pass, all.n)}** (${all.pass}/${all.n} questions; ${rows.length - answered.length} not answered count as misses)\n`;
md += `- Success rate among questions the model actually answered: ${pct(ans.pass, ans.n)} (${ans.pass}/${ans.n})\n`;
md += `- Not answered (provider error or rate limit): ${rows.length - answered.length}\n`;
md += `- Median latency ${lat.length ? lat[Math.floor(lat.length / 2)] : 'n/a'} ms, slowest ${lat.at(-1) ?? 'n/a'} ms\n\n| Category | Passed | Total | Rate |\n|---|---|---|---|\n`;
for (const [c, b] of Object.entries(all.by)) md += `| ${c} | ${b.pass} | ${b.n} | ${pct(b.pass, b.n)} |\n`;
md += `\n## Failures\n\n`;
for (const r of rows.filter((x) => !x.pass)) md += `- **[${r.cat}] ${r.q}**: ${r.failed.join('; ')}\n  > ${r.text.replace(/\s+/g, ' ').slice(0, 300)}\n`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, md);
console.log(answered.length === 0 ? `\nNot measurable: the model answered 0 of ${rows.length}. Report: ${out}` : `\nOverall ${pct(all.pass, all.n)} (${all.pass}/${all.n}); of answered ${pct(ans.pass, ans.n)}. Report: ${out}`);
