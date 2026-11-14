> **Update, 14 November 2026:** the chatbot (assistant), the Gemini API and the Cloudflare Worker setup have been removed. The site is fully static and deploys on Vercel. Parts of this document that describe them are historical.

# 06 — Cost and capability table (dated 2026-11-07)

| Capability | Mode | Cost | Notes |
|---|---|---|---|
| Static pages, case studies, research, résumé, contact (mailto) | Free | $0 | Works with JavaScript off |
| Hosting on Cloudflare Workers | Free plan | $0 | 100k requests/day, 10 ms CPU per request |
| Strict AI usage gate (Durable Object, SQLite) | Free plan | $0 | 100k DO requests/day, 5 GB storage |
| **Local search + curated answers + navigation** | **Free (default)** | **$0** | Runs in the browser; nothing is sent anywhere |
| Browser voice input / spoken answers | Free | $0 | Depends on browser support; speech recognition may use the browser vendor's cloud service |
| Google Analytics 4 | Free, consent-gated | $0 | Loaded only after Accept |
| **AI answers (Gemini, free-tier model pool)** | **Conditional** | $0 within the free quota | Needs your key and `AI_ENABLED=true`. Capped below the free quota per model. Free-tier terms restrict EEA, Swiss and UK users: see docs/05 |
| Live voice conversation | Not built | n/a | See architecture doc |
| Domain, DNS | Yours | Unknown | I haven't assumed one |

## AI cost

Free tier, two models (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`), each capped by this site at 450 requests a day and 12 a minute, below Google's 500 and 15. About 900 AI answers a day at no charge, then the free built-in answers until the quota resets at midnight Pacific time. If you ever enable billing, remove the per-model caps only deliberately: they are what keeps the cost at zero.

## What each limit protects

| Limit | Refuses before the model is called |
|---|---|
| Same-origin check | Other sites spending your budget |
| `AI_ENABLED` / missing key or salt | Everything (fail closed) |
| Per-minute, per-visitor-per-day, global-per-day | Bursts, one heavy user, runaway total |
| Body ≤ 8 KB, message ≤ 500 chars, history ≤ 6 turns | Oversized prompts |
| 20 s timeout, one retry before any text | Hung requests, duplicate output |
