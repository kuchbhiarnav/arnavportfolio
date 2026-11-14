import { describe, expect, it } from 'vitest';
import { clientKey, readLimitedText, sameOrigin } from '../src/lib/security';

const req = (headers: Record<string, string>, url = 'https://site.example/api/ask', body?: string) => new Request(url, { method: 'POST', headers, body });

describe('same-origin check', () => {
  it('accepts the page\'s own origin', () => expect(sameOrigin(req({ origin: 'https://site.example' }))).toBe(true));
  it('rejects a foreign origin, a missing origin and cross-site fetches', () => {
    expect(sameOrigin(req({ origin: 'https://evil.example' }))).toBe(false);
    expect(sameOrigin(req({}))).toBe(false);
    expect(sameOrigin(req({ origin: 'https://site.example', 'sec-fetch-site': 'cross-site' }))).toBe(false);
    expect(sameOrigin(req({ origin: 'https://site.example', 'sec-fetch-site': 'same-site' }))).toBe(false);
  });
  it('accepts the configured SITE_URL origin (custom domain in front of the Worker)', () => {
    expect(sameOrigin(req({ origin: 'https://www.mysite.example' }), 'https://www.mysite.example/')).toBe(true);
    expect(sameOrigin(req({ origin: 'https://evil.example' }), 'not a url')).toBe(false);
  });
});

describe('client key', () => {
  it('is stable per IP+salt, differs by IP and salt, and does not contain the IP', async () => {
    const a = await clientKey(req({ 'cf-connecting-ip': '203.0.113.7' }), 'salt-one-salt-one');
    expect(await clientKey(req({ 'cf-connecting-ip': '203.0.113.7' }), 'salt-one-salt-one')).toBe(a);
    expect(await clientKey(req({ 'cf-connecting-ip': '203.0.113.8' }), 'salt-one-salt-one')).not.toBe(a);
    expect(await clientKey(req({ 'cf-connecting-ip': '203.0.113.7' }), 'salt-two-salt-two')).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(a).not.toContain('203');
  });
});

describe('bounded body reading', () => {
  it('returns the text when under the cap', async () => expect(await readLimitedText(req({}, undefined, 'hello'), 100)).toBe('hello'));
  it('refuses a body over the cap, with or without a content-length header', async () => {
    expect(await readLimitedText(req({ 'content-length': '5000' }, undefined, 'x'), 100)).toBeNull();
    expect(await readLimitedText(req({}, undefined, 'x'.repeat(500)), 100)).toBeNull();
  });
});
