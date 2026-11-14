import { budgetsFor, DEFAULT_POOL, type ModelBudget } from './models';

/** Runtime configuration, parsed defensively from Worker vars/secrets. Pure: callers pass the env object. */

export interface AppConfig {
  /** True only when the owner opted in AND the key and salt exist. Everything else uses local search. */
  aiAvailable: boolean;
  aiEnabledFlag: boolean;
  /** Gemini API key. Server-side only. */
  apiKey?: string;
  salt?: string;
  /** Ordered model pool with per-model daily and per-minute caps. */
  models: ModelBudget[];
  siteUrl?: string;
  limits: { perMinute: number; perClientDaily: number; globalDaily: number; globalPerMinute: number; resetZone: string };
  requestTimeoutMs: number;
  maxOutputTokens: number;
}

const bool = (v: unknown) => typeof v === 'string' ? ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase()) : v === true;
const int = (v: unknown, def: number, min: number, max: number) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : def;
};
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

export function readConfig(e: Record<string, unknown>): AppConfig {
  const aiEnabledFlag = bool(e.AI_ENABLED);
  const apiKey = str(e.GEMINI_API_KEY);
  const pool = (str(e.GEMINI_MODELS) ?? DEFAULT_POOL.join(',')).split(',').map((m) => m.trim()).filter(Boolean);
  const salt = str(e.RATE_SALT);
  return {
    aiEnabledFlag,
    aiAvailable: aiEnabledFlag && !!apiKey && !!salt && salt.length >= 16,
    apiKey,
    salt,
    models: budgetsFor(pool),
    siteUrl: str(e.SITE_URL),
    limits: {
      // The pool's own per-model caps (models.ts) are the real ceiling; these cap visitors individually and the site as a whole.
      perMinute: int(e.AI_CLIENT_PER_MINUTE, 3, 1, 60),
      perClientDaily: int(e.AI_CLIENT_DAILY_LIMIT, 20, 1, 1000),
      globalDaily: int(e.AI_GLOBAL_DAILY_LIMIT, 800, 1, 100_000),
      globalPerMinute: int(e.AI_GLOBAL_PER_MINUTE, 20, 1, 1000),
      resetZone: str(e.AI_QUOTA_TIMEZONE) ?? 'America/Los_Angeles', // Google's free quotas reset at midnight Pacific time
    },
    requestTimeoutMs: int(e.AI_TIMEOUT_MS, 20_000, 3_000, 60_000),
    maxOutputTokens: int(e.AI_MAX_OUTPUT_TOKENS, 450, 100, 1500),
  };
}
