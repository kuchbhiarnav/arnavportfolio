/** Compact CV style used in the About tables, e.g. 08/2020 – 06/2024. */
export function rangeNumeric(start: string, end: string | null): string {
  const f = (ym: string) => { const [y, m] = ym.split('-'); return `${m}/${y}`; };
  return `${f(start)} – ${end ? f(end) : 'present'}`;
}
