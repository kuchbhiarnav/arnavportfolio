import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const DIST = join(process.cwd(), 'dist', 'client');
export const built = existsSync(join(DIST, 'index.html'));

export function needBuild() {
  if (!built) throw new Error('dist/client is missing. Run `npm run build` first (or `npm run verify`).');
}

export function htmlFiles(dir = DIST): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== '_astro') out.push(...htmlFiles(p)); }
    else if (f.endsWith('.html')) out.push(p);
  }
  return out;
}
export const routeOf = (file: string) => '/' + relative(DIST, file).replace(/\.html$/, '').replace(/^index$/, '');
export const read = (file: string) => readFileSync(file, 'utf8');
