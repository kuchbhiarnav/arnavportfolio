# 02 — Positioning, story and key copy

## Three options, one selected

| Option | Statement | Evidence | Risk |
|---|---|---|---|
| A. Analyst | "Data analyst for climate and insurance" | Strong technical evidence | Hides the product and strategy work; undersells Plutas |
| **B. Climate and data professional (selected)** | "I turn complex environmental and business data into decisions, products, and stories people can use." | Matches the CV's own summary line and all three capability groups | Broad: relies on the case studies to make it concrete |
| C. Founder's-office / product strategist | "Product strategist with a data background" | Thin: one current role | Would inflate seniority |

Official titles are never rewritten: Data Analyst Intern, Data Consultant, Program Manager (Founder's Office), Machine Learning Intern.

## Career arc (used on Home and About)

Computer science and AI/ML foundations → applied analytics and environmental research → climate-tech and insurance product work → management studies that **broaden** the business perspective. About page: "Each layer builds on the one before; none replaces it."

## Key copy

- **Hero:** "Hi! I am Arnav Patnaik" (as before) plus: "a climate and data professional, turning **complex environmental and business data into decisions, products, and stories people can use.**"
- **Calls to action:** Explore my work · Download my CV (PDF, October 2026) · Ask about my experience.
- **Evidence strip:** 6.37M records prepared and visualised · 2 GSA abstracts as second author · Plutas Insure research, wireframes and investor materials.
- **Bio blurb:** "Along the way, I've worked at the intersection of data, climate technology, and early-stage startups… Small milestones, honest limits, and a constant curiosity for how data shapes decisions."
- **Thirty-second introduction (third person, for the assistant):** in `src/lib/knowledge.ts`, entry `profile.intro`.

## Three reading depths

| Depth | Where |
|---|---|
| ~30 seconds | Hero text + evidence strip + the two case-study tiles |
| ~3 minutes | Journey band, bio, capabilities with evidence links, timeline, research list |
| Detailed | Case studies (problem → decision → contribution → approach → outcomes with context → limits → sources) and research pages with exact author order |

## Information architecture

Home · Work (case studies + projects) · Case studies · Insights (Research & Insights) · About · Contact (the CV is a PDF that opens in a new tab; there is no Résumé page). Old URLs 301 to their new homes (`astro.config.mjs`; verified in workerd).
