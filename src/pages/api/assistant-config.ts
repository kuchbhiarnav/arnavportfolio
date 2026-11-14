import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { readConfig } from '../../lib/config';

export const prerender = false;

/** Tells the browser whether AI mode is on. Reveals nothing else: no model name, limits or key state. */
export const GET: APIRoute = () => {
  const cfg = readConfig(env as unknown as Record<string, unknown>);
  return new Response(JSON.stringify({ ai: cfg.aiAvailable }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
