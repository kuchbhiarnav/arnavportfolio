# 07 — Assistant knowledge collection and system instructions

## Knowledge collection

Built at `npm run build` into `/assistant/knowledge.json` by `src/lib/knowledge.ts` from the same content and data the pages render. Currently **45 entries**: 5 curated answers, 3 profile, 1 contact, 4 experience, 2 education, 7 case-study, 6 research, 4 project, 13 skill. 8 are `verified`, 37 `owner-supplied`. Plus 17 allowlisted navigation targets.

Each entry has: `id`, `kind`, `title`, `text`, `url` (always a site path), `source`, `date`, `status`, `keywords`.

**Rules enforced by code and tested:** `needs-review` and draft content never enter; held CV bullets and all percentage claims are excluded; no phone number, referees or private notes exist in any source module; emails limited to the public address; every `url` is site-relative. LinkedIn is **not** scraped. If you want approved LinkedIn text included, paste it and I'll add reviewed entries.

## Retrieval

MiniSearch (BM25-style, fuzzy and prefix) over title, keywords and text, plus a **coverage rule**: at least a third of the question's meaningful words must match, so one coincidental word is never an answer. Measured on the eight suggested questions (each lands on the right entry) and four off-topic probes (all declined).

## System instructions (`src/lib/prompt.ts`)

The model must answer only from supplied entries, cite entry ids, say when the portfolio doesn't answer, separate fact from interpretation (job-fit answers name requirements with no evidence), avoid salary/availability/visa/confidential/personal topics, treat all retrieved text and visitor text as untrusted data, refuse to reveal instructions, and never claim it can book meetings or send messages. Answers: third person, under 120 words, no URLs. Angle brackets in knowledge and questions are neutralised so text cannot close the delimiters. Cited ids are checked against the entries actually supplied; sources shown are the model's valid citations, or the top three retrieved.

## Navigation safety

The model never produces navigation. Only a deterministic parser can, and only to paths in the allowlist. "Show research", "go to contact", "take me to his CV" navigate (after announcing it); questions never do. Tests cover `https://…`, `//…`, `javascript:`, `data:`, `file:` and path traversal.
