# 03 — Architecture and technology choices

Verified 2026-11-07 against the npm registry and vendor documentation.

## Astro vs Next.js

| Need | Astro 7 | Next.js |
|---|---|---|
| Mostly static, content-led site | Static HTML by default; JavaScript only where an island needs it | Ships a React runtime on every page |
| One interactive widget (assistant) | A React island that hydrates when idle | Whole-app React |
| Typed, validated content | Content collections with Zod schemas | Possible, but you build it |
| Three tiny API routes (server) | On-demand routes opt out per file | Native |
| Result here | Home page JavaScript: **77 KB gzipped** (React 64 + assistant 13) | Typically 80–100+ KB before any feature code |

**Practical trade-off:** Astro makes the public pages fast and keeps them working if JavaScript or the API fails. Next.js would make a large interactive app easier, which this site is not. **Committed to Astro.**

## Hosting: Cloudflare Workers

Checked: streaming responses are standard Web `ReadableStream`; secrets via `wrangler secret`; no wall-clock limit while a client is connected (CPU limit applies to compute, not waiting); Durable Objects are on the Free plan with the SQLite backend (100k requests/day) and give a **strict** shared counter; the Workers rate-limit binding is per-location and approximate, so it is only an optional extra. **Cloudflare Pages is no longer supported by the Astro adapter**, so the deploy target is a Worker.

## Versions actually installed

| Package | Version | Note |
|---|---|---|
| Node | 24.12.0 | Astro 7 needs ≥ 22.23.4 |
| astro | 7.4.7 | |
| @astrojs/cloudflare | 14.4.6 | peers: astro ^7.4, wrangler ^4.125 |
| @astrojs/react / react / react-dom | 7.1.4 / 19.3.1 | |
| @astrojs/sitemap | 3.7.4 | only enabled when `SITE_URL` is set |
| zod | 4.6.7 | |
| **typescript** | **6.0.3** | Latest is 7.0.2, but `@astrojs/check` (the only type-checker for `.astro` files) declares `^5 \|\| ^6`. Revisit when it adds 7 |
| vitest / jsdom / axe-core | 5.1.0 / 29.1.1 / 4.14.0 | jsdom 29 because 30–31 require Node ≥ 24.15 |
| wrangler | 4.158.0 | |
| sharp | 0.35.5 | build-time image optimisation |
| minisearch | 7.2.0 | lightweight BM25-style search, shared by browser and server |

## Structure

```
src/content/        case-studies, research, work   (Markdown + schema-validated frontmatter)
src/data/           site, experience, capabilities, skills, journey, covers
src/lib/            knowledge builder, search, intents, usage gate, Gemini wrapper and model pool, config, security
src/assistant/      React assistant, local answers, stream protocol, voice
src/pages/          pages + /api/ask, /api/assistant-config, /assistant/knowledge.json
src/worker.ts       Worker entry: Astro handler + the UsageGate Durable Object
```

One source of truth: **pages and the assistant's knowledge come from the same content and data modules.** `knowledge.json` is generated at build time.

## Assistant request flow

1. Browser: typed text → deterministic navigation parser (allowlisted paths only) → otherwise local search.
2. If AI mode is on: `POST /api/ask` → same-origin check → size cap → Zod validation → **Durable Object usage gate** → retrieval from approved knowledge → streamed Gemini call (timeout, one bounded retry, cancel on disconnect) → NDJSON events.
3. Any failure → the browser shows local passages with a plain-language notice.

## Not implemented, and why

- **Live voice conversation.** The Live API page documents WebSockets and recommends ephemeral tokens but not how to create them, session limits or regional terms; it is paid for EEA/Swiss/UK visitors and priced per audio minute. Voice input (browser speech recognition) and spoken answers (speech synthesis) are implemented instead.
- **Embeddings / vector search.** 45 short entries; measured relevance (tests) is sufficient.
- **Database, auth, agent frameworks.** Not needed.
