import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/lib/config';

const key = 'k'.repeat(20), salt = 's'.repeat(24);

describe('configuration', () => {
  it('is OFF by default: nothing configured means zero API cost', () => {
    const c = readConfig({});
    expect(c.aiAvailable).toBe(false);
    expect(c.models.map((m) => m.id)).toEqual(['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
    expect(c.limits).toEqual({ perMinute: 3, perClientDaily: 20, globalDaily: 800, globalPerMinute: 20, resetZone: 'America/Los_Angeles' });
  });
  it('requires the owner flag AND a key AND a long-enough salt', () => {
    expect(readConfig({ AI_ENABLED: 'true', GEMINI_API_KEY: key, RATE_SALT: salt }).aiAvailable).toBe(true);
    expect(readConfig({ AI_ENABLED: 'false', GEMINI_API_KEY: key, RATE_SALT: salt }).aiAvailable).toBe(false);
    expect(readConfig({ AI_ENABLED: 'true', RATE_SALT: salt }).aiAvailable).toBe(false);
    expect(readConfig({ AI_ENABLED: 'true', GEMINI_API_KEY: key }).aiAvailable).toBe(false);
    expect(readConfig({ AI_ENABLED: 'true', GEMINI_API_KEY: key, RATE_SALT: 'short' }).aiAvailable).toBe(false);
  });
  it('treats unusual flag values as off, never as on', () => {
    for (const v of ['', 'no', '0', 'maybe', undefined, null, 0]) expect(readConfig({ AI_ENABLED: v, GEMINI_API_KEY: key, RATE_SALT: salt }).aiAvailable, String(v)).toBe(false);
  });
  it('clamps limits to sane bounds instead of trusting them', () => {
    const c = readConfig({ AI_GLOBAL_DAILY_LIMIT: '99999999', AI_CLIENT_DAILY_LIMIT: '-5', AI_CLIENT_PER_MINUTE: 'abc', AI_TIMEOUT_MS: '1', AI_MAX_OUTPUT_TOKENS: '999999' });
    expect(c.limits.globalDaily).toBe(100_000);
    expect(c.limits.perClientDaily).toBe(1);
    expect(c.limits.perMinute).toBe(3);
    expect(c.requestTimeoutMs).toBe(3000);
    expect(c.maxOutputTokens).toBe(1500);
  });

  it('builds the model pool with caps below the provider free quota, and gives unknown models the smallest cap', () => {
    const c = readConfig({ GEMINI_MODELS: 'gemini-3.5-flash-lite, gemini-3.8-flash, some-typo-model, gemini-3.5-flash-lite' });
    expect(c.models).toEqual([
      { id: 'gemini-3.5-flash-lite', perMinute: 12, perDay: 450 }, // 15 per minute and 500 per day at Google
      { id: 'gemini-3.8-flash', perMinute: 4, perDay: 18 },        // 5 and 20 at Google
      { id: 'some-typo-model', perMinute: 4, perDay: 18 },         // unknown: smallest free tier, never overspends
    ]);
  });
  it('uses Gemini only: a leftover key for any other service never enables AI', () => {
    expect(readConfig({ AI_ENABLED: 'true', OLLAMA_API_KEY: key, OPENAI_API_KEY: key, RATE_SALT: salt }).aiAvailable).toBe(false);
  });
});
