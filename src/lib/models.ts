/**
 * Free-tier budgets for the Gemini models this site may use, in the owner's own quota table (checked 2026-11-13).
 * The pool is tried in the order the owner lists it; each model also has OUR cap, below the provider's, so the site stops
 * before Google would. Requests per minute (rpm) and per day (rpd); tokens per minute are not the constraint here
 * (a question is about 3,500 tokens against a 250,000 limit).
 */
export interface ModelBudget { id: string; perMinute: number; perDay: number }

const FREE_TIER: Record<string, { rpm: number; rpd: number }> = {
  'gemini-3.5-flash-lite': { rpm: 15, rpd: 500 },
  'gemini-3.1-flash-lite': { rpm: 15, rpd: 500 },
  'gemini-3.8-flash': { rpm: 5, rpd: 20 },
  'gemini-3.6-flash': { rpm: 5, rpd: 20 },
  'gemini-2.5-flash-lite': { rpm: 10, rpd: 20 },
};
/** Unknown model: assume the smallest free tier we have seen, so a typo can never overspend. */
const UNKNOWN = { rpm: 5, rpd: 20 };
/** Stay under the provider's own limits: 90% of the daily quota and 80% of the per-minute quota. */
const DAILY_SAFETY = 0.9, MINUTE_SAFETY = 0.8;

export const DEFAULT_POOL = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

export function budgetsFor(ids: string[]): ModelBudget[] {
  const seen = new Set<string>();
  return ids.filter((id) => id && !seen.has(id) && seen.add(id)).map((id) => {
    const q = FREE_TIER[id] ?? UNKNOWN;
    return { id, perMinute: Math.max(1, Math.floor(q.rpm * MINUTE_SAFETY)), perDay: Math.max(1, Math.floor(q.rpd * DAILY_SAFETY)) };
  });
}
