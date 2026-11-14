# 09 — Keeping the CV, site and assistant in step

Everything the assistant knows comes from the same files that render the site, so one edit updates both.

| To change… | Edit | Then |
|---|---|---|
| The CV | Replace `public/cv/Arnav-Patnaik-CV.pdf`; update `cv` in `src/data/site.ts` (date) | Roles/education text in `src/data/experience.ts` should match |
| A role or degree | `src/data/experience.ts` (dates `YYYY-MM`, `end: null` = ongoing). Mark a bullet `hold: true` to keep it off the site and the assistant | Timeline, About tables, Résumé, assistant update automatically |
| A case study | `src/content/case-studies/*.md`. Leave a field out to hide its section. Set `draft: true` to keep it out of production | Add to `caseCovers` in `src/data/covers.ts` for a tile |
| A supporting project | `src/content/work/*.md`; cover in `src/data/covers.ts` | |
| A publication | `src/content/research/*.md` — copy author order and date **from the programme page**; set `status: verified` only after checking | |
| A skill | `src/data/skills.ts` (marquee) and `src/data/capabilities.ts`; every item needs an evidence link | |
| Contact details | `src/data/site.ts` | |
| Assistant behaviour | `src/lib/prompt.ts` (instructions), `src/lib/knowledge.ts` (what it knows) | Run the tests |

After any change: `npm run verify`. The tests will fail if a draft leaks, a phone number appears, a link breaks, a page loses a heading, or contrast drops below AA.

**Never** add a claim without a source. If a fact conflicts across documents, set `status: needs-review`: it is then excluded from pages **and** the assistant until you decide.

**New certificate images:** don't publish originals with ID numbers, QR codes, photos or family names. Adapt `scripts/build-redacted-degree.mjs` (it redacts at full resolution first), and **look at the output**.

**Regenerating derived assets:** `npm run assets` (favicons and the 1200×630 social image from `assets-source/`).
