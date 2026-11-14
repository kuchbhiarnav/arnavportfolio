import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/site.css', 'utf8');
const token = (name: string) => {
  if (name === 'paper') return '#ffffff';
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})\\b`).exec(css);
  if (!m) throw new Error(`token --${name} not found`);
  const h = m[1]!;
  return h.length === 4 ? '#' + [...h.slice(1)].map((c) => c + c).join('') : h; // expand #000 to #000000
};
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
};
export const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };

// Every text/background pairing the design uses. WCAG 2.2 AA needs 4.5:1 for normal text, 3:1 for large text and UI components.
const pairs: [string, string, string, number][] = [
  ['body text', 'ink', 'paper', 4.5],
  ['brown text on white (tables, stats)', 'brown', 'paper', 4.5],
  ['brown text on light blue (bio panel, notes)', 'brown', 'blue-ll', 4.5],
  ['brown text on lighter blue (flip card)', 'brown', 'blue-l', 4.5],
  ['grey meta text on white', 'gray', 'paper', 4.5],
  ['muted text on light blue (hovered tile)', 'muted', 'blue-ll', 4.5],
  ['links and headings', 'blue', 'paper', 4.5],
  ['link hover', 'blue-deep', 'paper', 4.5],
  ['blue links on light blue', 'blue', 'blue-ll', 4.5],
  ['nav button text (light blue on blue)', 'blue-l', 'blue', 4.5],
  ['blue-nav buttons (blue on white)', 'blue', 'paper', 4.5],
  ['white on blue (buttons, footer, journey)', 'paper', 'blue', 4.5],
  ['white on deep blue (button hover)', 'paper', 'blue-deep', 4.5],
  ['table header (cream on blue)', 'cream', 'blue', 4.5],
  ['chips (deep blue on light blue)', 'blue-deep', 'blue-ll', 4.5],
  ['ghost button hover (deep blue on light blue)', 'blue-deep', 'blue-l', 4.5],
  ['CTA hover (light blue on green)', 'blue-l', 'green', 4.5],
  ['focus ring on white (UI component)', 'focus', 'paper', 3],
  ['input border on the flip card (UI component)', 'blue', 'blue-l', 3],
  ['border on white (UI component)', 'blue', 'paper', 3],
];
describe('colour contrast (WCAG 2.2 AA, computed from the real tokens)', () => {
  for (const [what, fg, bg, min] of pairs) {
    it(`${what}: --${fg} on --${bg} >= ${min}:1`, () => {
      const r = ratio(token(fg), token(bg));
      expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(min);
    });
  }
});
