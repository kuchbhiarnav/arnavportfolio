# 05 — Setup and environment

## Run it locally

```bash
cd archive
npm install            # if npm reports a root-owned cache, use: npm install --cache /tmp/npm-cache
npm run dev            # http://localhost:4321
npm run verify         # type-check + build + all tests
```

If `npm install` fails with `EACCES` on `~/.npm`, an old npm bug left root-owned files in your cache. Either pass `--cache /some/folder` as above, or run `sudo chown -R $(id -u):$(id -g) ~/.npm` once yourself. I did not change your cache permissions.

## Configuration

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `SITE_URL` | build-time env | unset | Canonical origin. **Unset means no canonical URLs, no absolute social-image URL and no sitemap**: the build never guesses a domain. Set it before deploying |
| `AI_ENABLED` | `wrangler.jsonc` vars | `false` | Owner kill switch. **AI is off by default** |
| `GEMINI_API_KEY` | secret | none | Server-only. `wrangler secret put GEMINI_API_KEY` (Google AI Studio) |
| `RATE_SALT` | secret | none | ≥ 16 random characters; salts the IP hash used only for counters |
| `GEMINI_MODELS` | var | `gemini-3.5-flash-lite,gemini-3.1-flash-lite` | Ordered pool. Each model has its own daily and per-minute cap in `src/lib/models.ts`, below Google's free tier. Unknown model ids get the smallest cap |
| `AI_GLOBAL_DAILY_LIMIT` | var | `800` | Hard cap on AI requests per UTC day, all visitors |
| `AI_CLIENT_DAILY_LIMIT` | var | `20` | Per visitor per Pacific-time day |
| `AI_CLIENT_PER_MINUTE` | var | `3` | Burst limit |
| `AI_TIMEOUT_MS` / `AI_MAX_OUTPUT_TOKENS` | var | `20000` / `450` | Bounds |

Local secrets go in `.dev.vars` (git-ignored; copy from `.dev.vars.example`). Nothing secret is bundled for the browser: the key is read only inside the Worker, and tests assert it never appears in a response.

## Turning on AI mode (needs your decision; nothing was activated for visitors)

1. Create a key in Google AI Studio. **Free-tier terms:** Google may use prompts to improve its products, and its terms say API clients made available to users in the EEA, Switzerland or the UK must use paid services. Your visitors can include people there, so recheck <https://ai.google.dev/gemini-api/terms> before launch, or enable billing.
2. `wrangler secret put GEMINI_API_KEY` and `wrangler secret put RATE_SALT` (at least 16 random characters).
3. Set `AI_ENABLED` to `"true"` in `wrangler.jsonc`, redeploy, and update `src/pages/privacy.astro` (it currently says AI answers are off).
4. Check `curl https://your-domain/api/assistant-config` returns `{"ai":true}`.

### How the model pool stays inside the free limits

- The usage gate (a Durable Object) picks the first model in `GEMINI_MODELS` that still has budget today and this minute, and counts the request against that model before any call is made. Caps are 90% of the daily and 80% of the per-minute free quota in your Google table: 450 per day and 12 per minute for each Flash Lite model (500 and 15 at Google). Two models give about 900 AI answers a day. Visitors then get the free built-in answers until midnight Pacific time, when Google's quotas reset.
- If Google reports a quota or availability error before any text, that model rests for the minute and the next one answers. If every model is used up the site uses the built-in answers, at zero cost.
- Thinking is set to minimal: answers start in under a second. Gemma models are not used (they print their reasoning into the reply, and have a 16K tokens-per-minute limit). `gemini-3.8-flash` is not used (20 requests a day, and it timed out in testing).
- This caps requests, not tokens. A question is about 3,500 tokens against a 250,000 per-minute limit, so tokens are not the constraint.

## Analytics

GA4 `G-4C1Y2YKWNK` loads only after a visitor accepts the banner, never on localhost, and never receives text typed into the assistant or the contact form. To exclude your own visits on the live site, run `localStorage.setItem('archive:internal','1')` once in your browser's console.

## Deploying (not done: needs your approval and accounts)

`npm run build` → `npx wrangler deploy` (Workers, from `dist/`). Custom domain and DNS are yours to set. Verify after deploying: redirects, `/api/assistant-config`, `/robots.txt`, social preview (needs `SITE_URL`).

## Things only you can do

Remove from the live site: `assets/about/Degree.jpg`, `Degree.pdf`, `resume.pdf`, and `Samples/`. Provide a domain. Decide on the video and the cover art.

## Local AI mode
- `.dev.vars` (git-ignored) holds `AI_ENABLED=true`, `GEMINI_API_KEY` and a random `RATE_SALT`. The public configuration in `wrangler.jsonc` still has AI off.
- The Cloudflare adapter copies `.dev.vars` into `dist/server/` during a build. Delete `dist/server/.dev.vars` after building and never upload `dist` as-is; production secrets go in with `wrangler secret put`.
- Reset the local counters by deleting `.wrangler/state` (Miniflare's Durable Object storage) if you have used up the day's local budget while testing.
- The only AI service this site calls is Google's Gemini API (`src/lib/gemini.ts`).
