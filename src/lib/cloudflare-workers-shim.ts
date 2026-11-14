/**
 * Stand-in for the Cloudflare-only `cloudflare:workers` module, used when the site is built for Vercel (see astro.config.mjs).
 * `env` is the process environment, and there is no USAGE_GATE binding, so the /api/ask route fails closed ("disabled")
 * and the assistant answers from the in-browser search only. The Durable Object class is never instantiated on Vercel.
 */
export const env: Record<string, unknown> = typeof process !== 'undefined' ? (process.env as Record<string, unknown>) : {};
export class DurableObject {}
