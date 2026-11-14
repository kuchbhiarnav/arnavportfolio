# 08 — Verification results (2026-11-07)

## Automated: all passing

| Check | Result |
|---|---|
| `astro check` (TypeScript 6.0.3) | 0 errors, 0 warnings |
| `astro build` | Clean; 14 prerendered routes; images optimised (6–7 MB covers → 20–35 KB WebP) |
| `vitest` | **140 tests, 13 files, all passing** |

Test coverage by area: assistant knowledge rules (7) · retrieval relevance on every suggested question plus off-topic and hostile probes (17) · navigation intents and allowlist safety (24) · stream protocol validation (6) · usage gate: burst, daily, global, refused-requests-don't-consume, rotation, pruning, atomicity (8) · configuration defaults and clamping (4) · same-origin, IP hashing, bounded bodies (6) · request schema and prompt-injection delimiters (8) · `/api/ask` route with a mocked model: defence order, fail-closed config, streaming, typed errors, key never leaks (12) · Gemini wrapper: retries, quota, abort, blocked, no duplicate output (8) · colour contrast of every real pairing, WCAG AA (20) · pages: metadata, honest content, links and anchors, redirects, weight budgets (19) · **axe-core WCAG 2.2 AA on every built page: 0 violations** (1).

## Manual, in the real runtime and browser

| Check | Result |
|---|---|
| Production build in workerd: all pages 200, unknown path 404, all 9 legacy URLs 301 to the right place | ✔ |
| API defaults: AI off → 503 `disabled`; cross-origin and origin-less → 403; GET → 405; `no-store` | ✔ |
| Usage gate with a fake key and burst limit 3: requests 1–3 stream, 4–5 get 429 + `Retry-After` and **no model call**; another client unaffected; global cap → `quota`; key/salt never in a response | ✔ |
| UI at cap: assistant explains, labels results "not AI-generated", offers sources | ✔ |
| Consent: zero Google requests before a choice; Accept stores and loads (never on localhost); footer reopens with focus inside; Decline clears `_ga` cookies | ✔ |
| Journey tabs, flip card (focus, inert faces, min date), project dialog (modal, Esc), degree hover preview, assistant (local answer, off-topic, navigation, persistence across pages) | ✔ |
| 375 px layout in a true 375 px iframe: found and fixed a 147 px horizontal overflow in the capabilities grid | ✔ |

## Not verified (honest limits)

- **(Historical, 8 Nov 2026; Gemini has since been removed and Ollama Cloud is the only AI service.) No real Gemini call was made.** The model path was exercised with a mocked SDK and an invalid key (clean `unavailable`).
- **Voice recognition** feature-detects and handles errors in code, but I could not speak into a microphone.
- **No screen-reader session** (VoiceOver/NVDA) and no keyboard-only pass by a person; axe-core covers rules that can be automated.
- Safari and Firefox not tested; Lighthouse not run; the browser pane's mobile emulation is unreliable (layout was checked in an iframe instead).
- External links (GSA, Microsoft Learn, Codebasics, Udemy, Fabric dashboards, GitHub) were not opened except the two GSA pages.
- Smooth-scroll and top-layer backdrop don't screenshot faithfully in the pane; verified via computed styles.
