# 04 — Case-study structure and evidence checklist

## Reusable structure

A case study is one Markdown file in `src/content/case-studies/` whose frontmatter drives the page and the assistant. Sections render only when they have content, so there are no empty headings.

`problem` · `intendedDecision` · `org` / `period` / `role` (official title) / `collaborators` · `constraints` / `data` · `contribution` (first person, from your CV) · `approach` / `tradeoffs` · `outputs` · `outcomes` + `outcomeContext` (what was and was not measured) · `limitations` / `learning` · `tools` · `sources` · `status` (`verified` | `owner-supplied` | `needs-review`) · `draft` + `blockedBy` · `updated`.

## What each case study still needs from you

### 1. Groundwater arsenic decision support (published)
- [ ] Your exact contribution versus the team's (the abstracts describe the team's system).
- [ ] Whether it was a research prototype, a delivered tool, or both.
- [ ] Your account of one or two real tradeoffs (the `tradeoffs` section is empty on purpose: the sources don't state any).
- [ ] Permission and data licence for dashboard screenshots; real screenshots to replace the typographic cover.
- [ ] The measurement basis for +20% / +25% / −40%, or confirm they stay off the case study.
- [ ] Classifier validation metrics, if you want a result stated.

### 2. Parametric insurance platform, Plutas Insure (published, deliberately thin)
- [ ] What may be public (active startup, you are an employee).
- [ ] Stage, in your words: concept, prototype, pilot, launched?
- [ ] Any outcome of the competition/institution submissions (none is claimed).
- [ ] A wireframe or screenshot you may show.

### 3. Climate data pipelines (draft, never built for production)
- [ ] **Employer**: Plutas.ai or DigiSafe (conflict C3).
- [ ] Role, period, what the pipelines fed, outputs.
- [ ] IMD and ERA5 licence terms; employer permission.
- To publish: set `draft: false`, `status: owner-supplied`, fill the fields, rebuild.

### Deepfake paper
- [ ] Exact title, authors, venue and date from the IEEE record (C12).
